import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '@domain/entities';
import { ProductRepository, ProductSearchCriteria, ProductSort } from '@domain/repositories';

export class TypeOrmProductRepository implements ProductRepository {
  constructor(private readonly repo: Repository<Product>) {}

  // 👇 Agora mutamos o objeto em vez de criar um novo. Isso preserva os métodos da classe.
  private mapToDomain(product: Product | null): Product | null {
    if (!product) return null;
    product.price = Number(product.price);
    return product;
  }

  // 👇 Faz o map e força o tipo Product no final, pois sabemos que o array não terá nulos
  private mapArrayToDomain(products: Product[]): Product[] {
    return products.map((p) => this.mapToDomain(p) as Product);
  }

  async findByIdWithCategory(id: number) {
    const product = await this.repo.findOne({ where: { id }, relations: { category: true } });
    return this.mapToDomain(product);
  }

  async findById(id: number) {
    const product = await this.repo.findOne({ where: { id } });
    return this.mapToDomain(product);
  }

  async findManyByIds(ids: number[]) {
    const products = await this.repo.find({ where: { id: In(ids) } });
    return this.mapArrayToDomain(products);
  }

  async findActiveFeatured(take: number) {
    const products = await this.repo.find({
      where: { active: true },
      take,
      order: { id: 'DESC' },
      relations: { category: true },
    });
    return this.mapArrayToDomain(products);
  }

  async findActiveByIds(ids: number[]) {
    const products = await this.repo.find({
      where: { id: In(ids), active: true },
      relations: { category: true },
    });
    return this.mapArrayToDomain(products);
  }

  async findNewSince(since: Date, take: number) {
    const products = await this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.active = :active', { active: true })
      .andWhere('product.createdAt >= :since', { since })
      .orderBy('product.createdAt', 'DESC')
      .take(take)
      .getMany();
    return this.mapArrayToDomain(products);
  }

  async search(
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

    const products = await query.getMany();
    return this.mapArrayToDomain(products);
  }

  async count(criteria: ProductSearchCriteria) {
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

  // 👇 Forçamos o retorno como Promise<Product> para bater com a interface
  async create(data: Partial<Product>): Promise<Product> {
    const product = await this.repo.save(this.repo.create(data));
    return this.mapToDomain(product) as Product;
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

  async findBasicInfoByIds(ids: number[]) {
    const products = await this.repo.find({
      where: { id: In(ids) },
      select: { id: true, name: true, price: true, image: true, quantity: true },
    });
    return this.mapArrayToDomain(products);
  }

  async findAllBasicInfo() {
    const products = await this.repo.find({ select: { id: true, name: true, price: true } });
    return this.mapArrayToDomain(products);
  }
}