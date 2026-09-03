import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/types";
import { Skeleton } from "./ui/skeleton";

interface Props {
  candles: Candle[];
  interval: string;
  candleInterval?: string;
  synthetic?: boolean;
  height?: number;
  livePrice?: number | null;
  isPending?: boolean;
}

const SEC: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

function cleanTime(value: unknown): number {
  const n = Number(value);
  return n > 1e11 ? Math.floor(n / 1000) : Math.floor(n);
}

function cleanCandles(candles: Candle[]) {
  const map = new Map<number, Candle>();

  for (const c of candles) {
    const time = cleanTime(c.time);
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);
    const volume = Number(c.volume) || 0;

    if (
      time > 0 &&
      open > 0 &&
      high > 0 &&
      low > 0 &&
      close > 0
    ) {
      map.set(time, {
        time,
        open,
        high,
        low,
        close,
        volume,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => Number(a.time) - Number(b.time)
  );
}

export function CandleChart({
  candles,
  candleInterval = "1m",
  height = 360,
  livePrice,
  isPending,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef =
    useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef =
    useRef<ISeriesApi<"Histogram"> | null>(null);
  const liveCandleRef = useRef<Candle | null>(null);

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const isMobile = containerWidth < 640;

    const chart = createChart(containerRef.current, {
      width: containerWidth,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#8290a3",
      },
      grid: {
        vertLines: { color: "#1a1e24" },
        horzLines: { color: "#1a1e24" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "#252b33",
        scaleMargins: {
          top: 0.08,
          bottom: 0.25,
        },
        visible: true,
        minimumWidth: isMobile ? 50 : 60,
      },
      timeScale: {
        borderColor: "#252b33",
        timeVisible: true,
        secondsVisible: false,
        barSpacing: isMobile ? 8 : 12,
      },
    });

    const candlesSeries =
      chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        borderVisible: false,
      });

    const volumeSeries =
      chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleRef.current = candlesSeries;
    volumeRef.current = volumeSeries;

    const resize = () => {
      if (containerRef.current && chartRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const isMobile = newWidth < 640;
        
        chartRef.current.applyOptions({ 
          width: newWidth,
          rightPriceScale: {
            minimumWidth: isMobile ? 50 : 60,
          },
          timeScale: {
            barSpacing: isMobile ? 8 : 12,
          },
        });
      }
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chartRef.current?.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      liveCandleRef.current = null;
    };
  }, [height]);

  // Historical candles
  useEffect(() => {
    if (!candleRef.current || !volumeRef.current) return;

    const data = cleanCandles(candles);

    console.log('Chart rendering with data:', {
      rawCandles: candles.length,
      cleanedCandles: data.length,
      firstCandle: data[0],
      lastCandle: data[data.length - 1]
    });

    if (!data.length) {
      console.warn('No candle data to display');
      return;
    }

    try {
      candleRef.current.setData(
        data.map(c => ({
          time: Number(c.time) as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );

      volumeRef.current.setData(
        data.map(c => ({
          time: Number(c.time) as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? '#22c55e40' : '#ef444440',
        }))
      );

      liveCandleRef.current = data[data.length - 1];

      chartRef.current?.timeScale().fitContent();
    } catch (err) {
      console.error('Chart data update error:', err);
    }
  }, [candles]);

  // Realtime ticker updates follow the same current-candle model as Lightweight Charts.
  useEffect(() => {
    if (
      livePrice == null ||
      !Number.isFinite(livePrice) ||
      livePrice <= 0 ||
      !candleRef.current
    ) {
      return;
    }

    const seconds = SEC[candleInterval] ?? 60;
    const now = Math.floor(Date.now() / 1000);
    const time = Math.floor(now / seconds) * seconds;

    let candle = liveCandleRef.current;
    let updateTime = time;

    // Do not send an older timestamp than the last API candle.
    if (candle && Number(candle.time) > time) {
      updateTime = Number(candle.time);
    }

    // Start a new candle only after the API candle interval has elapsed.
    if (!candle || updateTime > Number(candle.time)) {
      candle = {
        time: updateTime,
        open: livePrice,
        high: livePrice,
        low: livePrice,
        close: livePrice,
        volume: 0,
      };

      liveCandleRef.current = candle;

      try {
        candleRef.current.update({
          time: updateTime as UTCTimestamp,
          open: livePrice,
          high: livePrice,
          low: livePrice,
          close: livePrice,
        });
      } catch (err) {
        console.warn("Chart update error (new candle):", err);
        // Ignore a tick during a history refresh; the next tick will retry it.
      }

      return;
    }

    // Update existing candle
    const updated = {
      ...candle,
      high: Math.max(candle.high, livePrice),
      low: Math.min(candle.low, livePrice),
      close: livePrice,
    };

    liveCandleRef.current = updated;

    try {
      candleRef.current.update({
        time: updateTime as UTCTimestamp,
        open: updated.open,
        high: updated.high,
        low: updated.low,
        close: updated.close,
      });
    } catch (err) {
      console.warn("Chart update error (existing candle):", err);
      // Ignore a tick during a history refresh; the next tick will retry it.
    }
  }, [livePrice, candleInterval]);

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
      }}
    >
      <div
        ref={containerRef}
        className={isPending ? "invisible" : ""}
        style={{ width: "100%", height }}
      />
      {isPending && (
        <div className="absolute inset-0">
          <Skeleton className="h-full w-full" />
        </div>
      )}
    </div>
  );
}

export function PriceChart(props: Props) {
  return <CandleChart {...props} />;
}