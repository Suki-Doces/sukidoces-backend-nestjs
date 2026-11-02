import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProdutosService } from './produtos.service';
import { PRODUTO_REPOSITORY } from '../common/repositories/interfaces/produto-repository.interface';
import { PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { CATEGORIA_REPOSITORY } from '../common/repositories/interfaces/categoria-repository.interface';

describe('ProdutosService', () => {
  let service: ProdutosService;
  let produtoRepository: any;
  let categoriaRepository: any;
  let cache: any;

  beforeEach(async () => {
    produtoRepository = {
      findById: jest.fn(), findByIdRaw: jest.fn(), findManyWithOptions: jest.fn(), count: jest.fn(), softDelete: jest.fn(),
    };
    categoriaRepository = { findAllPublic: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutosService,
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: PEDIDO_REPOSITORY, useValue: { groupByProdutoMaisVendido: jest.fn() } },
        { provide: CATEGORIA_REPOSITORY, useValue: categoriaRepository },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get(ProdutosService);
  });

  it('retorna categorias do cache, sem consultar o banco', async () => {
    cache.get.mockResolvedValue([{ id_categoria: 1, nome: 'Bolos' }]);
    const result = await service.listarCategorias();
    expect(result.success).toBe(true);
    expect(categoriaRepository.findAllPublic).not.toHaveBeenCalled();
  });

  it('consulta o banco e popula o cache quando não há cache', async () => {
    cache.get.mockResolvedValue(undefined);
    categoriaRepository.findAllPublic.mockResolvedValue([{ id_categoria: 1, nome: 'Bolos' }]);
    const result = await service.listarCategorias();
    expect(cache.set).toHaveBeenCalledWith('produtos:categorias', [{ id_categoria: 1, nome: 'Bolos' }]);
    expect(result.data).toEqual([{ id_categoria: 1, nome: 'Bolos' }]);
  });

  it('400 para id inválido e 404 para produto inexistente', async () => {
    await expect(service.buscarPorId(NaN)).rejects.toThrow('ID inválido');
    produtoRepository.findById.mockResolvedValue(null);
    await expect(service.buscarPorId(999)).rejects.toThrow('Produto não encontrado');
  });

  it('limita a paginação ao teto máximo mesmo se o cliente pedir mais', async () => {
    produtoRepository.findManyWithOptions.mockResolvedValue([]);
    produtoRepository.count.mockResolvedValue(500);
    const result = await service.listar({ isAdmin: 'true', limit: '999999', page: '1' });
    expect((result.data as any).pagination.limit).toBe(100);
  });

  it('remover faz soft delete (inativa, não apaga) e 404 se não existir', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue({ id_produto: 1 });
    await service.remover(1);
    expect(produtoRepository.softDelete).toHaveBeenCalledWith(1);

    produtoRepository.findByIdRaw.mockResolvedValue(null);
    await expect(service.remover(2)).rejects.toThrow('Produto não encontrado');
  });
});
