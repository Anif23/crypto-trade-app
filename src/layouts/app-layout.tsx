import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LineChart,
  Wallet,
  History,
  Star,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn, formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/portfolio", label: "Portfolio", icon: Wallet },
  { to: "/orders", label: "Orders", icon: History },
  { to: "/watchlist", label: "Watchlist", icon: Star },
];

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isAdmin = profile?.role === "ADMIN";
  const navItems = isAdmin ? [...NAV, { to: "/admin", label: "Admin", icon: ShieldCheck }] : NAV;

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5" onClick={() => setMobileOpen(false)}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <TrendingUp className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="block text-base font-bold tracking-tight">CryptoTrade</span>
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Paper Trading</span>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Virtual Cash</span>
            <Badge variant="warning" className="text-[10px]">PAPER</Badge>
          </div>
          <p className="mt-1 font-semibold tabular">{formatUSD(profile?.virtual_cash_balance ?? 0)}</p>
          <div className="mt-2 flex items-center gap-2 truncate">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
              {(profile?.display_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{profile?.display_name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card lg:block">
        {SidebarContent}
      </aside>

      {/* mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card animate-fade-in">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        {/* top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border glass px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="muted" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Live market data
            </Badge>
          </div>
          <Link to="/markets">
            <Button size="sm" variant="outline" className="hidden sm:inline-flex">
              <LineChart className="h-4 w-4" />
              Trade
            </Button>
          </Link>
        </header>

        <main key={location.pathname} className="animate-fade-in p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* close icon for accessibility when mobile open */}
      {mobileOpen && (
        <button
          className="fixed right-4 top-4 z-[60] text-foreground lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
