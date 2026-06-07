import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // 1. Метод отримання списку з пагінацією та кешуванням
  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      pageSize = 10,
      sort = 'createdAt',
      order = 'desc',
      categoryId,
      minPrice,
      maxPrice,
      search,
    } = query;

    // Сформувати ключ кешу на основі параметрів запиту
    const cacheKey = `products:${JSON.stringify(query)}`;

    // Перевірити наявність даних у кеші
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        console.log('--- ДАНІ ВЗЯТО З КЕШУ ---');
        return cached;
      }
    } catch (err) {
      console.error('Помилка читання з Redis:', err.message);
    }

    // Якщо в кеші немає — будуємо запит до БД через QueryBuilder
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (search) {
      qb.andWhere('product.name ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy(`product.${sort}`, order.toUpperCase() as 'ASC' | 'DESC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    const result = {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    // Зберегти результат у кеш (TTL 60 секунд)
    try {
      console.log('--- ЗАПИС ДАНИХ У КЕШ REDIS ---');
      await this.cacheManager.set(cacheKey, result, 60000);
    } catch (err) {
      console.error('Помилка запису в Redis:', err.message);
    }

    return result;
  }

  // 2. Створення продукту (+ інвалідація кешу)
  async create(createProductDto: CreateProductDto) {
    const product = this.productRepo.create(createProductDto);
    const saved = await this.productRepo.save(product);
    await this.clearProductsCache();
    return saved;
  }

  // 3. Отримання одного продукту
  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  // 4. Оновлення продукту (+ інвалідація кешу)
  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    const saved = await this.productRepo.save(product);
    await this.clearProductsCache();
    return saved;
  }

  // 5. Видалення продукту (+ інвалідація кешу)
  async remove(id: number) {
    const product = await this.findOne(id);
    await this.productRepo.remove(product);
    await this.clearProductsCache();
    return { message: `Product #${id} deleted successfully` };
  }

  // 6. ПРИВАТНИЙ МЕТОД ОЧИЩЕННЯ КЕШУ (Вправа 5)
  private async clearProductsCache(): Promise<void> {
    try {
      const store = (this.cacheManager as any).store;
      
      // Перевіряємо наявність методу keys (специфічно для redis-yet)
      if (store && typeof store.keys === 'function') {
        const keys: string[] = await store.keys('products:*');
        
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => this.cacheManager.del(key)));
          console.log(`--- КЕШ ОЧИЩЕНО: видалено ${keys.length} ключів ---`);
        }
      }
    } catch (err) {
      console.error('Помилка інвалідації кешу:', err.message);
    }
  }
}