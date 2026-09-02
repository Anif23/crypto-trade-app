/*
# Seed supported crypto assets

Populates `crypto_assets` with the top coins supported by CoinGecko so the market UI has
data immediately (the market-data edge function refreshes prices + stats shortly after).
Initial prices are approximate placeholders; the edge function overwrites them with live
values on its first run. Uses ON CONFLICT so re-running is safe.
*/

INSERT INTO crypto_assets (coingecko_id, symbol, name, image_url, current_price, market_cap, total_volume, price_change_percentage_24h, high_24h, low_24h, rank)
VALUES
  ('bitcoin', 'BTC', 'Bitcoin', 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', 104250.32, 2060000000000, 68000000000, 2.43, 105000, 102000, 1),
  ('ethereum', 'ETH', 'Ethereum', 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', 3120.55, 375000000000, 24000000000, 1.87, 3180, 3050, 2),
  ('tether', 'USDT', 'Tether', 'https://assets.coingecko.com/coins/images/325/large/Tether.png', 1.0001, 135000000000, 85000000000, 0.01, 1.001, 0.999, 3),
  ('binancecoin', 'BNB', 'BNB', 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', 685.40, 100000000000, 1800000000, 0.92, 692, 678, 4),
  ('solana', 'SOL', 'Solana', 'https://assets.coingecko.com/coins/images/4128/large/solana.png', 198.34, 92000000000, 4200000000, 3.21, 202, 191, 5),
  ('ripple', 'XRP', 'XRP', 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', 2.34, 130000000000, 5100000000, 1.45, 2.38, 2.30, 6),
  ('usd-coin', 'USDC', 'USD Coin', 'https://assets.coingecko.com/coins/images/6319/large/usdc.png', 1.0002, 42000000000, 12000000000, 0.00, 1.001, 0.999, 7),
  ('dogecoin', 'DOGE', 'Dogecoin', 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', 0.3821, 56000000000, 3800000000, 4.12, 0.395, 0.365, 8),
  ('cardano', 'ADA', 'Cardano', 'https://assets.coingecko.com/coins/images/975/large/cardano.png', 1.08, 38000000000, 1200000000, -0.78, 1.11, 1.06, 9),
  ('avalanche-2', 'AVAX', 'Avalanche', 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_Red.png', 38.45, 15000000000, 600000000, 2.05, 39.20, 37.80, 10),
  ('tron', 'TRX', 'TRON', 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', 0.2456, 21000000000, 900000000, 0.34, 0.248, 0.243, 11),
  ('chainlink', 'LINK', 'Chainlink', 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', 22.18, 14000000000, 700000000, 3.67, 22.80, 21.50, 12),
  ('polkadot', 'DOT', 'Polkadot', 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', 7.42, 11000000000, 350000000, -1.23, 7.60, 7.30, 13),
  ('polygon', 'MATIC', 'Polygon', 'https://assets.coingecko.com/coins/images/4713/large/matic_token_icon.png', 0.5234, 5200000000, 280000000, 1.88, 0.535, 0.512, 14),
  ('litecoin', 'LTC', 'Litecoin', 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', 102.77, 7700000000, 540000000, 0.56, 104, 101, 15),
  ('uniswap', 'UNI', 'Uniswap', 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg', 11.92, 7100000000, 240000000, -0.42, 12.10, 11.75, 16),
  ('cosmos', 'ATOM', 'Cosmos', 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png', 6.78, 2600000000, 130000000, 2.11, 6.92, 6.65, 17),
  ('stellar', 'XLM', 'Stellar', 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_blackRGB.png', 0.4123, 12000000000, 320000000, 1.22, 0.418, 0.408, 18),
  ('monero', 'XMR', 'Monero', 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png', 215.60, 3900000000, 85000000, 0.78, 218, 213, 19),
  ('aptos', 'APT', 'Aptos', 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png', 8.94, 4200000000, 220000000, 3.45, 9.12, 8.71, 20)
ON CONFLICT (coingecko_id) DO UPDATE SET
  symbol = EXCLUDED.symbol,
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  rank = EXCLUDED.rank,
  updated_at = now();
