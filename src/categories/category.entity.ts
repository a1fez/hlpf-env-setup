import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Product } from '../products/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Вказуємо ім'я в лапках, щоб Postgres зберіг велику літеру
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}