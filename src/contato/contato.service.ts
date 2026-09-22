import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContatoMensagemEntity } from '../database/entities/contato-mensagem.entity';
import { CreateContatoDto } from './dto/create-contato.dto';
import { buildSuccessResponse } from '../common/responses/api-response';
import { UsuarioPayload } from '../common/types/request-with-user.type';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class ContatoService {
  constructor(
    @InjectRepository(ContatoMensagemEntity)
    private readonly contatoRepo: Repository<ContatoMensagemEntity>,
  ) {}

  async criar(dto: CreateContatoDto, usuario?: UsuarioPayload) {
    try {
      const contato = await this.contatoRepo.save(
        this.contatoRepo.create({
          nome: dto.nome,
          email: dto.email,
          telefone: dto.telefone,
          assunto: dto.assunto,
          mensagem: dto.mensagem,
          id_usuario: usuario && usuario.role !== UserRole.ADMIN ? usuario.id : undefined,
        }),
      );

      return buildSuccessResponse('Mensagem recebida com sucesso. Em breve entraremos em contato.', {
        id: contato.id_contato,
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao salvar a mensagem. Tente novamente mais tarde.');
    }
  }

  async meuHistorico(usuario?: UsuarioPayload) {
    if (!usuario || usuario.role === UserRole.ADMIN) {
      throw new HttpException('Acesso negado.', 403);
    }

    try {
      const messages = await this.contatoRepo.find({
        where: { id_usuario: usuario.id },
        order: { data_criacao: 'DESC' },
      });
      return buildSuccessResponse('Histórico carregado com sucesso', { messages });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar histórico de mensagens.');
    }
  }

  async listarAdmin() {
    try {
      const messages = await this.contatoRepo.find({ order: { data_criacao: 'DESC' } });
      return buildSuccessResponse('Mensagens carregadas com sucesso', { messages });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar mensagens.');
    }
  }

  async responder(id: string, resposta: string) {
    const contato = await this.contatoRepo.findOne({ where: { id_contato: Number(id) } });
    if (!contato) {
      throw new NotFoundException('Mensagem não encontrada.');
    }

    try {
      await this.contatoRepo.update(
        { id_contato: Number(id) },
        { respondido: true, resposta: resposta.trim(), data_resposta: new Date() },
      );
      const updated = await this.contatoRepo.findOne({ where: { id_contato: Number(id) } });
      return buildSuccessResponse('Resposta gravada com sucesso.', { contato: updated });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao gravar a resposta.');
    }
  }
}
