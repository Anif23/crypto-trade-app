import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthLayout, AuthLink } from "@/layouts/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function RegisterPage() {
  const { signUp, signInWithGoogle } = useAuth();
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

      // Start countdown
      let countdown = 5;
      setRedirectCountdown(countdown);
      const timer = setInterval(() => {
        countdown -= 1;
        setRedirectCountdown(countdown);
        if (countdown <= 0) {
          clearInterval(timer);
          navigate("/login", {
            replace: true,
            state: {
              message: "Registration successful! Please check your email to confirm your account, then sign in.",
            },
          });
        }
      }, 1000);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      setError(error);
    }
    // OAuth will redirect automatically
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

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>
      </form>
    </AuthLayout>
  );
}
