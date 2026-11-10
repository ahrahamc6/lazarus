/*
# Add receipt uploads and checkout order statuses

## Overview
Adds the database and Storage support required for the no-registration checkout.
Customers can upload payment receipts publicly, and orders can record the receipt
URL alongside the A4 design URL and customer contact details.

## Modified Tables

### orders
- `receipt_url` (text, nullable) — public Storage URL for the uploaded payment receipt.
- Status constraint now also accepts `Completado` and `Pendiente de Pago`, while preserving
  the existing English statuses used by the admin dashboard and older orders.

## New Storage Bucket

### receipts
Public bucket for customer payment receipt images.

## Security
1. Public SELECT and INSERT are limited to the `receipts` bucket so no login is needed
   during checkout.
2. UPDATE and DELETE remain restricted to authenticated administrators.
3. Anonymous clients may INSERT the checkout columns on `orders`, including customer data,
   design URL, receipt URL, total, notes, and status. Anonymous SELECT remains disabled.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN receipt_url text;
  END IF;
END $$;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'Completado', 'Pendiente de Pago'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_receipts" ON storage.objects;
CREATE POLICY "public_read_receipts"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "public_upload_receipts" ON storage.objects;
CREATE POLICY "public_upload_receipts"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "auth_update_receipts" ON storage.objects;
CREATE POLICY "auth_update_receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'receipts')
  WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "auth_delete_receipts" ON storage.objects;
CREATE POLICY "auth_delete_receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts');

GRANT INSERT (status, customer_name, customer_email, customer_phone, shipping_address, total, notes, design_image_url, design_meta, receipt_url)
  ON public.orders TO anon;
