# CryptoTrade — Crypto Paper Trading Platform

An educational full-stack cryptocurrency paper-trading simulator. Users receive **₹1,00,000 in virtual funds** on sign-up and can practice buying and selling 20+ cryptocurrencies using **real-time market data** — with zero financial risk.

> **Paper Trading · Virtual Funds · Educational Simulation**
> No real money, deposits, withdrawals, or custodial wallets are ever involved.

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui-style components, TanStack Query, Recharts, React Router

**Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- PostgreSQL database with RLS-protected tables and migrations
- Supabase Auth with password login, Google OAuth, email confirmation, sessions, and token refresh
- Server-side trading logic via SECURITY DEFINER PostgreSQL functions (atomic buy/sell)
- Edge Function proxies CoinGecko and Binance APIs with database-backed price and candle data
- Admin authorization enforced in database functions

## Features

- **Landing page** — premium dark financial UI with live prices, features, how-it-works, security
- **Authentication** — register, login, logout, password/email confirmation, Google OAuth, session management, and role-based access (ADMIN/TRADER)
- **Market dashboard** — portfolio summary, watchlist, top gainers/losers, market table with search/sort/pagination
- **Coin detail** — live price, stats, realtime candlestick chart (1H–1Y), buy/sell, watchlist toggle
- **Trading system** — atomic server-validated buy/sell with balance & holdings checks, confirmation dialogs
- **Portfolio** — holdings table with avg buy price, current value, P&L, allocation bars
- **Orders** — full transaction history with search/filter/pagination
- **Watchlist** — persisted in PostgreSQL, live prices, add/remove
- **Admin dashboard** — user management, platform stats, enable/disable accounts, popular coins

## Architecture

```
Frontend (React)
    ↓
Supabase Edge Function (market-data)
    ├── CoinGecko: INR market data and exchange data
    └── Binance: USD ticker and OHLC candle data
    ↓
Supabase PostgreSQL (assets, price history, users, trades)
    ↓
SECURITY DEFINER functions (buy/sell/portfolio/admin)
    ↓
RLS-protected tables
```

## Getting Started

The Supabase project is pre-provisioned. Environment variables are in `.env`.

```bash
npm install
npm run dev      # frontend dev server
npm run build    # production build
```

The frontend reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`.

To apply database migrations to the linked Supabase project:

```bash
npx supabase login
npx supabase db push
```

To deploy the market-data Edge Function:

```bash
npx supabase functions deploy market-data
```

## Database Schema

- `profiles` — extends auth.users (display_name, role, virtual_cash_balance, disabled)
- `crypto_assets` — supported coins with live market data
- `price_history` — cached OHLC candles
- `holdings` — user positions (quantity, avg buy price)
- `orders` — immutable trade ledger
- `watchlist` — user favorites

The first registered user is automatically promoted to **ADMIN**. All subsequent users are **TRADER** with ₹1,00,000 virtual cash.

## Application Flow

1. A user enters a valid email, name, and password of at least eight characters.
2. A secure `is_signup_email_available` function checks `auth.users` and `profiles` for duplicates without exposing user records.
3. Supabase Auth creates the account and sends a confirmation email. The account cannot be used until the email is confirmed when email confirmation is enabled.
4. Google users authenticate through Google and Supabase. The profile trigger creates their trading profile with ₹1,00,000 virtual cash.
5. The market-data Edge Function returns INR asset prices and historical OHLC candles. Realtime Binance USD ticker values are calibrated to the API’s INR reference price per coin, preventing currency-scale mismatches.
6. A buy or sell is executed server-side at the current asset price. After success, asset prices, cash, holdings, portfolio, orders, and watchlists are refreshed together.

For production email delivery, configure a custom SMTP provider in Supabase Auth. Supabase’s default email service is rate-limited.

## Security

- RLS on every table; owner-scoped policies for user data
- Trading functions are SECURITY DEFINER — validate balance/holdings server-side, never trust the frontend
- Admin functions check `is_admin()` internally
- Market data proxied through the Edge Function; no provider API keys are exposed in the frontend
- Passwords hashed by Supabase Auth; JWT sessions with auto-refresh
- Duplicate email checks run through a restricted SECURITY DEFINER function
- Email confirmation is required to verify that a signup address is usable
