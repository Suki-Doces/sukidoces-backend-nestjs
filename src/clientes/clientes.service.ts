import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IUsuarioRepository, USUARIO_REPOSITORY } from '../common/repositories/interfaces/usuario-repository.interface';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { buildSuccessResponse } from '../common/responses/api-response';
import { clampPagination } from '../common/utils/pagination.util';

@Injectable()
export class ClientesService {
  private readonly saltRounds: number;

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: IUsuarioRepository,
    private readonly configService: ConfigService,
  ) {
    this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 12;
  }

  async listar(query: Record<string, any>) {
    try {
      const { page, limit, skip } = clampPagination(query.page, query.limit, 10);

      const clientes = await this.usuarioRepository.findClientes({ skip, take: limit });

      const clientesFormatados = clientes.map((c) => ({
        id_cliente: c.id_usuario,
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        data_cadastro: c.data_criacao,
        status: c.status_id ? 'ativo' : 'inativo',
        valor_total: c.pedidos.reduce((total, p) => total + Number(p.valor_total), 0),
        total_pedidos: c.pedidos.length,
      }));

      const total = await this.usuarioRepository.countClientes();

      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      const totalNovosClientesGlobal = await this.usuarioRepository.countClientes(seteDiasAtras);

      const totalPages = Math.ceil(total / limit);

      return buildSuccessResponse('Clientes carregados com sucesso', {
        clientes: clientesFormatados,
        pagination: { total, page, limit, totalPages },
        estatisticas: { novosClientesUltimos7Dias: totalNovosClientesGlobal },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar clientes');
    }
  }

  async estatisticasNovos() {
    try {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      const totalNovos = await this.usuarioRepository.countClientes(seteDiasAtras);
      return buildSuccessResponse('Estatísticas carregadas com sucesso', { totalNovos });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar estatísticas');
    }
  }

  async criar(dto: CreateClienteDto) {
    try {
      const senhaHash = await bcrypt.hash(dto.senha, this.saltRounds);

      const novoCliente = await this.usuarioRepository.createCliente({
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        status_id: dto.status === 'ativo',
      });

      return buildSuccessResponse('Cliente criado com sucesso', { cliente: novoCliente });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar cliente');
    }
  }

  async atualizar(id: string, dto: UpdateClienteDto) {
    try {
      const dadosAtualizados: Record<string, any> = {
        ...(dto.nome !== undefined && { nome: dto.nome }),
        ...(dto.status !== undefined && { status_id: dto.status === 'ativo' }),
      };

      if (dto.senha && dto.senha.trim() !== '') {
        dadosAtualizados.senha = await bcrypt.hash(dto.senha, this.saltRounds);
      }

      const clienteAtualizado = await this.usuarioRepository.updateCliente(Number(id), dadosAtualizados);

      return buildSuccessResponse('Cliente atualizado com sucesso', { cliente: clienteAtualizado });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao atualizar cliente');
    }
  }

  async remover(id: string) {
    try {
      await this.usuarioRepository.deleteById(Number(id));
      return buildSuccessResponse('Cliente removido com sucesso');
    } catch (error) {
      throw new InternalServerErrorException('Erro ao deletar cliente');
    }
  }
}
