import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/components/ui/toast";
import { ProtectedRoute } from "@/routes/protected-route";
import { AppLayout } from "@/layouts/app-layout";
import { LandingPage } from "@/pages/landing-page";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { MarketsPage } from "@/pages/markets-page";
import { CoinDetailPage } from "@/pages/coin-detail-page";
import { PortfolioPage } from "@/pages/portfolio-page";
import { OrdersPage } from "@/pages/orders-page";
import { WatchlistPage } from "@/pages/watchlist-page";
import { AdminPage } from "@/pages/admin-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/coin/:id" element={<CoinDetailPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute requireAdmin />}>
                <Route element={<AppLayout />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
