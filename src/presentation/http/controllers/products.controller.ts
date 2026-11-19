import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateProductUseCase,
  DeleteProductUseCase,
  GetBestSellersUseCase,
  GetNewProductsUseCase,
  GetProductUseCase,
  ListProductCategoriesUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
} from '@application/use-cases/products';

import { CreateProductDto, UpdateProductDto } from '@presentation/http/dto';
import { AdminGuard, JwtAuthGuard } from '@presentation/http/guards';

import {
  successResponse,
  multerOptions,
  presentCategory,
  presentProduct,
} from '@presentation/http/support';

/** Query-string values of the public contract -> use case sort names. */
const SORT_FILTERS: Record<string, string> = {
  novos: 'newest',
  'menor-preco': 'lowest-price',
  'maior-preco': 'highest-price',
};

@ApiTags('products')
@Controller('produtos')
export class ProductsController {
  constructor(
    private readonly listCategories: ListProductCategoriesUseCase,
    private readonly getBestSellers: GetBestSellersUseCase,
    private readonly getNewProducts: GetNewProductsUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
  ) {}

  @Get('categorias')
  async categories() {
    return successResponse(
      'Categories loaded successfully',
      (await this.listCategories.execute()).map(presentCategory),
    );
  }

  @Get('mais-vendidos')
  async bestSellers() {
    const { featured, products } = await this.getBestSellers.execute();
    return successResponse(
      featured ? 'Featured products' : 'Best-selling products',
      products.map(presentProduct),
    );
  }

  @Get('novos')
  async newProducts() {
    return successResponse(
      'Recent products',
      (await this.getNewProducts.execute()).map(presentProduct),
    );
  }

  @Get()
  async list(@Query() query: Record<string, string>) {
    const { products, pagination } = await this.listProducts.execute({
      category: query.categoria,
      query: query.query,
      filter: SORT_FILTERS[query.filtro],
      minPrice: query.minPreco,
      maxPrice: query.maxPreco,
      isAdmin: query.isAdmin,
      page: query.page,
      limit: query.limit,
    });

    return pagination
      ? successResponse('Product list loaded', {
          produtos: products.map(presentProduct),
          pagination,
        })
      : successResponse('Products loaded successfully', products.map(presentProduct));
  }

  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return successResponse('Product found', presentProduct(await this.getProduct.execute(id)));
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('imagem', multerOptions))
  async create(@Body() dto: CreateProductDto, @UploadedFile() image?: Express.Multer.File) {
    const product = await this.createProduct.execute({ ...dto, image: image?.buffer });
    return successResponse('Product added successfully', { produto: presentProduct(product) });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('imagem', multerOptions))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const product = await this.updateProduct.execute({ id, ...dto, image: image?.buffer });
    return successResponse('Product updated successfully', {
      produto: product ? presentProduct(product) : null,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteProduct.execute(id);
    return successResponse('Product removed from the catalog successfully');
  }
}
