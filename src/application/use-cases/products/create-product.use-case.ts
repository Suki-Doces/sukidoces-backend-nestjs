import { Injectable } from '@nestjs/common';
import { Product } from '@domain/entities';
import { ProductRepository } from '@domain/repositories';
import { ImageStorage } from '@application/ports';

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  categoryId?: number;
  image?: Buffer;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly products: ProductRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const imageUrl = input.image ? await this.images.upload(input.image) : null;

    return this.products.create({
      name: input.name,
      description: input.description,
      price: input.price,
      quantity: input.quantity ?? 0,
      categoryId: input.categoryId ?? null,
      image: imageUrl,
    });
  }
}
