import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateCategoryUseCase } from '../../../application/use-cases/categories/create-category.use-case';
import { DeleteCategoryUseCase } from '../../../application/use-cases/categories/delete-category.use-case';
import { ListCategoriesUseCase } from '../../../application/use-cases/categories/list-categories.use-case';
import { UpdateCategoryUseCase } from '../../../application/use-cases/categories/update-category.use-case';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { successResponse } from '../support/api-response';
import { presentCategory } from '../support/presenters';

@ApiTags('categories')
@Controller('admin/categorias')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CategoriesController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  @Get()
  async list() {
    return successResponse('Categories loaded successfully', (await this.listCategories.execute()).map(presentCategory));
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return successResponse('Category created successfully', presentCategory(await this.createCategory.execute(dto)));
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    const category = await this.updateCategory.execute(id, dto);
    return successResponse('Category updated successfully', category ? presentCategory(category) : null);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteCategory.execute(id);
    return successResponse('Category deleted successfully');
  }
}
