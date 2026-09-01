import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { AuthLayout, AuthLink } from "@/layouts/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error } = await signUp(name.trim(), email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get $100,000 in virtual funds to start paper trading."
      footer={<>Already have an account? <AuthLink to="/login">Sign in</AuthLink></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Full name</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              required
              placeholder="Jane Trader"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9"
              autoComplete="name"
            />
          </div>
        </div>
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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          <span className="font-semibold text-warning">Paper trading: </span>
          You'll receive $100,000 in virtual funds. No real money is involved.
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
