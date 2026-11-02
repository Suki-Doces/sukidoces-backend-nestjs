import { Inject, Injectable } from '@nestjs/common';
import { IProdutoRepository, PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { CreateProdutoDto } from '../dto/create-produto.dto';
import { buildSuccessResponse } from '../../common/responses/api-response';

// A validação de formato (nome, preço numérico positivo...) já aconteceu no
// CreateProdutoDto + ValidationPipe — o Use Case recebe dados válidos e já
// convertidos para number.
@Injectable()
export class CriarProdutoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepository: IProdutoRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(dto: CreateProdutoDto, file?: Express.Multer.File) {
    const urlDaImagem = file ? await this.cloudinary.uploadProductImage(file.buffer) : null;

    const novoProduto = await this.produtoRepository.create({
      nome: dto.nome,
      descricao: dto.descricao,
      preco: dto.preco,
      quantidade: dto.quantidade ?? 0,
      id_categoria: dto.id_categoria ?? null,
      imagem: urlDaImagem,
    });

    return buildSuccessResponse('Produto adicionado com sucesso', { produto: novoProduto });
  }
}
