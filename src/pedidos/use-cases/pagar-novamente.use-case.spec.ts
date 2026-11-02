import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PagarNovamenteUseCase } from './pagar-novamente.use-case';
import { PEDIDO_REPOSITORY } from '../../common/repositories/interfaces/pedido-repository.interface';

describe('PagarNovamenteUseCase', () => {
  let useCase: PagarNovamenteUseCase;
  let pedidoRepository: any;
  let eventEmitter: any;

  beforeEach(async () => {
    pedidoRepository = { findById: jest.fn(), updateStatus: jest.fn() };
    eventEmitter = { emit: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagarNovamenteUseCase,
        { provide: PEDIDO_REPOSITORY, useValue: pedidoRepository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();
    useCase = module.get(PagarNovamenteUseCase);
  });

  const pedido = (over: Record<string, any> = {}) => ({
    id_pedido: 1, id_usuario: 1, status: 'pendente', data_pedido: new Date(), ...over,
  });

  it('404 quando o pedido não existe', async () => {
    pedidoRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute(1, 1)).rejects.toThrow('Pedido não encontrado');
  });

  it('403 quando o pedido é de outro usuário', async () => {
    pedidoRepository.findById.mockResolvedValue(pedido({ id_usuario: 2 }));
    await expect(useCase.execute(1, 1)).rejects.toThrow('Você não tem permissão.');
  });

  it('400 quando o pedido já foi processado', async () => {
    pedidoRepository.findById.mockResolvedValue(pedido({ status: 'pago' }));
    await expect(useCase.execute(1, 1)).rejects.toThrow('Pedido já processado');
  });

  it('paga um pedido pendente e emite o evento', async () => {
    pedidoRepository.findById.mockResolvedValue(pedido());
    pedidoRepository.updateStatus.mockResolvedValue({ id_pedido: 1, status: 'pago' });

    const result = await useCase.execute(1, 1);

    expect(result.success).toBe(true);
    expect(pedidoRepository.updateStatus).toHaveBeenCalledWith(1, 'pago');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'admin-notification.pedido-pago',
      expect.objectContaining({ idPedido: 1 }),
    );
  });
});
