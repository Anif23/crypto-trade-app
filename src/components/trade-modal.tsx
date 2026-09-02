import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoinIcon } from "@/components/coin-icon";
import { useTrade } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, formatUSD, formatQuantity } from "@/lib/utils";
import type { CryptoAsset } from "@/types";

type Side = "BUY" | "SELL";

export function TradeModal({
  open,
  onOpenChange,
  asset,
  side,
  ownedQuantity = 0,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: CryptoAsset | null;
  side: Side;
  ownedQuantity?: number;
}) {
  const [qty, setQty] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const trade = useTrade();
  const { profile } = useAuth();

  useEffect(() => {
    if (open) {
      setQty("");
      setConfirmOpen(false);
    }
  }, [open]);

  if (!asset) return null;

  const price = asset.current_price;
  const quantity = parseFloat(qty) || 0;
  const total = quantity * price;
  const cash = profile?.virtual_cash_balance ?? 0;

  const maxBuy = price > 0 ? cash / price : 0;
  const maxSell = ownedQuantity;

  const canSubmit =
    quantity > 0 &&
    (side === "BUY" ? total <= cash : quantity <= ownedQuantity) &&
    !trade.isPending;

  const submit = () => {
    trade.mutate(
      { assetId: asset.id, side, quantity },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onOpenChange(false);
        },
      }
    );
  };

  const errMsg =
    quantity > 0 && side === "BUY" && total > cash
      ? "Exceeds your available virtual cash."
      : quantity > 0 && side === "SELL" && quantity > ownedQuantity
      ? `You only own ${formatQuantity(ownedQuantity)} ${asset.symbol}.`
      : null;

  return (
    <>
      <Dialog open={open && !confirmOpen} onOpenChange={(v) => { onOpenChange(v); }}>
        <DialogContent onClose={() => onOpenChange(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <CoinIcon src={asset.image_url} symbol={asset.symbol} size={36} />
              <div>
                <DialogTitle className="flex items-center gap-2">
                  {side === "BUY" ? "Buy" : "Sell"} {asset.name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <span className="font-mono uppercase">{asset.symbol}</span>
                  <span>·</span>
                  <span>{formatPrice(price)}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 pb-2">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
              <span className="font-semibold text-warning">Paper Trading · </span>
              Virtual funds only. This is an educational simulation — no real money is involved.
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Quantity ({asset.symbol})</label>
                <button
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setQty(String((side === "BUY" ? maxBuy : maxSell).toFixed(6)))}
                >
                  Max {formatQuantity(side === "BUY" ? maxBuy : maxSell)}
                </button>
              </div>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm">
              <Row label="Price" value={formatPrice(price)} />
              <Row
                label={side === "BUY" ? "Estimated cost" : "Estimated proceeds"}
                value={formatUSD(total)}
                strong
              />
              <Row
                label="Available cash"
                value={formatUSD(cash)}
              />
              {side === "SELL" && (
                <Row label={`Owned ${asset.symbol}`} value={formatQuantity(ownedQuantity)} />
              )}
            </div>

            {errMsg && <p className="text-sm text-destructive">{errMsg}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={trade.isPending}>
              Cancel
            </Button>
            <Button
              variant={side === "BUY" ? "success" : "destructive"}
              onClick={() => setConfirmOpen(true)}
              disabled={!canSubmit}
            >
              Review {side === "BUY" ? "Buy" : "Sell"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClose={() => setConfirmOpen(false)}>
          <DialogHeader>
            <DialogTitle>Confirm {side === "BUY" ? "purchase" : "sale"}</DialogTitle>
            <DialogDescription>
              This paper trade will execute immediately at the current market price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-6 pb-2">
            <div className="rounded-lg bg-secondary/50 p-4 text-sm">
              <Row label="Coin" value={`${asset.name} (${asset.symbol})`} />
              <Row label="Side" value={side} />
              <Row label="Quantity" value={`${formatQuantity(quantity)} ${asset.symbol}`} />
              <Row label="Price" value={formatPrice(price)} />
              <Row
                label={side === "BUY" ? "Total cost" : "Total proceeds"}
                value={formatUSD(total)}
                strong
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={trade.isPending}>
              Back
            </Button>
            <Button
              variant={side === "BUY" ? "success" : "destructive"}
              onClick={submit}
              disabled={trade.isPending}
            >
              {trade.isPending ? "Processing…" : `Confirm ${side === "BUY" ? "Buy" : "Sell"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold tabular" : "tabular"}>{value}</span>
    </div>
  );
}
