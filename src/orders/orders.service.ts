import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../common/enums/order-status.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // Вправа 4: Транзакційне створення замовлення
  async create(dto: CreateOrderDto, user: User): Promise<Order> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      let totalPrice = 0;
      const orderItems: OrderItem[] = [];

      for (const item of dto.items) {
        const product = await qr.manager.findOne(Product, { where: { id: item.productId } });
        if (!product) throw new NotFoundException(`Продукт #${item.productId} не знайдено`);

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Недостатньо "${product.name}": є ${product.stock}, треба ${item.quantity}`);
        }

        product.stock -= item.quantity;
        await qr.manager.save(product);

        const orderItem = qr.manager.create(OrderItem, {
          product,
          quantity: item.quantity,
          price: product.price,
        });
        orderItems.push(orderItem);
        totalPrice += Number(product.price) * item.quantity;
      }

      const order = qr.manager.create(Order, {
        user,
        items: orderItems,
        totalPrice,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await qr.manager.save(order);
      await qr.commitTransaction();
      await this.clearProductsCache();
      return savedOrder;
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  // Вправа 5: Список замовлень (Ownership check)
  async findAll(query: OrderQueryDto, userId: number, userRole: string) {
    const { page = 1, pageSize = 10, status } = query;
    const qb = this.orderRepo.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user');

    if (userRole !== 'admin') qb.andWhere('order.user_id = :userId', { userId });
    if (status) qb.andWhere('order.status = :status', { status });

    qb.skip((page - 1) * pageSize).take(pageSize).orderBy('order.createdAt', 'DESC');
    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async findOne(id: number, userId: number, userRole: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });
    if (!order) throw new NotFoundException(`Замовлення #${id} не знайдено`);
    if (userRole !== 'admin' && order.user.id !== userId) throw new ForbiddenException('Доступ заборонено');
    return order;
  }

  // Вправа 6: Зміна статусу + Машина станів + Повернення stock
  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['items', 'items.product'] });
    if (!order) throw new NotFoundException(`Замовлення #${id} не знайдено`);

    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowed[order.status].includes(dto.status)) {
      throw new BadRequestException(`Перехід з ${order.status} до ${dto.status} заборонений`);
    }

    if (dto.status === OrderStatus.CANCELLED) {
      const qr = this.dataSource.createQueryRunner();
      await qr.connect(); await qr.startTransaction();
      try {
        for (const item of order.items) {
          item.product.stock += item.quantity;
          await qr.manager.save(item.product);
        }
        order.status = OrderStatus.CANCELLED;
        await qr.manager.save(order);
        await qr.commitTransaction();
        await this.clearProductsCache();
        return order;
      } catch (err) { await qr.rollbackTransaction(); throw err; } finally { await qr.release(); }
    }

    order.status = dto.status;
    return await this.orderRepo.save(order);
  }

  async remove(id: number) {
    const order = await this.orderRepo.findOneBy({ id });
    if (!order) throw new NotFoundException(`Замовлення #${id} не знайдено`);
    await this.orderRepo.remove(order);
    return { message: 'Замовлення видалено' };
  }

  private async clearProductsCache() {
    try {
      const store = (this.cacheManager as any).store;
      if (store?.keys) {
        const keys = await store.keys('products:*');
        if (keys.length) await Promise.all(keys.map(k => this.cacheManager.del(k)));
      }
    } catch (e) {}
  }
}