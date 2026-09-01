import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-md animate-scale-in">{children}</div>
    </div>,
    document.body
  );
}

export function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className={cn("card-base shadow-2xl", className)}>
      {onClose && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-3 z-20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6 pb-2", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h2>;
}

export function DialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex items-center justify-end gap-2 p-6 pt-2", className)}>{children}</div>;
}
