import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IUsuarioRepository, USUARIO_REPOSITORY } from '../common/repositories/interfaces/usuario-repository.interface';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ChangeSenhaDto } from './dto/change-senha.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { buildSuccessResponse } from '../common/responses/api-response';

// Cancelar pedido virou o CancelarPedidoUseCase (./use-cases). Aqui ficaram
// as operações de perfil/consulta do usuário.
@Injectable()
export class UsuarioService {
  private readonly saltRounds: number;

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: IUsuarioRepository,
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly configService: ConfigService,
  ) {
    this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 12;
  }

  async getPerfil(usuarioId: number) {
    const usuario = await this.usuarioRepository.findByIdSafe(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return buildSuccessResponse('Perfil carregado com sucesso', { user: usuario });
  }

  async updatePerfil(usuarioId: number, dto: UpdatePerfilDto, file?: Express.Multer.File) {
    const { nome, telefone, cpf, data_nascimento } = dto;

    let enderecos = dto.enderecos;
    if (typeof enderecos === 'string') {
      enderecos = JSON.parse(enderecos);
    }

    const dadosParaAtualizar: Record<string, any> = {
      ...(nome && { nome: nome.trim() }),
      ...(telefone !== undefined && { telefone }),
      ...(cpf !== undefined && { cpf }),
      ...(enderecos !== undefined && { enderecos }),
      ...(data_nascimento !== undefined && {
        data_nascimento: data_nascimento ? new Date(data_nascimento) : null,
      }),
    };

    if (file) {
      const fotoUrl = await this.cloudinary.uploadProductImage(file.buffer);
      if (fotoUrl) {
        dadosParaAtualizar.foto_perfil = fotoUrl;
      }
    }

    const atualizado = await this.usuarioRepository.updatePerfil(usuarioId, dadosParaAtualizar);
    return buildSuccessResponse('Dados atualizados com sucesso', { user: atualizado });
  }

  async changeSenha(usuarioId: number, dto: ChangeSenhaDto) {
    const { senhaAtual, novaSenha } = dto;

    if (!senhaAtual || !novaSenha) {
      throw new BadRequestException('Senha atual e nova senha são obrigatórias');
    }
    if (novaSenha.length < 6) {
      throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres');
    }

    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    await this.usuarioRepository.updateSenha(usuarioId, await bcrypt.hash(novaSenha, this.saltRounds));
    return buildSuccessResponse('Senha alterada com sucesso');
  }

  async getMeusPedidos(usuarioId: number) {
    const pedidos = await this.pedidoRepository.findByUsuario(usuarioId);
    return buildSuccessResponse('Pedidos carregados com sucesso', pedidos);
  }
}
