import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CarrinhoService } from './carrinho.service';
import { CarrinhoItemEntity } from '../database/entities/carrinho-item.entity';
import { ProdutoEntity } from '../database/entities/produto.entity';

describe('CarrinhoService', () => {
  let service: CarrinhoService;
  let carrinhoRepo: any;
  let produtoRepo: any;

  beforeEach(async () => {
    carrinhoRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    produtoRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarrinhoService,
        { provide: getRepositoryToken(CarrinhoItemEntity), useValue: carrinhoRepo },
        { provide: getRepositoryToken(ProdutoEntity), useValue: produtoRepo },
      ],
    }).compile();

    service = module.get<CarrinhoService>(CarrinhoService);
  });

  it('deve rejeitar adicionar produto sem estoque suficiente', async () => {
    produtoRepo.findOne.mockResolvedValue({ id_produto: 1, quantidade: 1 });

    await expect(service.adicionar(1, { id_produto: 1, quantidade: 5 })).rejects.toThrow(
      'Estoque insuficiente',
    );
  });

  it('deve rejeitar adicionar produto inexistente', async () => {
    produtoRepo.findOne.mockResolvedValue(null);

    await expect(service.adicionar(1, { id_produto: 999, quantidade: 1 })).rejects.toThrow(
      'Produto não encontrado',
    );
  });

  it('deve adicionar produto novo ao carrinho com sucesso', async () => {
    produtoRepo.findOne.mockResolvedValue({ id_produto: 1, quantidade: 10 });
    carrinhoRepo.findOne.mockResolvedValue(null);

    const result = await service.adicionar(1, { id_produto: 1, quantidade: 2 });

    expect(result.success).toBe(true);
    expect(carrinhoRepo.save).toHaveBeenCalled();
  });

  it('deve aplicar frete grátis quando subtotal >= 50', async () => {
    carrinhoRepo.find.mockResolvedValue([{ id: 1, quantidade: 2, produto: { preco: 30 } }]);

    const result = await service.listar(1);

    expect(result.data.subtotal).toBe(60);
    expect(result.data.freteGratis).toBe(true);
    expect(result.data.frete).toBe(0);
  });
});
