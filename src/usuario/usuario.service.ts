import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { IUsuarioRepository, USUARIO_REPOSITORY } from '../common/repositories/interfaces/usuario-repository.interface';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { PedidoEntity } from '../database/entities/pedido.entity';
import { ProdutoEntity } from '../database/entities/produto.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ChangeSenhaDto } from './dto/change-senha.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import {
  ADMIN_NOTIFICATION_EVENTS,
  PedidoCanceladoEvent,
} from '../notifications/admin-notification.events';
import { buildSuccessResponse } from '../common/responses/api-response';
import { PedidoStatus } from '../common/enums/pedido-status.enum';

@Injectable()
export class UsuarioService {
  private readonly saltRounds: number;

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: IUsuarioRepository,
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
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

    const novoHash = await bcrypt.hash(novaSenha, this.saltRounds);
    await this.usuarioRepository.updateSenha(usuarioId, novoHash);

    return buildSuccessResponse('Senha alterada com sucesso');
  }

  async getMeusPedidos(usuarioId: number) {
    const pedidos = await this.pedidoRepository.findByUsuario(usuarioId);
    return buildSuccessResponse('Pedidos carregados com sucesso', pedidos);
  }

  async cancelarPedido(usuarioId: number, idPedido: number) {
    const pedido = await this.pedidoRepository.findByIdWithItens(idPedido);

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    if (pedido.id_usuario !== usuarioId) {
      throw new ForbiddenException('Você não tem permissão para cancelar este pedido.');
    }
    if (pedido.status === PedidoStatus.CANCELADO) {
      throw new BadRequestException('Este pedido já foi cancelado');
    }
    if (pedido.status === PedidoStatus.ENTREGUE) {
      throw new BadRequestException('Pedidos entregues não podem ser cancelados');
    }

    const dataCompra = new Date(pedido.data_pedido);
    const agora = new Date();
    const diferencaHoras = (agora.getTime() - dataCompra.getTime()) / (1000 * 60 * 60);

    if (diferencaHoras > 2) {
      const horasPassadas = diferencaHoras.toFixed(1);
      throw new BadRequestException(
        `O prazo de 2 horas para cancelamento expirou (${horasPassadas}h após a compra). Entre em contato com o suporte.`,
      );
    }

    const pedidoCancelado = await this.pedidoRepository.runTransaction(async (manager) => {
      const pedidoRepo = manager.getRepository(PedidoEntity);
      const produtoRepo = manager.getRepository(ProdutoEntity);

      await pedidoRepo.update({ id_pedido: idPedido }, { status: PedidoStatus.CANCELADO });

      for (const item of pedido.itens_pedido) {
        await produtoRepo.increment({ id_produto: item.id_produto }, 'quantidade', item.quantidade);
      }

      return pedidoRepo.findOne({ where: { id_pedido: idPedido } });
    });

    this.eventEmitter.emit(
      ADMIN_NOTIFICATION_EVENTS.PEDIDO_CANCELADO,
      new PedidoCanceladoEvent(idPedido),
    );

    return buildSuccessResponse('Pedido cancelado com sucesso', { pedido: pedidoCancelado });
  }
}
