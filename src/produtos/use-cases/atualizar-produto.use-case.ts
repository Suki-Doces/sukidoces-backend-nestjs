import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProdutoRepository, PRODUTO_REPOSITORY } from '../../common/repositories/interfaces/produto-repository.interface';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { UpdateProdutoDto } from '../dto/update-produto.dto';
import { buildSuccessResponse } from '../../common/responses/api-response';

@Injectable()
export class AtualizarProdutoUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepository: IProdutoRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(id: number, dto: UpdateProdutoDto, file?: Express.Multer.File) {
    const produto = await this.produtoRepository.findByIdRaw(id);
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    const novaImagemUrl = file ? await this.cloudinary.uploadProductImage(file.buffer) : undefined;

    // Só atualiza o que veio no body (atualização parcial).
    const atualizado = await this.produtoRepository.update(id, {
      ...(dto.nome !== undefined && { nome: dto.nome }),
      ...(dto.descricao !== undefined && { descricao: dto.descricao }),
      ...(dto.preco !== undefined && { preco: dto.preco }),
      ...(dto.quantidade !== undefined && { quantidade: dto.quantidade }),
      ...(dto.id_categoria !== undefined && { id_categoria: dto.id_categoria }),
      ...(novaImagemUrl && { imagem: novaImagemUrl }),
    });

    return buildSuccessResponse('Produto atualizado com sucesso', { produto: atualizado });
  }
}
