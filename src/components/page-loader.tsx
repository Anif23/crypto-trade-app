import { Loader2 } from "lucide-react";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">{label}…</p>
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none">
            <path d="M8 21l5-6 4 3 7-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="24" cy="9" r="2" fill="#22D3EE" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight">CryptoTrade</span>
      </div>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
}
