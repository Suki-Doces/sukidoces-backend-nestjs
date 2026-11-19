import { Injectable } from '@nestjs/common';
import { Product } from '@domain/entities';
import { ProductRepository } from '@domain/repositories';
import { NotFoundError } from '@application/errors';
import { ImageStorage } from '@application/ports';

export interface UpdateProductInput {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  categoryId?: number;
  image?: Buffer;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(input: UpdateProductInput): Promise<Product | null> {
    if (!(await this.products.findById(input.id))) {
      throw new NotFoundError('Product not found');
    }

    const newImageUrl = input.image ? await this.images.upload(input.image) : undefined;

    // Partial update: only what was provided is written.
    return this.products.update(input.id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(newImageUrl && { image: newImageUrl }),
    });
  }
}
