import { Module } from '@nestjs/common';
import { CreateCategoryUseCase } from '../../../application/use-cases/categories/create-category.use-case';
import { DeleteCategoryUseCase } from '../../../application/use-cases/categories/delete-category.use-case';
import { ListCategoriesUseCase } from '../../../application/use-cases/categories/list-categories.use-case';
import { UpdateCategoryUseCase } from '../../../application/use-cases/categories/update-category.use-case';
import { CreateProductUseCase } from '../../../application/use-cases/products/create-product.use-case';
import { DeleteProductUseCase } from '../../../application/use-cases/products/delete-product.use-case';
import { GetBestSellersUseCase } from '../../../application/use-cases/products/get-best-sellers.use-case';
import { GetNewProductsUseCase } from '../../../application/use-cases/products/get-new-products.use-case';
import { GetProductUseCase } from '../../../application/use-cases/products/get-product.use-case';
import { ListProductCategoriesUseCase } from '../../../application/use-cases/products/list-product-categories.use-case';
import { ListProductsUseCase } from '../../../application/use-cases/products/list-products.use-case';
import { UpdateProductUseCase } from '../../../application/use-cases/products/update-product.use-case';
import { CategoriesController } from '../controllers/categories.controller';
import { ProductsController } from '../controllers/products.controller';

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
