import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CarrinhoService } from './carrinho.service';
import { CarrinhoItemEntity } from '../database/entities/carrinho-item.entity';

describe('CarrinhoService', () => {
  let service: CarrinhoService;
  let carrinhoRepo: any;

  beforeEach(async () => {
    carrinhoRepo = { find: jest.fn(), findOne: jest.fn(), update: jest.fn(), delete: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarrinhoService, { provide: getRepositoryToken(CarrinhoItemEntity), useValue: carrinhoRepo }],
    }).compile();
    service = module.get(CarrinhoService);
  });

  it('aplica frete grátis quando o subtotal é >= 50', async () => {
    carrinhoRepo.find.mockResolvedValue([{ id: 1, quantidade: 2, produto: { preco: 30 } }]);
    const result = await service.listar(1);
    expect(result.data.subtotal).toBe(60);
    expect(result.data.freteGratis).toBe(true);
    expect(result.data.frete).toBe(0);
  });

  it('cobra frete de 8,90 abaixo de 50', async () => {
    carrinhoRepo.find.mockResolvedValue([{ id: 1, quantidade: 1, produto: { preco: 10 } }]);
    const result = await service.listar(1);
    expect(result.data.frete).toBe(8.9);
    expect(result.data.total).toBeCloseTo(18.9);
  });

  it('403 ao mexer no item de outro usuário', async () => {
    carrinhoRepo.findOne.mockResolvedValue({ id: 1, usuario_id: 2 });
    await expect(service.remover(1, '1')).rejects.toThrow('Não autorizado ou item não encontrado');
  });

  it('rejeita atualizar quantidade acima do estoque', async () => {
    carrinhoRepo.findOne.mockResolvedValue({ id: 1, usuario_id: 1, produto: { quantidade: 2 } });
    await expect(service.atualizarQuantidade(1, '1', 5)).rejects.toThrow('Estoque insuficiente');
  });
});
