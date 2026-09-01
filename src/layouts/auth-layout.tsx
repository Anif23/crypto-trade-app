import { Link } from "react-router-dom";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">CryptoTrade</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>

      {/* visual side */}
      <div className="relative hidden overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-20 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
        <div className="relative flex h-full flex-col justify-center p-12">
          <h2 className="text-balance text-3xl font-bold tracking-tight">
            Practice trading with real data and virtual money.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Join a risk-free environment to learn how crypto markets work — build strategies, track your
            portfolio, and refine your skills without risking a cent.
          </p>
          <div className="mt-8 space-y-3">
            {["$100,000 in virtual funds on sign-up", "20+ cryptocurrencies with live prices", "Full portfolio analytics and trade history"].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-success" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to}>
      <Button variant="link" className="h-auto p-0 text-primary">
        {children}
      </Button>
    </Link>
  );
}
