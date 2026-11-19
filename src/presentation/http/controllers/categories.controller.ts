import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateCategoryUseCase,
  DeleteCategoryUseCase,
  ListCategoriesUseCase,
  UpdateCategoryUseCase,
} from '@application/use-cases/categories';

import { CreateCategoryDto, UpdateCategoryDto } from '@presentation/http/dto';
import { AdminGuard, JwtAuthGuard } from '@presentation/http/guards';

import { successResponse, presentCategory } from '@presentation/http/support';

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
    return successResponse(
      'Categories loaded successfully',
      (await this.listCategories.execute()).map(presentCategory),
    );
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return successResponse(
      'Category created successfully',
      presentCategory(await this.createCategory.execute(dto)),
    );
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    const category = await this.updateCategory.execute(id, dto);
    return successResponse(
      'Category updated successfully',
      category ? presentCategory(category) : null,
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteCategory.execute(id);
    return successResponse('Category deleted successfully');
  }
}
