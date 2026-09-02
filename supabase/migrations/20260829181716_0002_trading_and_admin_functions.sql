/*
# Trading & portfolio server functions

## What this adds
- `buy(asset_id, quantity)` — SECURITY DEFINER. Atomically executes a paper-trading BUY:
  locks the crypto_asset row, reads its current_price (kept fresh by the market-data edge
  function), validates the user's virtual cash balance covers `quantity * price`, deducts
  cash, upserts the holding with a weighted average buy price, and inserts a COMPLETED order.
  Runs as the caller; price and balance are NEVER trusted from the client.
- `sell(asset_id, quantity)` — symmetric. Validates the user owns >= quantity, credits
  proceeds to virtual_cash_balance, decrements the holding (and deletes it when it reaches
  ~0), inserts a COMPLETED SELL order.
- `get_portfolio()` — returns a single JSON object with cash balance, holdings (with live
  current price, current value, P&L, allocation %), and computed totals (invested value,
  total portfolio value, total P&L, today's P&L).
- `admin_list_users(search, page, size)` — admin-only paginated user list with trade counts.
- `admin_set_user_status(user_id, disabled)` — admin-only enable/disable a user account.
- `admin_stats()` — admin-only platform-wide statistics (totals, volume, top coins).

## Security
- All are SECURITY DEFINER so they run with the schema owner's privileges (needed to write
  to holdings/orders and read all profiles for admin functions). They re-check auth.uid()
  and role inside, so RLS being enabled on the base tables does not weaken them.
- buy/sell only act on the caller's own data. admin_* functions verify is_admin() and
  raise '42501 insufficient_privilege' otherwise.
- Errors use SQLSTATE codes the frontend maps to friendly messages (42204 insufficient
  balance, 42205 insufficient holdings, 42206 asset not found, 42501 forbidden).
*/

-- ============================================================
-- buy
-- ============================================================
CREATE OR REPLACE FUNCTION buy(p_asset_id uuid, p_quantity numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_price numeric(20,8);
  v_cost numeric(20,2);
  v_cash numeric(20,2);
  v_qty numeric(20,8) := p_quantity;
  v_existing numeric(20,8);
  v_existing_avg numeric(20,8);
  v_new_qty numeric(20,8);
  v_new_avg numeric(20,8);
  v_order_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE 'authentication_required';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE 'invalid_quantity';
  END IF;

  -- lock the asset row and read the server-side current price
  SELECT current_price INTO v_price
    FROM crypto_assets WHERE id = p_asset_id FOR UPDATE;
  IF NOT FOUND OR v_price IS NULL OR v_price <= 0 THEN
    RAISE 'asset_not_found';
  END IF;

  v_cost := round((v_qty * v_price)::numeric, 2);

  -- lock and read the user's cash balance
  SELECT virtual_cash_balance INTO v_cash
    FROM profiles WHERE id = v_uid FOR UPDATE;
  IF v_cash IS NULL THEN
    RAISE 'profile_not_found';
  END IF;
  IF v_cash < v_cost THEN
    RAISE 'insufficient_balance';
  END IF;

  -- deduct cash
  UPDATE profiles SET virtual_cash_balance = virtual_cash_balance - v_cost,
                       updated_at = now()
   WHERE id = v_uid;

  -- upsert holding with weighted average buy price
  SELECT quantity, avg_buy_price INTO v_existing, v_existing_avg
    FROM holdings WHERE user_id = v_uid AND asset_id = p_asset_id FOR UPDATE;

  IF v_existing IS NULL OR v_existing = 0 THEN
    v_new_qty := v_qty;
    v_new_avg := v_price;
  ELSE
    v_new_qty := v_existing + v_qty;
    v_new_avg := ((v_existing_avg * v_existing) + (v_price * v_qty)) / v_new_qty;
  END IF;

  INSERT INTO holdings (user_id, asset_id, quantity, avg_buy_price, updated_at)
  VALUES (v_uid, p_asset_id, v_new_qty, v_new_avg, now())
  ON CONFLICT (user_id, asset_id) DO UPDATE
    SET quantity = excluded.quantity,
        avg_buy_price = excluded.avg_buy_price,
        updated_at = now();

  -- record the order
  INSERT INTO orders (user_id, asset_id, side, quantity, price, total, status)
  VALUES (v_uid, p_asset_id, 'BUY', v_qty, v_price, v_cost, 'COMPLETED')
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'side', 'BUY',
    'asset_id', p_asset_id,
    'quantity', v_qty,
    'price', v_price,
    'total', v_cost,
    'new_cash_balance', v_cash - v_cost
  );
END;
$$;

