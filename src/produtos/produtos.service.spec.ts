import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProdutosService } from './produtos.service';
import { PRODUTO_REPOSITORY } from '../common/repositories/interfaces/produto-repository.interface';
import { PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { CATEGORIA_REPOSITORY } from '../common/repositories/interfaces/categoria-repository.interface';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('ProdutosService', () => {
  let service: ProdutosService;
  let produtoRepository: any;
  let categoriaRepository: any;
  let cache: any;

  beforeEach(async () => {
    produtoRepository = {
      findById: jest.fn(),
      findByIdRaw: jest.fn(),
      findManyWithOptions: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };
    categoriaRepository = { findAllPublic: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutosService,
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: PEDIDO_REPOSITORY, useValue: { groupByProdutoMaisVendido: jest.fn() } },
        { provide: CATEGORIA_REPOSITORY, useValue: categoriaRepository },
        { provide: CloudinaryService, useValue: { uploadProductImage: jest.fn() } },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<ProdutosService>(ProdutosService);
  });

  it('deve retornar categorias do cache quando disponível, sem consultar o banco', async () => {
    cache.get.mockResolvedValue([{ id_categoria: 1, nome: 'Bolos' }]);

    const result = await service.listarCategorias();

    expect(result.success).toBe(true);
    expect(categoriaRepository.findAllPublic).not.toHaveBeenCalled();
  });

  it('deve consultar o banco e popular o cache quando não houver cache', async () => {
    cache.get.mockResolvedValue(undefined);
    categoriaRepository.findAllPublic.mockResolvedValue([{ id_categoria: 1, nome: 'Bolos' }]);

    const result = await service.listarCategorias();

    expect(categoriaRepository.findAllPublic).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith('produtos:categorias', [{ id_categoria: 1, nome: 'Bolos' }]);
    expect(result.data).toEqual([{ id_categoria: 1, nome: 'Bolos' }]);
  });

  it('deve lançar erro ao buscar produto com id inválido', async () => {
    await expect(service.buscarPorId(NaN)).rejects.toThrow('ID inválido');
  });

  it('deve lançar erro quando produto não é encontrado', async () => {
    produtoRepository.findById.mockResolvedValue(null);
    await expect(service.buscarPorId(999)).rejects.toThrow('Produto não encontrado');
  });

  it('deve rejeitar criação de produto sem nome ou preço', async () => {
    await expect(service.criar({ nome: '', preco: undefined })).rejects.toThrow(
      'Nome e preço são obrigatórios',
    );
  });

  it('deve limitar a paginação ao teto máximo mesmo se o cliente pedir mais', async () => {
    produtoRepository.findManyWithOptions.mockResolvedValue([]);
    produtoRepository.count.mockResolvedValue(500);

    const result = await service.listar({ isAdmin: 'true', limit: '999999', page: '1' });

    expect((result.data as any).pagination.limit).toBe(100);
  });
});
