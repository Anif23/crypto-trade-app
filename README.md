# CryptoTrade — Crypto Paper Trading Platform

An educational full-stack cryptocurrency paper-trading simulator. Users receive **$100,000 in virtual funds** on sign-up and can practice buying and selling 20+ cryptocurrencies using **real-time market data** — with zero financial risk.

> **Paper Trading · Virtual Funds · Educational Simulation**
> No real money, deposits, withdrawals, or custodial wallets are ever involved.

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui-style components, TanStack Query, Recharts, React Router

**Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- PostgreSQL database with Prisma-style schema design
- JWT authentication via Supabase Auth (password hashing, sessions, token refresh)
- Server-side trading logic via SECURITY DEFINER Postgres functions (atomic buy/sell)
- Row Level Security on every table (owner-scoped)
- Edge Function proxies CoinGecko API with DB-backed caching (Redis-style)
- Admin authorization enforced in database functions

## Features

- **Landing page** — premium dark financial UI with live prices, features, how-it-works, security
- **Authentication** — register, login, logout, session management, role-based access (ADMIN/TRADER)
- **Market dashboard** — portfolio summary, watchlist, top gainers/losers, market table with search/sort/pagination
- **Coin detail** — live price, stats, interactive price chart (1H–1Y), buy/sell, watchlist toggle
- **Trading system** — atomic server-validated buy/sell with balance & holdings checks, confirmation dialogs
- **Portfolio** — holdings table with avg buy price, current value, P&L, allocation bars
- **Orders** — full transaction history with search/filter/pagination
- **Watchlist** — persisted in PostgreSQL, live prices, add/remove
- **Admin dashboard** — user management, platform stats, enable/disable accounts, popular coins

## Architecture

```
Frontend (React)
    ↓
Supabase Edge Function (market-data)  →  CoinGecko API
    ↓                                       ↓
Supabase PostgreSQL (cached prices)   ←─────┘
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

## Database Schema

- `profiles` — extends auth.users (display_name, role, virtual_cash_balance, disabled)
- `crypto_assets` — supported coins with live market data
- `price_history` — cached OHLC candles
- `holdings` — user positions (quantity, avg buy price)
- `orders` — immutable trade ledger
- `watchlist` — user favorites

The first registered user is automatically promoted to **ADMIN**. All subsequent users are **TRADER** with $100,000 virtual cash.

## Security

- RLS on every table; owner-scoped policies for user data
- Trading functions are SECURITY DEFINER — validate balance/holdings server-side, never trust the frontend
- Admin functions check `is_admin()` internally
- Market data proxied through edge function (no API keys in frontend)
- Passwords hashed by Supabase Auth; JWT sessions with auto-refresh