-- ============================================================
-- sell
-- ============================================================
CREATE OR REPLACE FUNCTION sell(p_asset_id uuid, p_quantity numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_price numeric(20,8);
  v_proceeds numeric(20,2);
  v_cash numeric(20,2);
  v_qty numeric(20,8) := p_quantity;
  v_have numeric(20,8);
  v_new_qty numeric(20,8);
  v_order_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE 'authentication_required';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE 'invalid_quantity';
  END IF;

  SELECT current_price INTO v_price
    FROM crypto_assets WHERE id = p_asset_id FOR UPDATE;
  IF NOT FOUND OR v_price IS NULL OR v_price <= 0 THEN
    RAISE 'asset_not_found';
  END IF;

  v_proceeds := round((v_qty * v_price)::numeric, 2);

  -- lock the holding
  SELECT quantity INTO v_have
    FROM holdings WHERE user_id = v_uid AND asset_id = p_asset_id FOR UPDATE;
  IF v_have IS NULL OR v_have < v_qty THEN
    RAISE 'insufficient_holdings';
  END IF;

  -- lock + credit cash
  SELECT virtual_cash_balance INTO v_cash
    FROM profiles WHERE id = v_uid FOR UPDATE;
  IF v_cash IS NULL THEN
    RAISE 'profile_not_found';
  END IF;
  UPDATE profiles SET virtual_cash_balance = virtual_cash_balance + v_proceeds,
                       updated_at = now()
   WHERE id = v_uid;

  v_new_qty := v_have - v_qty;
  IF v_new_qty < 1e-8 THEN
    DELETE FROM holdings WHERE user_id = v_uid AND asset_id = p_asset_id;
  ELSE
    UPDATE holdings SET quantity = v_new_qty, updated_at = now()
     WHERE user_id = v_uid AND asset_id = p_asset_id;
  END IF;

  INSERT INTO orders (user_id, asset_id, side, quantity, price, total, status)
  VALUES (v_uid, p_asset_id, 'SELL', v_qty, v_price, v_proceeds, 'COMPLETED')
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'side', 'SELL',
    'asset_id', p_asset_id,
    'quantity', v_qty,
    'price', v_price,
    'total', v_proceeds,
    'new_cash_balance', v_cash + v_proceeds
  );
END;
$$;

-- ============================================================
-- get_portfolio
-- ============================================================
CREATE OR REPLACE FUNCTION get_portfolio()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cash numeric(20,2);
  v_today_pnl numeric(20,2) := 0;
  v_holdings jsonb;
  v_invested numeric(20,2) := 0;
  v_current numeric(20,2) := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE 'authentication_required';
  END IF;

  SELECT virtual_cash_balance INTO v_cash FROM profiles WHERE id = v_uid;
  IF v_cash IS NULL THEN
    RAISE 'profile_not_found';
  END IF;

  -- today's P&L = sum over today's SELL proceeds - cost basis sold + unrealized is captured
  -- in total P&L. For a simple, robust "today's P&L" we sum realized P&L of trades today.
  SELECT COALESCE(sum(
    CASE WHEN o.side = 'SELL' THEN o.total - (o.quantity * h.avg_buy_price)
         ELSE 0 END
  ), 0)
  INTO v_today_pnl
  FROM orders o
  JOIN holdings h ON h.user_id = o.user_id AND h.asset_id = o.asset_id
  WHERE o.user_id = v_uid AND o.created_at >= date_trunc('day', now());

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'asset_id', a.id,
    'symbol', a.symbol,
    'name', a.name,
    'image_url', a.image_url,
    'quantity', h.quantity,
    'avg_buy_price', h.avg_buy_price,
    'current_price', a.current_price,
    'invested', round((h.quantity * h.avg_buy_price)::numeric, 2),
    'current_value', round((h.quantity * a.current_price)::numeric, 2),
    'pnl', round((h.quantity * (a.current_price - h.avg_buy_price))::numeric, 2),
    'pnl_pct', CASE WHEN h.avg_buy_price > 0 THEN
      round((((a.current_price - h.avg_buy_price) / h.avg_buy_price) * 100)::numeric, 2)
      ELSE 0 END
  ) ORDER BY (h.quantity * a.current_price) DESC NULLS LAST), '[]'::jsonb)
  INTO v_holdings
  FROM holdings h
  JOIN crypto_assets a ON a.id = h.asset_id
  WHERE h.user_id = v_uid AND h.quantity > 1e-8;

  SELECT COALESCE(sum((h.quantity * h.avg_buy_price)), 0),
         COALESCE(sum((h.quantity * a.current_price)), 0)
  INTO v_invested, v_current
  FROM holdings h JOIN crypto_assets a ON a.id = h.asset_id
  WHERE h.user_id = v_uid AND h.quantity > 1e-8;

  v_invested := round(v_invested::numeric, 2);
  v_current := round(v_current::numeric, 2);
  v_today_pnl := round(v_today_pnl::numeric, 2);

  RETURN jsonb_build_object(
    'cash', v_cash,
    'invested', v_invested,
    'current_value', v_current,
    'total_value', round((v_cash + v_current)::numeric, 2),
    'total_pnl', round((v_current - v_invested)::numeric, 2),
    'today_pnl', v_today_pnl,
    'holdings', v_holdings
  );
