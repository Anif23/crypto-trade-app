import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate name
    if (name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    const result = await signUp(name.trim(), email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.success) {
      setSuccess(true);
      
      // Start countdown and redirect
      let countdown = 5;
      const timer = setInterval(() => {
        countdown--;
        setRedirectCountdown(countdown);
        if (countdown === 0) {
          clearInterval(timer);
          navigate("/login", { 
            replace: true,
            state: { 
              message: result.needsConfirmation 
                ? "Please check your email to confirm your account before signing in."
                : "Registration successful! You can now sign in."
            }
          });
        }
      }, 1000);
    }
  };

  // Show success screen after registration
  if (success) {
    return (
      <AuthLayout
        title="Registration Successful!"
        subtitle="Your account has been created."
        footer={null}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="rounded-full bg-success/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Check Your Email</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                We've sent a confirmation email to <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-center space-y-2 w-full">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-primary">Important:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please click the confirmation link in your email to activate your account. 
                    You won't be able to sign in until you verify your email address.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or wait a few minutes.
            </div>
          </div>

          <div className="rounded-lg bg-secondary/50 px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to sign in page in <span className="font-bold text-foreground">{redirectCountdown}</span> seconds...
            </p>
          </div>

          <Button 
            onClick={() => navigate("/login", { 
              state: { message: "Please check your email to confirm your account before signing in." }
            })}
            className="w-full"
          >
            Go to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get ₹1,00,000 in virtual funds to start paper trading."
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use a real email address - you'll need to confirm it.
          </p>
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
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          <span className="font-semibold text-warning">Paper trading: </span>
          You'll receive ₹1,00,000 in virtual funds. No real money is involved.
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
