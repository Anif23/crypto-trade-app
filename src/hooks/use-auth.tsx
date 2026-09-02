import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string; success?: boolean; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadProfile = React.useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = React.useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Provide helpful error messages
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Invalid email or password. Please try again." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "Please confirm your email address before signing in. Check your inbox for the confirmation link." };
      }
      return { error: mapAuthError(error.message) };
    }
    
    // Load profile after successful sign in
    if (data.user) {
      await loadProfile(data.user.id);
    }
    
    return {};
  }, [loadProfile]);

  const signUp = React.useCallback(async (name: string, email: string, password: string) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: "Please enter a valid email address." };
    }

    // Check password strength
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: emailAvailable, error: availabilityError } = await supabase.rpc(
      "is_signup_email_available",
      { p_email: normalizedEmail }
    );

    if (!availabilityError && emailAvailable === false) {
      return { error: "This email is already registered. Please sign in instead." };
    }

    if (availabilityError) {
      return { error: "We couldn't verify this email right now. Please try again." };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/login`
      },
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists") || error.message.includes("User already registered")) {
        return { error: "This email is already registered. Please sign in instead." };
      }
      return { error: mapAuthError(error.message) };
    }

    // Supabase returns no session when email confirmation is required.
    if (data.user && !data.session) {
      return { success: true, needsConfirmation: true };
    }

    if (data.user && data.session) {
      await new Promise((r) => setTimeout(r, 400));
      await loadProfile(data.user.id);
      return { success: true, needsConfirmation: false };
    }

    return { success: true, needsConfirmation: true };
  }, [loadProfile]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message || "Something went wrong. Please try again.";
}
