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

let usdInrRate = 83.5;

const toINR = (v: number) => v * usdInrRate;

export function useLivePrice(
  coingeckoId?: string
): LivePrice | null {
  const [live, setLive] = useState<LivePrice | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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

      const newPrice = {
        price: toINR(close),
        change: toINR(close - open),
        changePct: ((close - open) / open) * 100,
        high: toINR(Number(d.h)),
        low: toINR(Number(d.l)),
        volume: Number(d.v),
      };

      console.log('Live price update:', {
        symbol,
        priceINR: newPrice.price.toFixed(2),
        changePct: newPrice.changePct.toFixed(2) + '%'
      });

      setLive(newPrice);
    };

    ws.onclose = () => {
      timerRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [coingeckoId]);

  useEffect(() => {
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