import { Module } from '@nestjs/common';
import {
  CreateCategoryUseCase,
  DeleteCategoryUseCase,
  ListCategoriesUseCase,
  UpdateCategoryUseCase,
} from '@application/use-cases/categories';

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

import { CategoriesController, ProductsController } from '@presentation/http/controllers';

@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [
    ListProductCategoriesUseCase,
    GetBestSellersUseCase,
    GetNewProductsUseCase,
    ListProductsUseCase,
    GetProductUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    ListCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
})
export class CatalogModule {}
