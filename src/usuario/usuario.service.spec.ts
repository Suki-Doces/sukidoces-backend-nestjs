import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsuarioService } from './usuario.service';
import { USUARIO_REPOSITORY } from '../common/repositories/interfaces/usuario-repository.interface';
import { PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { PedidoEntity } from '../database/entities/pedido.entity';
import { ProdutoEntity } from '../database/entities/produto.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let usuarioRepository: any;
  let pedidoRepository: any;
  let cloudinary: any;
  let eventEmitter: any;

  beforeEach(async () => {
    usuarioRepository = {
      findByIdSafe: jest.fn(),
      findById: jest.fn(),
      updatePerfil: jest.fn(),
      updateSenha: jest.fn(),
    };

    pedidoRepository = {
      findByUsuario: jest.fn(),
      findByIdWithItens: jest.fn(),
      runTransaction: jest.fn(),
    };

    cloudinary = { uploadProductImage: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        { provide: USUARIO_REPOSITORY, useValue: usuarioRepository },
        { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
  });

  it('deve retornar perfil do usuário quando existir', async () => {
    usuarioRepository.findByIdSafe.mockResolvedValue({
      id_usuario: 1,
      nome: 'Maria',
      email: 'maria@email.com',
    });

    const result = await service.getPerfil(1);

    expect(result.success).toBe(true);
    expect(result.data.user.nome).toBe('Maria');
  });

  it('deve lançar erro quando usuário não existir', async () => {
    usuarioRepository.findByIdSafe.mockResolvedValue(null);

    await expect(service.getPerfil(999)).rejects.toThrow('Usuário não encontrado');
  });

  it('deve rejeitar cancelamento de pedido de outro usuário', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue({
      id_pedido: 10,
      id_usuario: 2,
      status: 'pendente',
      data_pedido: new Date(),
      itens_pedido: [],
    });

    await expect(service.cancelarPedido(1, 10)).rejects.toThrow(
      'Você não tem permissão para cancelar este pedido.',
    );
  });

  it('deve rejeitar cancelamento de pedido já entregue', async () => {
    pedidoRepository.findByIdWithItens.mockResolvedValue({
      id_pedido: 10,
      id_usuario: 1,
      status: 'entregue',
      data_pedido: new Date(),
      itens_pedido: [],
    });

    await expect(service.cancelarPedido(1, 10)).rejects.toThrow(
      'Pedidos entregues não podem ser cancelados',
    );
  });

  it('deve rejeitar cancelamento fora do prazo de 2 horas', async () => {
    const tresHorasAtras = new Date(Date.now() - 3 * 60 * 60 * 1000);
    pedidoRepository.findByIdWithItens.mockResolvedValue({
      id_pedido: 10,
      id_usuario: 1,
      status: 'pendente',
      data_pedido: tresHorasAtras,
      itens_pedido: [],
    });

    await expect(service.cancelarPedido(1, 10)).rejects.toThrow(/prazo de 2 horas/);
  });

  it('deve cancelar pedido dentro do prazo e emitir evento', async () => {
    const agora = new Date();
    pedidoRepository.findByIdWithItens.mockResolvedValue({
      id_pedido: 10,
      id_usuario: 1,
      status: 'pendente',
      data_pedido: agora,
      itens_pedido: [{ id_produto: 5, quantidade: 2 }],
    });

    pedidoRepository.runTransaction.mockImplementation(async (fn: any) => {
      const fakePedidoRepo = {
        update: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue({ id_pedido: 10, status: 'cancelado' }),
      };
      const fakeProdutoRepo = { increment: jest.fn().mockResolvedValue({}) };

      const manager = {
        getRepository: (entity: any) => {
          if (entity === PedidoEntity) return fakePedidoRepo;
          if (entity === ProdutoEntity) return fakeProdutoRepo;
          throw new Error(`Entidade inesperada no teste: ${entity}`);
        },
      };
      return fn(manager);
    });

    const result = await service.cancelarPedido(1, 10);

    expect(result.success).toBe(true);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin-notification.pedido-cancelado',
      expect.objectContaining({ idPedido: 10 }),
    );
  });
});
