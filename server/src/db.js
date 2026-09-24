import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB(){
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      loyalty_points INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_code TEXT UNIQUE NOT NULL,
      user_id INT REFERENCES users(id),
      items JSONB NOT NULL,
      subtotal NUMERIC NOT NULL,
      discount NUMERIC DEFAULT 0,
      delivery_fee NUMERIC DEFAULT 0,
      total NUMERIC NOT NULL,
      status TEXT DEFAULT 'placed',
      address TEXT,
      phone TEXT,
      coupon TEXT,
      payment_method TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      cat TEXT NOT NULL,
      brand TEXT,
      name_ar TEXT NOT NULL,
      name_en TEXT,
      emoji TEXT,
      price NUMERIC NOT NULL,
      discount INT DEFAULT 0,
      weight TEXT,
      stock INT DEFAULT 100,
      best_seller BOOLEAN DEFAULT false,
      is_new BOOLEAN DEFAULT false,
      featured BOOLEAN DEFAULT false
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_products_cat ON products(cat);
  `);
  console.log('✅ DB Ready');
}