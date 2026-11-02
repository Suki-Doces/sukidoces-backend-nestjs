import { Test, TestingModule } from '@nestjs/testing';
import { CriarProdutoUseCase } from './criar-produto.use-case';
import { PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

describe('CriarProdutoUseCase', () => {
  let useCase: CriarProdutoUseCase;
  let produtoRepository: any;
  let cloudinary: any;

  beforeEach(async () => {
    produtoRepository = { create: jest.fn().mockImplementation(async (d) => ({ id_produto: 1, ...d })) };
    cloudinary = { uploadProductImage: jest.fn().mockResolvedValue('https://img/bolo.png') };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CriarProdutoUseCase,
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();
    useCase = module.get(CriarProdutoUseCase);
  });

  it('cria o produto com defaults (quantidade 0, sem categoria, sem imagem)', async () => {
    await useCase.execute({ nome: 'Bolo', preco: 45.9 });

    expect(cloudinary.uploadProductImage).not.toHaveBeenCalled();
    expect(produtoRepository.create).toHaveBeenCalledWith({
      nome: 'Bolo', descricao: undefined, preco: 45.9, quantidade: 0, id_categoria: null, imagem: null,
    });
  });

  it('envia a imagem ao Cloudinary e grava a URL', async () => {
    const result = await useCase.execute(
      { nome: 'Bolo', preco: 10, quantidade: 3, id_categoria: 2 },
      { buffer: Buffer.from('img') } as any,
    );

    expect(cloudinary.uploadProductImage).toHaveBeenCalled();
    expect(result.data.produto.imagem).toBe('https://img/bolo.png');
    expect(result.data.produto.quantidade).toBe(3);
  });
});
