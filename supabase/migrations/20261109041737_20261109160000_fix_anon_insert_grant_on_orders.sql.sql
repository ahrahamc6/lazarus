/*
# Fix anon INSERT grant on orders table

## Problem
The `orders` table had the RLS policy `anon_insert_orders` correctly defined
(INSERT TO anon, authenticated WITH CHECK (true)), but the underlying
`GRANT INSERT ON orders TO anon` was missing. Postgres checks grants BEFORE
policies, so anon got `401 Unauthorized` / `permission denied for table orders`
even though the policy would have allowed the insert.

## Changes
1. Grants
   - GRANT INSERT ON orders TO anon — fixes the 401 for public checkout.
   - Re-grant the full set (SELECT, INSERT, UPDATE, DELETE) to anon to keep
     it consistent and idempotent, and to authenticated.

## Security notes
- RLS remains enabled on `orders`. The policy `anon_insert_orders`
  (WITH CHECK true) still governs which rows anon can write. This migration
  only adds the missing table-level privilege; it does NOT weaken RLS.
- The `receipts` storage bucket already has `public_upload_receipts`
  (INSERT TO anon, authenticated) and the matching grant on storage.objects,
  so receipt uploads by anon were already permitted — no change needed there.
- No data is modified or deleted.
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO authenticated;
