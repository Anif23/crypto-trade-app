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
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mapAuthError(error) };
    return {};
  }, []);

  const signUp = React.useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: mapAuthError(error) };
    // email confirmation is OFF, so a session should be returned immediately
    if (data.user) {
      // give the trigger a moment, then load profile
      await new Promise((r) => setTimeout(r, 400));
      await loadProfile(data.user.id);
    }
    return {};
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

function mapAuthError(error: { code?: string; message?: string } | string): string {
  const code = typeof error === "string" ? undefined : error.code;
  const msg = typeof error === "string" ? error : error.message ?? "";

  if (code === "invalid_credentials" || /invalid(?: login)? credentials/i.test(msg))
    return "Incorrect email or password.";
  if (code === "user_already_exists" || /already registered|user already/i.test(msg))
    return "An account with this email already exists.";
  if (/rate limit/i.test(msg)) return "Too many attempts. Please wait a minute.";
  if (/password/i.test(msg) && /weak|short|at least/i.test(msg))
    return "Password must be at least 8 characters.";
  if (/email/i.test(msg) && /invalid|not valid/i.test(msg)) return "Please enter a valid email.";
  return "Something went wrong. Please try again.";
}
