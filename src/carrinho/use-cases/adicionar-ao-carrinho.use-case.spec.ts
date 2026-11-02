import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdicionarAoCarrinhoUseCase } from './adicionar-ao-carrinho.use-case';
import { CarrinhoItemEntity } from '../../database/entities/carrinho-item.entity';
import { PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';

describe('AdicionarAoCarrinhoUseCase', () => {
  let useCase: AdicionarAoCarrinhoUseCase;
  let carrinhoRepo: any;
  let produtoRepository: any;

  beforeEach(async () => {
    carrinhoRepo = { findOne: jest.fn(), create: jest.fn((d) => d), save: jest.fn(), update: jest.fn() };
    produtoRepository = { findByIdRaw: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdicionarAoCarrinhoUseCase,
        { provide: getRepositoryToken(CarrinhoItemEntity), useValue: carrinhoRepo },
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
      ],
    }).compile();
    useCase = module.get(AdicionarAoCarrinhoUseCase);
  });

  const produto = (quantidade: number) => ({ id_produto: 1, nome: 'Bolo', preco: 10, quantidade, ativo: true });

  it('rejeita produto/quantidade inválidos', async () => {
    await expect(useCase.execute(1, { quantidade: 2 } as any)).rejects.toThrow('Produto ou quantidade inválida');
  });

  it('404 quando o produto não existe', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue(null);
    await expect(useCase.execute(1, { id_produto: 9, quantidade: 1 })).rejects.toThrow('Produto não encontrado');
  });

  it('rejeita quando não há estoque suficiente', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue(produto(1));
    await expect(useCase.execute(1, { id_produto: 1, quantidade: 5 })).rejects.toThrow('Estoque insuficiente');
  });

  it('aceita o nome legado produto_id vindo do front-end', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue(produto(10));
    carrinhoRepo.findOne.mockResolvedValue(null);
    const result = await useCase.execute(1, { produto_id: 1, quantidade: 2 });
    expect(result.success).toBe(true);
    expect(carrinhoRepo.save).toHaveBeenCalled();
  });

  it('soma na linha existente quando a quantidade total cabe no estoque', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue(produto(10));
    carrinhoRepo.findOne.mockResolvedValue({ id: 7, quantidade: 3 });

    await useCase.execute(1, { id_produto: 1, quantidade: 2 });

    expect(carrinhoRepo.update).toHaveBeenCalledWith({ id: 7 }, { quantidade: 5 });
    expect(carrinhoRepo.save).not.toHaveBeenCalled();
  });

  it('rejeita quando a QUANTIDADE TOTAL (existente + nova) estoura o estoque', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue(produto(4));
    carrinhoRepo.findOne.mockResolvedValue({ id: 7, quantidade: 3 });

    await expect(useCase.execute(1, { id_produto: 1, quantidade: 2 })).rejects.toThrow(
      'Estoque insuficiente para a quantidade total',
    );
  });
});
