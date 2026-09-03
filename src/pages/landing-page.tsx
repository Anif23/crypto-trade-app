import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  Wallet,
  ArrowRight,
  Check,
  LineChart as LineChartIcon,
  Lock,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoinIcon } from "@/components/coin-icon";
import { ChangeBadge } from "@/components/ui/change";
import { useAssets } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function LandingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { data: assets, isLoading } = useAssets();
  const topCoins = (assets ?? []).slice(0, 6);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="container flex min-h-16 items-center justify-between gap-3 py-3 md:h-16 md:py-0">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="truncate text-base font-bold tracking-tight sm:text-lg">CryptoTrade</span>
            <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
              Paper
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#security" className="text-sm text-muted-foreground hover:text-foreground">Security</a>
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link to="/login" className="hidden md:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/register" className="hidden md:block"><Button size="sm">Get started</Button></Link>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-border px-4 py-3 md:hidden">
            <div className="container flex flex-col gap-1">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Features</a>
              <a href="#how" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">How it works</a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Security</a>
              <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/register"><Button size="sm">Get started</Button></Link>
            </div>
          </nav>
        )}
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute -top-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="container relative py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">₹1,00,000 virtual funds on sign-up</span>
            </div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Master crypto trading with
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent"> zero risk</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              Practice buying and selling Bitcoin, Ethereum, and 20+ cryptocurrencies using real-time market
              data and virtual money. An educational simulator built for learning — not gambling.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start trading free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/markets">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <BarChart3 className="h-4 w-4" />
                  Explore markets
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card · No real money · Educational simulation only
            </p>
          </div>

          {/* live price ticker */}
          <div className="mx-auto mt-14 max-w-5xl">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="mt-3 h-4 w-20" />
                    <Skeleton className="mt-2 h-4 w-14" />
                  </div>
                ))
                : topCoins.map((c) => (
                  <Card key={c.id} className="p-4">
                    <div className="flex items-center gap-2">
                      <CoinIcon src={c.image_url} symbol={c.symbol} size={24} />
                      <span className="text-sm font-semibold">{c.symbol}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium tabular">{formatPrice(c.current_price)}</p>
                    <ChangeBadge value={c.price_change_percentage_24h} className="mt-1" />
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* popular coins strip */}
      <section className="border-y border-border bg-card/40">
        <div className="container py-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Popular cryptocurrencies</h2>
              <p className="text-sm text-muted-foreground">Live prices from CoinGecko, refreshed every minute.</p>
            </div>
            <Link to="/markets" className="hidden sm:block">
              <Button variant="ghost" size="sm">View all <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="ml-auto h-4 w-20" />
                    <Skeleton className="ml-auto h-3 w-14" />
                  </div>
                </div>
              ))
              : (assets ?? []).slice(0, 8).map((c) => (
                <Card key={c.id} className="flex items-center justify-between p-4 transition-colors hover:border-primary/40">
                  <Link to={`/coin/${c.id}`} className="flex items-center gap-3">
                    <CoinIcon src={c.image_url} symbol={c.symbol} size={32} />
                    <div>
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs uppercase text-muted-foreground">{c.symbol}</p>
                    </div>
                  </Link>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular">{formatPrice(c.current_price)}</p>
                    <ChangeBadge value={c.price_change_percentage_24h} className="mt-1" />
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to learn trading</h2>
          <p className="mt-4 text-muted-foreground">Professional-grade tools in a risk-free environment.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="border-y border-border bg-card/40">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How paper trading works</h2>
            <p className="mt-4 text-muted-foreground">Three steps from sign-up to your first virtual trade.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* security */}
      <section id="security" className="container py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" /> Secure by design
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Your data is protected</h2>
            <p className="mt-4 text-muted-foreground">
              We use industry-standard security practices so you can focus on learning.
            </p>
            <ul className="mt-6 space-y-3">
              {SECURITY.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span className="text-sm">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Encrypted authentication</p>
                  <p className="text-xs text-muted-foreground">JWT sessions with hashed passwords</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                <Wallet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Server-side balance validation</p>
                  <p className="text-xs text-muted-foreground">Trades validated atomically in the database</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                <LineChartIcon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Real market data, fake money</p>
                  <p className="text-xs text-muted-foreground">Live prices, never real funds</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <Card className="relative overflow-hidden p-10 text-center lg:p-16">
          <div className="absolute -top-20 left-1/2 h-60 w-[30rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to start your trading journey?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Create a free account and receive ₹1,00,000 in virtual funds instantly. No deposit, no risk.
            </p>
            <Link to="/register" className="mt-8 inline-block">
              <Button size="lg">
                Create your free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* footer */}
      <footer className="border-t border-border">
        <div className="container py-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">CryptoTrade</span>
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-right max-w-md">
              CryptoTrade is an educational paper-trading simulator. Prices reflect real market data, but all
              trades use virtual funds. This is not financial advice, and no real money is ever involved.
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} CryptoTrade. Built for learning.
          </p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: Zap, title: "Instant ₹1,00,000 virtual funds", desc: "Every new account starts with ₹1,00,000 in paper money — no deposit required." },
  { icon: BarChart3, title: "Real-time market data", desc: "Live prices for 20+ cryptocurrencies, fetched from CoinGecko and cached for speed." },
  { icon: Wallet, title: "Atomic trade execution", desc: "Buys and sells are validated and committed server-side, so balances always stay consistent." },
  { icon: LineChartIcon, title: "Interactive price charts", desc: "Browse historical prices across 1H to 1Y intervals with responsive, detailed charts." },
  { icon: ShieldCheck, title: "Role-based access control", desc: "Secure authentication with admin and trader roles enforced on the backend." },
  { icon: TrendingUp, title: "Full portfolio analytics", desc: "Track P&L, allocation, and average buy prices across all your holdings." },
];

const STEPS = [
  { title: "Create an account", desc: "Sign up for free and get ₹1,00,000 in virtual funds credited to your paper-trading account instantly." },
  { title: "Explore the markets", desc: "Browse live crypto prices, add coins to your watchlist, and study interactive price charts." },
  { title: "Place virtual trades", desc: "Buy and sell with a few clicks. Your portfolio and transaction history update in real time." },
];

const SECURITY = [
  "Passwords are hashed with industry-standard algorithms — never stored in plain text.",
  "JWT-based sessions with automatic token refresh and expiration.",
  "Server-side authorization on every trade — the frontend can't bypass balance checks.",
  "Admin actions protected by dedicated backend authorization logic.",
  "No real payment instruments, custodial wallets, or private keys are ever handled.",
];
