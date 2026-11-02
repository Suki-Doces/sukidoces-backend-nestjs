import { Test, TestingModule } from '@nestjs/testing';
import { AtualizarProdutoUseCase } from './atualizar-produto.use-case';
import { PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

describe('AtualizarProdutoUseCase', () => {
  let useCase: AtualizarProdutoUseCase;
  let produtoRepository: any;
  let cloudinary: any;

  beforeEach(async () => {
    produtoRepository = { findByIdRaw: jest.fn(), update: jest.fn().mockResolvedValue({ id_produto: 1 }) };
    cloudinary = { uploadProductImage: jest.fn().mockResolvedValue('https://img/novo.png') };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtualizarProdutoUseCase,
        { provide: PRODUTO_REPOSITORY, useValue: produtoRepository },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();
    useCase = module.get(AtualizarProdutoUseCase);
  });

  it('404 quando o produto não existe', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue(null);
    await expect(useCase.execute(9, { preco: 1 })).rejects.toThrow('Produto não encontrado');
    expect(produtoRepository.update).not.toHaveBeenCalled();
  });

  it('atualização parcial: só envia ao banco os campos que vieram', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue({ id_produto: 1 });
    await useCase.execute(1, { preco: 12 });
    expect(produtoRepository.update).toHaveBeenCalledWith(1, { preco: 12 });
  });

  it('aceita zerar o estoque (quantidade 0 é um valor válido, não "ausente")', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue({ id_produto: 1 });
    await useCase.execute(1, { quantidade: 0 });
    expect(produtoRepository.update).toHaveBeenCalledWith(1, { quantidade: 0 });
  });

  it('troca a imagem quando um arquivo é enviado', async () => {
    produtoRepository.findByIdRaw.mockResolvedValue({ id_produto: 1 });
    await useCase.execute(1, {}, { buffer: Buffer.from('x') } as any);
    expect(produtoRepository.update).toHaveBeenCalledWith(1, { imagem: 'https://img/novo.png' });
  });
});
