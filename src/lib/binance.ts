// Maps our CoinGecko coin IDs to Binance trading pairs for live WebSocket + kline data.
// Binance uses USDT pairs. All coins here are available on Binance's public API (free, no key).
export const BINANCE_SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  tether: "USDTUSDT",
  binancecoin: "BNBUSDT",
  solana: "SOLUSDT",
  ripple: "XRPUSDT",
  "usd-coin": "USDCUSDT",
  dogecoin: "DOGEUSDT",
  cardano: "ADAUSDT",
  "avalanche-2": "AVAXUSDT",
  tron: "TRXUSDT",
  chainlink: "LINKUSDT",
  polkadot: "DOTUSDT",
  polygon: "MATICUSDT",
  litecoin: "LTCUSDT",
  uniswap: "UNIUSDT",
  cosmos: "ATOMUSDT",
  stellar: "XLMUSDT",
  monero: "XMRUSDT",
  aptos: "APTUSDT",
};

export function binanceSymbol(coingeckoId: string): string | null {
  return BINANCE_SYMBOL_MAP[coingeckoId] ?? null;
}

// Binance kline intervals that map to our UI intervals
export const BINANCE_INTERVAL_MAP: Record<string, string> = {
  "1H": "1m",
  "4H": "5m",
  "1D": "15m",
  "1W": "1h",
  "1M": "4h",
  "1Y": "1d",
};
