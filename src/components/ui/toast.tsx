import * as React from "react";
import { cn } from "@/lib/utils";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
}

interface ToastContextValue {
  toast: (t: Omit<ToastMessage, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((t: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-lg border p-4 shadow-lg animate-scale-in",
              t.variant === "success" && "border-success/30 bg-success/10 text-foreground",
              t.variant === "destructive" && "border-destructive/30 bg-destructive/10 text-foreground",
              (!t.variant || t.variant === "default") && "border-border bg-card text-foreground"
            )}
            onClick={() => dismiss(t.id)}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  t.variant === "success" && "bg-success",
                  t.variant === "destructive" && "bg-destructive",
                  (!t.variant || t.variant === "default") && "bg-primary"
                )}
              />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
