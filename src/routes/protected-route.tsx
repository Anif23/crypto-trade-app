import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { FullScreenLoader } from "@/components/page-loader";

export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (profile?.disabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold">Account disabled</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account has been disabled by an administrator. Please contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  if (requireAdmin && profile?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
