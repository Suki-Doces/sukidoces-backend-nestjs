import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificacaoEntity } from '../database/entities/notificacao.entity';
import { IAdministradorRepository, ADMINISTRADOR_REPOSITORY } from '../common/repositories/interfaces/administrador-repository.interface';
import { ADMIN_NOTIFICATION_EVENTS,
  PedidoCanceladoEvent,
  PedidoCriadoEvent,
  PedidoPagoEvent,
  PedidoStatusAtualizadoEvent,
  UsuarioRegistradoEvent,
} from './admin-notification.events';

@Injectable()
export class AdminNotificationListener {
  private readonly logger = new Logger(AdminNotificationListener.name);

  constructor(
    @InjectRepository(NotificacaoEntity)
    private readonly notificacaoRepo: Repository<NotificacaoEntity>,
    @Inject(ADMINISTRADOR_REPOSITORY) private readonly administradorRepository: IAdministradorRepository,
  ) {}

  private async notificarAdmin(titulo: string, mensagem: string, tipo: string) {
    try {
      const admin = await this.administradorRepository.findFirst();
      if (!admin) return;

      await this.notificacaoRepo.save(
        this.notificacaoRepo.create({
          id_usuario: admin.id_admin,
          titulo,
          mensagem,
          tipo,
          lido: false,
        }),
      );
    } catch (error) {
      this.logger.error('Erro ao criar notificação de admin:', error);
    }
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.USUARIO_REGISTRADO)
  async aoRegistrarUsuario(event: UsuarioRegistradoEvent) {
    await this.notificarAdmin('Novo Cadastro!', `Novo cadastro! ${event.nomeUsuario} criou uma conta.`, 'usuario');
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.PEDIDO_CRIADO)
  async aoCriarPedido(event: PedidoCriadoEvent) {
    await this.notificarAdmin('Novo Pedido Suki Doces!', `Pedido #${event.idPedido} de R$ ${event.valorTotal.toFixed(2)}.`, 'venda');
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.PEDIDO_PAGO)
  async aoPagarPedido(event: PedidoPagoEvent) {
    await this.notificarAdmin('Pagamento Confirmado!', `Pedido #${event.idPedido} pago.`, 'venda');
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.PEDIDO_STATUS_ATUALIZADO)
  async aoAtualizarStatus(event: PedidoStatusAtualizadoEvent) {
    await this.notificarAdmin('Atualização de Status!', `O Pedido #${event.idPedido} foi atualizado para: ${event.novoStatus.toUpperCase()}.`, 'pedido');
  }

  @OnEvent(ADMIN_NOTIFICATION_EVENTS.PEDIDO_CANCELADO)
  async aoCancelarPedido(event: PedidoCanceladoEvent) {
    await this.notificarAdmin('Pedido Cancelado', `O pedido #${event.idPedido} foi cancelado pelo cliente.`, 'cancelamento');
  }
}
