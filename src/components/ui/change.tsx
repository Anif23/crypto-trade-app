import { cn } from "@/lib/utils";

type Tone = "up" | "down" | "neutral";

export function ChangeBadge({
  value,
  className,
  showSign = true,
}: {
  value: number | null | undefined;
  className?: string;
  showSign?: boolean;
}) {
  const tone: Tone = value === null || value === undefined || isNaN(value)
    ? "neutral"
    : value > 0
    ? "up"
    : value < 0
    ? "down"
    : "neutral";
  const sign = showSign && value !== 0 ? (value! > 0 ? "+" : "") : "";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular",
        tone === "up" && "bg-success/15 text-success",
        tone === "down" && "bg-destructive/15 text-destructive",
        tone === "neutral" && "bg-muted text-muted-foreground",
        className
      )}
    >
      {sign}
      {value === null || value === undefined || isNaN(value)
        ? "0.00%"
        : `${Math.abs(value).toFixed(2)}%`}
    </span>
  );
}

export function PnlText({
  value,
  className,
  prefix = "\u20b9",
}: {
  value: number | null | undefined;
  className?: string;
  prefix?: string;
}) {
  const positive = (value ?? 0) > 0;
  const negative = (value ?? 0) < 0;
  return (
    <span
      className={cn(
        "tabular font-semibold",
        positive && "text-success",
        negative && "text-destructive",
        !positive && !negative && "text-muted-foreground",
        className
      )}
    >
      {positive && prefix === "\u20b9" ? "+" : ""}
      {prefix}
      {Math.abs(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}