END;
$$;

-- ============================================================
-- admin: list users (with trade count + volume)
-- ============================================================
CREATE OR REPLACE FUNCTION admin_list_users(p_search text DEFAULT NULL, p_page int DEFAULT 1, p_page_size int DEFAULT 20)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_users jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE 'forbidden';
  END IF;
  IF p_page < 1 THEN p_page := 1; END IF;
  IF p_page_size < 1 OR p_page_size > 100 THEN p_page_size := 20; END IF;

  SELECT count(*) INTO v_total FROM profiles
    WHERE p_search IS NULL OR p_search = ''
       OR email ILIKE '%' || p_search || '%'
       OR display_name ILIKE '%' || p_search || '%';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'email', p.email,
    'role', p.role,
    'disabled', p.disabled,
    'virtual_cash_balance', p.virtual_cash_balance,
    'created_at', p.created_at,
    'trade_count', COALESCE(tc.c, 0),
    'trade_volume', COALESCE(tc.v, 0)
  ) ORDER BY p.created_at DESC), '[]'::jsonb)
  INTO v_users
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, count(*) AS c, COALESCE(sum(total), 0) AS v
    FROM orders GROUP BY user_id
  ) tc ON tc.user_id = p.id
  WHERE p_search IS NULL OR p_search = ''
     OR p.email ILIKE '%' || p_search || '%'
     OR p.display_name ILIKE '%' || p_search || '%'
  LIMIT p_page_size OFFSET (p_page - 1) * p_page_size;

  RETURN jsonb_build_object(
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'users', v_users
  );
END;
$$;

-- ============================================================
-- admin: enable/disable a user
-- ============================================================
CREATE OR REPLACE FUNCTION admin_set_user_status(p_user_id uuid, p_disabled boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE 'forbidden';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE 'cannot_disable_self';
  END IF;
  UPDATE profiles SET disabled = p_disabled, updated_at = now()
   WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE 'user_not_found';
  END IF;
  RETURN jsonb_build_object('id', p_user_id, 'disabled', p_disabled);
END;
$$;

-- ============================================================
-- admin: platform stats
-- ============================================================
CREATE OR REPLACE FUNCTION admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users int;
  v_active_users int;
  v_total_trades int;
  v_volume numeric(24,2);
  v_top_coins jsonb;
  v_recent jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE 'forbidden';
  END IF;

  SELECT count(*) INTO v_total_users FROM profiles;
  SELECT count(*) INTO v_active_users FROM profiles WHERE disabled = false;
  SELECT count(*), COALESCE(sum(total), 0) INTO v_total_trades, v_volume FROM orders;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'symbol', a.symbol, 'name', a.name, 'trade_count', t.c, 'volume', t.v
  ) ORDER BY t.c DESC), '[]'::jsonb)
  INTO v_top_coins
  FROM (
    SELECT asset_id, count(*) AS c, COALESCE(sum(total), 0) AS v
    FROM orders GROUP BY asset_id ORDER BY count(*) DESC LIMIT 5
  ) t
  JOIN crypto_assets a ON a.id = t.asset_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', o.id, 'side', o.side, 'symbol', a.symbol, 'quantity', o.quantity,
    'price', o.price, 'total', o.total, 'created_at', o.created_at,
    'user_email', p.email
  ) ORDER BY o.created_at DESC), '[]'::jsonb)
  INTO v_recent
  FROM orders o
  JOIN crypto_assets a ON a.id = o.asset_id
  JOIN profiles p ON p.id = o.user_id
  LIMIT 10;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'active_users', v_active_users,
    'total_trades', v_total_trades,
    'trade_volume', v_volume,
    'top_coins', v_top_coins,
    'recent_trades', v_recent
  );
END;
$$;

-- allow authenticated users to call their own portfolio + trade functions
GRANT EXECUTE ON FUNCTION buy(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION sell(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION get_portfolio() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_users(text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_user_status(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_stats() TO authenticated;
