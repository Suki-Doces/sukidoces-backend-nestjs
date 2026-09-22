import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificacaoEntity } from '../database/entities/notificacao.entity';
import { buildSuccessResponse } from '../common/responses/api-response';
import { clampPagination } from '../common/utils/pagination.util';

@Injectable()
export class NotificacoesService {
  constructor(
    @InjectRepository(NotificacaoEntity)
    private readonly repo: Repository<NotificacaoEntity>,
  ) {}

  async listar(usuarioId: number, query: Record<string, any>) {
    try {
      const { page, limit, skip } = clampPagination(query.page, query.limit, 4);

      const notifications = await this.repo.find({
        where: { id_usuario: usuarioId },
        order: { data_criacao: 'DESC' },
        take: limit,
        skip,
      });

      const total = await this.repo.count({ where: { id_usuario: usuarioId } });
      const unreadCount = await this.repo.count({ where: { id_usuario: usuarioId, lido: false } });

      const totalPages = Math.ceil(total / limit);

      return buildSuccessResponse('Notificações carregadas com sucesso', {
        notifications,
        unreadCount,
        pagination: { total, page, limit, totalPages },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar notificações');
    }
  }

  async marcarLida(usuarioId: number, id: string) {
    try {
      const updated = await this.repo.update(
        { id_notificacao: Number(id), id_usuario: usuarioId },
        { lido: true },
      );

      if (!updated.affected) {
        throw new ForbiddenException('Não autorizado ou notificação inexistente');
      }
      return buildSuccessResponse('Notificação marcada como lida');
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar notificação');
    }
  }

  async marcarTodasLidas(usuarioId: number) {
    try {
      await this.repo.update({ id_usuario: usuarioId }, { lido: true });
      return buildSuccessResponse('Todas as notificações marcadas como lidas');
    } catch (error) {
      throw new InternalServerErrorException('Erro ao limpar notificações');
    }
  }

  async remover(usuarioId: number, id: string) {
    try {
      const deleted = await this.repo.delete({ id_notificacao: Number(id), id_usuario: usuarioId });

      if (!deleted.affected) {
        throw new ForbiddenException('Não autorizado ou notificação inexistente');
      }
      return buildSuccessResponse('Notificação deletada');
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Erro ao deletar notificação');
    }
  }
}
