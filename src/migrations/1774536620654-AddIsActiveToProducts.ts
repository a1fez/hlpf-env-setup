import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActiveToProducts1774536620654 implements MigrationInterface {
    name = 'AddIsActiveToProducts1774536620654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Додаємо ТІЛЬКИ колонку isActive у таблицю products
        // Ми використовуємо "IF NOT EXISTS", щоб уникнути помилок, якщо колонка раптом уже є
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Видаляємо колонку isActive назад, якщо потрібно відкотити міграцію
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "isActive"`);
    }
}