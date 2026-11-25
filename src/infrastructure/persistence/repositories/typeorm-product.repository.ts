import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '@domain/entities';
import { ProductRepository, ProductSearchCriteria, ProductSort } from '@domain/repositories';

export class TypeOrmProductRepository implements ProductRepository {
  constructor(private readonly repo: Repository<Product>) {}

  findByIdWithCategory(id: number) {
    return this.repo.findOne({ where: { id }, relations: { category: true } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  findManyByIds(ids: number[]) {
    return this.repo.find({ where: { id: In(ids) } });
  }

  findActiveFeatured(take: number) {
    return this.repo.find({
      where: { active: true },
      take,
      order: { id: 'DESC' },
      relations: { category: true },
    });
  }

  findActiveByIds(ids: number[]) {
    return this.repo.find({
      where: { id: In(ids), active: true },
      relations: { category: true },
    });
  }

  findNewSince(since: Date, take: number) {
    return this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.active = :active', { active: true })
      .andWhere('product.createdAt >= :since', { since })
      .orderBy('product.createdAt', 'DESC')
      .take(take)
      .getMany();
  }

  search(
    criteria: ProductSearchCriteria,
    options: { sort?: ProductSort; take?: number; skip?: number },
  ) {
    const query = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');
    this.applyCriteria(query, criteria);

    if (options.sort === 'newest') query.orderBy('product.createdAt', 'DESC');
    if (options.sort === 'price-asc') query.orderBy('product.price', 'ASC');
    if (options.sort === 'price-desc') query.orderBy('product.price', 'DESC');
    if (options.take !== undefined) query.take(options.take);
    if (options.skip !== undefined) query.skip(options.skip);

    return query.getMany();
  }

  count(criteria: ProductSearchCriteria) {
    const query = this.repo.createQueryBuilder('product');
    this.applyCriteria(query, criteria);
    return query.getCount();
  }

  private applyCriteria(query: SelectQueryBuilder<Product>, criteria: ProductSearchCriteria) {
    query.where('product.active = :active', { active: true });
    if (criteria.categoryId !== undefined)
      query.andWhere('product.categoryId = :categoryId', { categoryId: criteria.categoryId });
    if (criteria.nameContains !== undefined)
      query.andWhere('product.name LIKE :name', { name: `%${criteria.nameContains}%` });
    if (criteria.minPrice !== undefined)
      query.andWhere('product.price >= :minPrice', { minPrice: criteria.minPrice });
    if (criteria.maxPrice !== undefined)
      query.andWhere('product.price <= :maxPrice', { maxPrice: criteria.maxPrice });
  }

  create(data: Partial<Product>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Product>) {
    await this.repo.update({ id }, data);
    return this.findById(id);
  }

  async increaseStock(id: number, quantity: number) {
    await this.repo.increment({ id }, 'quantity', quantity);
  }

  async decreaseStock(id: number, quantity: number) {
    await this.repo.decrement({ id }, 'quantity', quantity);
  }

  async deactivate(id: number) {
    await this.repo.update({ id }, { active: false });
  }

  findBasicInfoByIds(ids: number[]) {
    return this.repo.find({
      where: { id: In(ids) },
      select: { id: true, name: true, price: true, image: true, quantity: true },
    });
  }

  findAllBasicInfo() {
    return this.repo.find({ select: { id: true, name: true, price: true } });
  }
}
