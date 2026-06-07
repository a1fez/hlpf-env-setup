import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

async function seed() {
  try {
    await ds.initialize();
    console.log('--- Підключення встановлено ---');

    // 1. Створюємо або перевіряємо категорії
    const catNames = ['Electronics', 'Accessories', 'Clothing'];
    for (const name of catNames) {
      await ds.query(`INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING`, [name]);
    }

    // 2. Отримуємо РЕАЛЬНІ ID категорій з бази
    const dbCats = await ds.query(`SELECT id, name FROM categories`);
    const catMap: Record<string, number> = {};
    dbCats.forEach((c: any) => { catMap[c.name] = c.id; });

    console.log('Використовуємо ID категорій:', catMap);

    // 3. Шаблон продуктів (тепер використовуємо імена для пошуку ID)
    const templates = [
      { name: 'iPhone 16', price: 999, stock: 50, catName: 'Electronics' },
      { name: 'Galaxy S24', price: 849, stock: 40, catName: 'Electronics' },
      { name: 'MacBook Pro', price: 2499, stock: 15, catName: 'Electronics' },
      { name: 'AirPods Pro', price: 249, stock: 100, catName: 'Accessories' },
      { name: 'USB-C Cable', price: 19, stock: 500, catName: 'Accessories' },
      { name: 'MagSafe Charger', price: 39, stock: 80, catName: 'Accessories' },
      { name: 'T-Shirt Dev', price: 25, stock: 200, catName: 'Clothing' },
      { name: 'Hoodie NestJS', price: 55, stock: 75, catName: 'Clothing' },
    ];

    // 4. Додаємо 30 записів
    for (let i = 0; i < 4; i++) {
      for (const t of templates) {
        const catId = catMap[t.catName];
        if (!catId) continue; // Пропустити, якщо категорію не знайдено

        const suffix = i > 0 ? ` v${i + 1}` : '';
        await ds.query(
          `INSERT INTO products (name, price, stock, category_id) 
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [`${t.name}${suffix}`, t.price + i * 10, t.stock, catId],
        );
      }
    }

    console.log('--- Seed complete! ---');
  } catch (error) {
    console.error('Помилка:', error);
  } finally {
    await ds.destroy();
  }
}

seed();