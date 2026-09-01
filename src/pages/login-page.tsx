import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { AuthLayout, AuthLink } from "@/layouts/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your paper-trading journey."
      footer={<>Don't have an account? <AuthLink to="/register">Create one</AuthLink></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              autoComplete="email"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/markets" className="hover:text-foreground">Browse markets without signing in →</Link>
      </p>
    </AuthLayout>
  );
}
