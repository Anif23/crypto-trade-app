export type UserRole = "ADMIN" | "TRADER";
export type OrderSide = "BUY" | "SELL";
export type OrderStatus = "COMPLETED" | "CANCELLED";
export type CandleInterval = "1H" | "4H" | "1D" | "1W" | "1M" | "1Y";

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  virtual_cash_balance: number;
  disabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CryptoAsset {
  id: string;
  coingecko_id: string;
  symbol: string;
  name: string;
  image_url: string | null;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  rank: number | null;
  updated_at: string;
  created_at: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HoldingDetail {
  asset_id: string;
  symbol: string;
  name: string;
  image_url: string | null;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  invested: number;
  current_value: number;
  pnl: number;
  pnl_pct: number;
}

export interface Portfolio {
  cash: number;
  invested: number;
  current_value: number;
  total_value: number;
  total_pnl: number;
  today_pnl: number;
  holdings: HoldingDetail[];
}

export interface Order {
  id: string;
  user_id: string;
  asset_id: string;
  side: OrderSide;
  quantity: number;
  price: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  crypto_assets?: { symbol: string; name: string; image_url: string | null };
}

export interface TradeResult {
  order_id: string;
  side: OrderSide;
  asset_id: string;
  quantity: number;
  price: number;
  total: number;
  new_cash_balance: number;
}

export interface AdminUser {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  disabled: boolean;
  virtual_cash_balance: number;
  created_at: string;
  trade_count: number;
  trade_volume: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_trades: number;
  trade_volume: number;
  top_coins: { symbol: string; name: string; trade_count: number; volume: number }[];
  recent_trades: {
    id: string;
    side: OrderSide;
    symbol: string;
    quantity: number;
    price: number;
    total: number;
    created_at: string;
    user_email: string;
  }[];
}
