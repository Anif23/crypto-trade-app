import { useState } from "react";
import { cn } from "@/lib/utils";

export function CoinIcon({
  src,
  symbol,
  size = 32,
  className,
}: {
  src?: string | null;
  symbol: string;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold uppercase text-muted-foreground",
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      loading="lazy"
      className={cn("shrink-0 rounded-full", className)}
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
}
