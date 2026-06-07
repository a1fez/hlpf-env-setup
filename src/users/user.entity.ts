import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string; // Важливо: зберігаємо хеш, а не пароль!

  @Column({ length: 100, nullable: true })
  name: string;

  @Column({
    type: 'varchar', // Для Postgres краще використовувати varchar для Enum
    default: Role.USER,
  })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;
}