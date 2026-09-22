import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IProdutoRepository, PRODUTO_REPOSITORY } from '../common/repositories/interfaces/produto-repository.interface';
import { IPedidoRepository, PEDIDO_REPOSITORY } from '../common/repositories/interfaces/pedido-repository.interface';
import { ICategoriaRepository, CATEGORIA_REPOSITORY } from '../common/repositories/interfaces/categoria-repository.interface';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { buildSuccessResponse } from '../common/responses/api-response';
import { clampPagination } from '../common/utils/pagination.util';

const CATEGORIAS_CACHE_KEY = 'produtos:categorias';

@Injectable()
export class ProdutosService {
  constructor(
    @Inject(PRODUTO_REPOSITORY) private readonly produtoRepository: IProdutoRepository,
    @Inject(PEDIDO_REPOSITORY) private readonly pedidoRepository: IPedidoRepository,
    @Inject(CATEGORIA_REPOSITORY) private readonly categoriaRepository: ICategoriaRepository,
    private readonly cloudinary: CloudinaryService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async listarCategorias() {
    const cached = await this.cache.get(CATEGORIAS_CACHE_KEY);
    if (cached) {
      return buildSuccessResponse('Categorias carregadas com sucesso (cache)', cached);
    }

    const categorias = await this.categoriaRepository.findAllPublic();
    await this.cache.set(CATEGORIAS_CACHE_KEY, categorias);
    return buildSuccessResponse('Categorias carregadas com sucesso', categorias);
  }

  async maisVendidos() {
    const maisVendidos = await this.pedidoRepository.groupByProdutoMaisVendido(8);

    if (maisVendidos.length === 0) {
      const produtos = await this.produtoRepository.findAtivosDestacados(8);
      return buildSuccessResponse('Produtos em destaque', produtos);
    }

    const ids = maisVendidos.map((item) => item.id_produto);
    const produtos = await this.produtoRepository.findAtivosPorIds(ids);

    const ordenados = ids.map((id) => produtos.find((p) => p.id_produto === id)).filter(Boolean);
    return buildSuccessResponse('Produtos mais vendidos', ordenados);
  }

  async novos() {
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const produtos = await this.produtoRepository.findNovos(seteDiasAtras, 20);
    return buildSuccessResponse('Produtos recentes', produtos);
  }

  async listar(query: Record<string, any>) {
    const { categoria, query: q, filtro, minPreco, maxPreco, isAdmin } = query;

    const where: Record<string, any> = { ativo: true };
    if (categoria) where.id_categoria = parseInt(categoria, 10);
    if (q) where.nome = { contains: q };

    if (minPreco || maxPreco) {
      where.preco = {};
      if (minPreco) where.preco.gte = parseFloat(minPreco);
      if (maxPreco) where.preco.lte = parseFloat(maxPreco);
    }

    const { page, limit, skip } = clampPagination(query.page, query.limit, isAdmin ? 10 : 20);

    const queryOptions: {
      where: Record<string, any>;
      orderBy?: Record<string, 'asc' | 'desc'>;
      take?: number;
      skip?: number;
    } = { where };

    if (filtro === 'novos') queryOptions.orderBy = { data_criacao: 'desc' };
    if (filtro === 'menor-preco') queryOptions.orderBy = { preco: 'asc' };
    if (filtro === 'maior-preco') queryOptions.orderBy = { preco: 'desc' };

    if (isAdmin) {
      queryOptions.take = limit;
      queryOptions.skip = skip;
    }

    const produtos = await this.produtoRepository.findManyWithOptions(queryOptions);

    if (isAdmin) {
      const total = await this.produtoRepository.count(where);
      const totalPages = Math.ceil(total / limit);

      return buildSuccessResponse('Lista de produtos carregada', {
        produtos,
        pagination: { total, page, limit, totalPages },
      });
    }

    return buildSuccessResponse('Produtos carregados com sucesso', produtos);
  }

  async buscarPorId(id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('ID inválido');
    }

    const produto = await this.produtoRepository.findById(id);
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    return buildSuccessResponse('Produto encontrado', produto);
  }

  async criar(body: any, file?: Express.Multer.File) {
    const { nome, descricao, preco, quantidade, id_categoria } = body;

    if (!nome || !preco) {
      throw new BadRequestException('Nome e preço são obrigatórios');
    }

    const urlDaImagem = file ? await this.cloudinary.uploadProductImage(file.buffer) : null;

    const novoProduto = await this.produtoRepository.create({
      nome,
      descricao,
      preco: parseFloat(preco),
      quantidade: quantidade ? parseInt(quantidade, 10) : 0,
      id_categoria: id_categoria ? parseInt(id_categoria, 10) : null,
      imagem: urlDaImagem,
    });

    return buildSuccessResponse('Produto adicionado com sucesso', { produto: novoProduto });
  }

  async atualizar(id: number, body: any, file?: Express.Multer.File) {
    const { nome, descricao, preco, quantidade, id_categoria } = body;

    if (isNaN(id)) {
      throw new BadRequestException('ID inválido');
    }

    const produto = await this.produtoRepository.findByIdRaw(id);
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    const novaImagemUrl = file ? await this.cloudinary.uploadProductImage(file.buffer) : undefined;

    const atualizado = await this.produtoRepository.update(id, {
      ...(nome && { nome }),
      ...(descricao !== undefined && { descricao }),
      ...(preco !== undefined && { preco: parseFloat(preco) }),
      ...(quantidade !== undefined && { quantidade: parseInt(quantidade, 10) }),
      ...(id_categoria !== undefined && { id_categoria: parseInt(id_categoria, 10) }),
      ...(novaImagemUrl && { imagem: novaImagemUrl }),
    });

    return buildSuccessResponse('Produto atualizado com sucesso', { produto: atualizado });
  }

  async remover(id: number) {
    const produto = await this.produtoRepository.findByIdRaw(id);
    if (!produto) {
      throw new NotFoundException('Produto não encontrado');
    }

    await this.produtoRepository.softDelete(id);
    return buildSuccessResponse('Produto removido do catálogo com sucesso');
  }
}
