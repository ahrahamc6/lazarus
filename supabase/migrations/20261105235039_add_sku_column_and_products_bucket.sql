/*
# Add SKU column to products + create products storage bucket

## Overview
1. Adds a `sku` (stock-keeping unit) column to the `products` table for product codes.
2. Creates a public `products` storage bucket for product image uploads.

## Changes

### Modified Tables
- `products`: adds `sku` (text, nullable) — product code/SKU. Not unique (admin can have
  products without SKU). No constraints beyond type.

### New Storage Bucket
- `products` — public bucket for product images uploaded by admin.

### Storage Policies
- SELECT (read): public (anon, authenticated) — storefront displays product images
- INSERT (upload): authenticated only — only admin can upload product images
- UPDATE/DELETE: authenticated only — admin management
*/

-- ============ ADD SKU COLUMN TO PRODUCTS ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku') THEN
    ALTER TABLE products ADD COLUMN sku text;
  END IF;
END $$;

-- ============ CREATE PRODUCTS STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- ============ STORAGE POLICIES FOR PRODUCTS BUCKET ============
DROP POLICY IF EXISTS "public_read_products" ON storage.objects;
CREATE POLICY "public_read_products"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "auth_upload_products" ON storage.objects;
CREATE POLICY "auth_upload_products"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "auth_update_products" ON storage.objects;
CREATE POLICY "auth_update_products"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products')
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "auth_delete_products" ON storage.objects;
CREATE POLICY "auth_delete_products"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');