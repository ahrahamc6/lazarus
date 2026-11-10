/*
# Lazarus Store Schema - Categories, Products, Orders

## Overview
Creates the core database schema for the Lazarus brand e-commerce platform.
Supports a product catalog organized by categories (Stickers, Camisetas, Bolsos),
order management, and an admin panel for inventory and order tracking.

## New Tables

### categories
- `id` (uuid, primary key)
- `name` (text, not null) - category display name
- `slug` (text, unique, not null) - URL-friendly identifier
- `description` (text) - optional category description
- `image_url` (text) - optional category image
- `sort_order` (int, default 0) - display ordering
- `created_at` (timestamptz)

### products
- `id` (uuid, primary key)
- `category_id` (uuid, FK -> categories, not null)
- `name` (text, not null) - product name
- `slug` (text, unique, not null) - URL-friendly identifier
- `description` (text) - product description
- `price` (numeric(10,2), not null) - price in euros
- `image_url` (text) - main product image
- `stock` (int, not null, default 0) - inventory count
- `is_active` (boolean, default true) - whether product is visible in store
- `metadata` (jsonb) - flexible extra fields (sizes, colors, etc.)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### orders
- `id` (uuid, primary key)
- `status` (text, not null, default 'pending') - pending, paid, shipped, delivered, cancelled
- `customer_name` (text, not null)
- `customer_email` (text, not null)
- `customer_phone` (text)
- `shipping_address` (text)
- `total` (numeric(10,2), not null, default 0) - order total
- `notes` (text) - customer/admin notes
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### order_items
- `id` (uuid, primary key)
- `order_id` (uuid, FK -> orders ON DELETE CASCADE, not null)
- `product_id` (uuid, FK -> products, not null)
- `product_name` (text, not null) - snapshot of product name at order time
- `quantity` (int, not null, default 1)
- `unit_price` (numeric(10,2), not null) - snapshot of price at order time
- `subtotal` (numeric(10,2), not null) - quantity * unit_price
- `created_at` (timestamptz)

## Security (RLS + Grants)

### Public read access (storefront)
- `categories`: SELECT to `anon, authenticated` (storefront needs to show categories)
- `products`: SELECT to `anon, authenticated` (storefront needs to show products)
- `orders` + `order_items`: only `authenticated` (admin) access - customers don't read orders directly yet

### Admin write access (authenticated only)
- `categories`: full CRUD to `authenticated`
- `products`: full CRUD to `authenticated`
- `orders`: full CRUD to `authenticated`
- `order_items`: full CRUD to `authenticated`

Since this is an admin-managed store where the admin signs in to manage inventory,
all write operations require authentication. Public visitors can browse but not modify.

## Indexes
- `products.category_id` - for filtering products by category
- `products.slug` - for product lookups by slug
- `products.is_active` - for filtering visible products
- `orders.status` - for filtering orders by status
- `order_items.order_id` - for fetching items in an order
*/

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON categories TO authenticated;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories"
  ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_categories" ON categories;
CREATE POLICY "auth_insert_categories"
  ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "auth_update_categories"
  ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "auth_delete_categories"
  ON categories FOR DELETE
  TO authenticated USING (true);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products"
  ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "auth_insert_products"
  ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products"
  ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products"
  ON products FOR DELETE
  TO authenticated USING (true);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  shipping_address text,
  total numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;

DROP POLICY IF EXISTS "auth_read_orders" ON orders;
CREATE POLICY "auth_read_orders"
  ON orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_orders" ON orders;
CREATE POLICY "auth_insert_orders"
  ON orders FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders"
  ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders"
  ON orders FOR DELETE
  TO authenticated USING (true);

-- ============ ORDER_ITEMS ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO authenticated;

DROP POLICY IF EXISTS "auth_read_order_items" ON order_items;
CREATE POLICY "auth_read_order_items"
  ON order_items FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_order_items" ON order_items;
CREATE POLICY "auth_insert_order_items"
  ON order_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_order_items" ON order_items;
CREATE POLICY "auth_update_order_items"
  ON order_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_order_items" ON order_items;
CREATE POLICY "auth_delete_order_items"
  ON order_items FOR DELETE
  TO authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ SEED CATEGORIES ============
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Stickers Personalizados', 'stickers', 'Stickers de vinilo personalizados, resistentes y con diseños únicos.', 1),
  ('Camisetas', 'camisetas', 'Camisetas con diseños originales de la marca Lazarus.', 2),
  ('Bolsos', 'bolsos', 'Bolsos y tote bags con estampación de alta calidad.', 3)
ON CONFLICT (slug) DO NOTHING;