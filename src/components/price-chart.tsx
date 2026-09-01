import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Candle } from "@/types";
import { formatPrice } from "@/lib/utils";

const FMT: Record<string, (t: number) => string> = {
  "1H": (t) => new Date(t * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  "4H": (t) => new Date(t * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  "1D": (t) => new Date(t * 1000).toLocaleTimeString("en-US", { hour: "2-digit" }),
  "1W": (t) => new Date(t * 1000).toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
  "1M": (t) => new Date(t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  "1Y": (t) => new Date(t * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
};

export function PriceChart({
  candles,
  interval,
  synthetic,
  height = 320,
}: {
  candles: Candle[];
  interval: string;
  synthetic?: boolean;
  height?: number;
}) {
  const data = useMemo(
    () => candles.map((c) => ({ time: c.time, price: c.close, volume: c.volume })),
    [candles]
  );

  const prices = data.map((d) => d.price).filter((p) => p > 0);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 1;
  const pad = (max - min) * 0.08 || max * 0.02;
  const up = prices.length > 1 && prices[prices.length - 1] >= prices[0];
  const color = up ? "hsl(142,71%,45%)" : "hsl(0,72%,51%)";
  const fmt = FMT[interval] ?? FMT["1D"];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No price data available.
      </div>
    );
  }

  return (
    <div className="w-full">
      {synthetic && (
        <div className="mb-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
          Live chart data is temporarily unavailable — showing the latest known price.
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,16%,17%)" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={fmt}
            tick={{ fill: "hsl(215,16%,58%)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={48}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fill: "hsl(215,16%,58%)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={72}
            tickFormatter={(v) => formatPrice(v).replace(/\.\d+$/, "")}
            orientation="right"
          />
          <Tooltip
            contentStyle={{
              background: "hsl(222,22%,8%)",
              border: "1px solid hsl(222,16%,17%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(215,16%,58%)" }}
            labelFormatter={(t) => new Date(Number(t) * 1000).toLocaleString("en-US")}
            formatter={(v: number) => [formatPrice(v), "Price"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill="url(#priceGrad)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
