import { useCallback, useEffect, useRef, useState } from "react";
import { binanceSymbol } from "@/lib/binance";

export interface LivePrice {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
}

export function useLivePrice(
  coingeckoId?: string,
  referencePrice?: number
): LivePrice | null {
  const [live, setLive] = useState<LivePrice | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const conversionRateRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!coingeckoId) return;

    const symbol = binanceSymbol(coingeckoId);
    if (!symbol || symbol === "USDTUSDT") return;

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@miniTicker`
    );

    wsRef.current = ws;

    ws.onmessage = e => {
      const d = JSON.parse(e.data);
      const close = Number(d.c);
      const open = Number(d.o);

      if (!close || !open) return;

      if (
        conversionRateRef.current == null &&
        referencePrice != null &&
        referencePrice > 0
      ) {
        conversionRateRef.current = referencePrice / close;
      }

      // Wait for the API INR baseline instead of showing a hardcoded conversion.
      if (conversionRateRef.current == null) return;

      const toINR = (value: number) => value * conversionRateRef.current!;

      const newPrice = {
        price: toINR(close),
        change: toINR(close - open),
        changePct: ((close - open) / open) * 100,
        high: toINR(Number(d.h)),
        low: toINR(Number(d.l)),
        volume: Number(d.v),
      };

      setLive(newPrice);
    };

    ws.onclose = () => {
      timerRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [coingeckoId, referencePrice]);

  useEffect(() => {
    conversionRateRef.current = null;
    connect();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const ws = wsRef.current;
      wsRef.current = null;

      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [connect]);

  return live;
}