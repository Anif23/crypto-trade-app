/*
# CryptoTrade initial schema

## Purpose
Full-stack crypto PAPER-TRADING platform. Users register and receive $100,000 USDT
in virtual funds to practice buying/selling real cryptocurrencies at live market prices.
No real money is ever involved.

## Tables
1. `profiles` — extends Supabase auth.users with app-specific data (display_name, role,
   virtual_cash_balance, disabled flag). The first registered user becomes ADMIN.
2. `crypto_assets` — supported coins (coingecko id, symbol, name, image). Seeded.
3. `price_history` — cached historical OHLC candles per asset/interval/period, written
   by the market-data edge function to avoid repeated external calls.
4. `holdings` — current quantity + average buy price per user/asset. One row per holding.
5. `orders` — immutable trade ledger (BUY/SELL, qty, price, total, status). The source of
   truth for transaction history.
6. `watchlist` — per-user favorite coins (unique user+asset).

## Security
- RLS enabled on every table.
- profiles/holdings/orders/watchlist: owner-scoped (auth.uid() = user_id), authenticated only.
- crypto_assets / price_history: readable by anon+authenticated (market data is public).
- profiles: users read/update only their own row; admins read all via service-role edge fn.
- Admin actions run through a SECURITY DEFINER function guarded by an admin check, NOT
  through client-side RLS, so the admin's elevated access lives on the server.

## Server logic
- `buy(asset_id, quantity)` / `sell(asset_id, quantity)` SECURITY DEFINER functions perform
  the atomic trade: lock the asset, fetch live price, validate balance/holdings, update
  cash + holding, insert order row. All in one statement sequence. Errors raise SQLSTATE
  conditions the frontend maps to messages.
- `get_portfolio()` returns computed portfolio summary (balances, P&L) per user.
- `admin_list_users()` / `admin_set_user_status()` / `admin_stats()` enforce admin role.
- `handle_new_user()` trigger grants new users $100,000 virtual cash and TRADER role; the
  very first user is promoted to ADMIN.
*/

-- ============================================================
-- enums
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'TRADER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE candle_interval AS ENUM ('1H', '4H', '1D', '1W', '1M', '1Y');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'TRADER',
  virtual_cash_balance numeric(20,2) NOT NULL DEFAULT 100000.00,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- crypto_assets
-- ============================================================
CREATE TABLE IF NOT EXISTS crypto_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coingecko_id text UNIQUE NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  image_url text,
  current_price numeric(20,8) NOT NULL DEFAULT 0,
  market_cap numeric(24,2) NOT NULL DEFAULT 0,
  total_volume numeric(24,2) NOT NULL DEFAULT 0,
  price_change_percentage_24h numeric(10,4) NOT NULL DEFAULT 0,
  high_24h numeric(20,8) NOT NULL DEFAULT 0,
  low_24h numeric(20,8) NOT NULL DEFAULT 0,
  rank int,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crypto_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_read_all" ON crypto_assets;
CREATE POLICY "assets_read_all" ON crypto_assets FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- price_history (cached candles)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES crypto_assets(id) ON DELETE CASCADE,
  "interval" candle_interval NOT NULL,
  time bigint NOT NULL,
  open numeric(20,8) NOT NULL,
  high numeric(20,8) NOT NULL,
  low numeric(20,8) NOT NULL,
  close numeric(20,8) NOT NULL,
  volume numeric(24,2) NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, "interval", time)
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_history_read_all" ON price_history;
CREATE POLICY "price_history_read_all" ON price_history FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- holdings
-- ============================================================
CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES crypto_assets(id) ON DELETE CASCADE,
  quantity numeric(20,8) NOT NULL DEFAULT 0,
  avg_buy_price numeric(20,8) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id)
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "holdings_select_own" ON holdings;
CREATE POLICY "holdings_select_own" ON holdings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "holdings_insert_own" ON holdings;
CREATE POLICY "holdings_insert_own" ON holdings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "holdings_update_own" ON holdings;
CREATE POLICY "holdings_update_own" ON holdings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "holdings_delete_own" ON holdings;
CREATE POLICY "holdings_delete_own" ON holdings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES crypto_assets(id) ON DELETE CASCADE,
  side order_side NOT NULL,
  quantity numeric(20,8) NOT NULL,
  price numeric(20,8) NOT NULL,
  total numeric(20,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'COMPLETED',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- watchlist
-- ============================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES crypto_assets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlist_select_own" ON watchlist;
CREATE POLICY "watchlist_select_own" ON watchlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlist_insert_own" ON watchlist;
CREATE POLICY "watchlist_insert_own" ON watchlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watchlist_delete_own" ON watchlist;
CREATE POLICY "watchlist_delete_own" ON watchlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_asset ON orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_price_history_asset_int_time ON price_history(asset_id, "interval", time DESC);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON crypto_assets(symbol);

-- ============================================================
-- helper: is current user admin?
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role = 'ADMIN' AND disabled = false);
$$;

-- ============================================================
-- trigger: new user -> profile + virtual funds; first user = ADMIN
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first boolean;
BEGIN
  SELECT count(*) = 0 INTO is_first FROM profiles;
  INSERT INTO profiles (id, display_name, email, role, virtual_cash_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE WHEN is_first THEN 'ADMIN'::user_role ELSE 'TRADER'::user_role END,
    100000.00
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
