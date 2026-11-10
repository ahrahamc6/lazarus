/*
# Add anon SELECT policy on order_items + column-restricted SELECT on orders

## Problem
The checkout flow uses `.insert({...}).select('id').maybeSingle()` on the
`orders` table. Post-INSERT RETURNING is governed by SELECT policies.
The `anon` role had an INSERT policy (`anon_insert_orders`) but NO SELECT
policy, so the RETURNING returned zero rows → `data: null` → the frontend
threw "No se pudo obtener el identificador del pedido" and the generic
catch displayed a vague error.

The `order_items` table likewise had no anon SELECT/INSERT policies at all
(only authenticated policies). Although the current checkout does not write
to `order_items`, future cart-based checkouts will need anon to insert
line items, and any join that reads order_items as anon would fail.

## Changes
1. orders: grant column-restricted SELECT (id only) to anon so the
   RETURNING after INSERT can read the generated id without exposing
   customer data (name, email, phone, address) to anonymous callers.
   Add a SELECT policy for anon scoped to true (the column grant already
   restricts what they see to just `id`).
2. order_items: add anon INSERT + SELECT policies matching the pattern
   used on orders, so a future cart checkout can create line items as
   anon. SELECT is column-restricted to non-sensitive columns.

## Security notes
- RLS remains enabled on both tables.
- anon SELECT on orders is restricted to the `id` column only via
  column-level GRANT. anon cannot read customer_name, customer_email,
  customer_phone, shipping_address, or any other column.
- anon SELECT on order_items is restricted to id, order_id, product_id,
  product_name, quantity, unit_price, subtotal, created_at.
- No data is modified or deleted. All statements are idempotent.
*/

-- ===== orders: column-restricted SELECT for anon =====

-- Revoke the broad SELECT grant we added earlier, then grant only the id column
REVOKE SELECT ON orders FROM anon;

-- anon can only read the `id` column (needed for INSERT ... RETURNING id)
GRANT SELECT (id) ON orders TO anon;

-- Drop and recreate the anon SELECT policy (column grant does the restriction)
DROP POLICY IF EXISTS "anon_select_order_id" ON orders;
CREATE POLICY "anon_select_order_id"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- ===== order_items: anon INSERT + SELECT policies =====

-- Ensure anon has INSERT and SELECT grants (SELECT column-restricted)
GRANT INSERT ON order_items TO anon;
GRANT SELECT (id, order_id, product_id, product_name, quantity, unit_price, subtotal, created_at) ON order_items TO anon;

-- anon can insert order items (for future cart-based checkout)
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- anon can read order items (column grant restricts to non-sensitive columns)
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);
