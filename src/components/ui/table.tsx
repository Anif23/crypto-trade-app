import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className={cn("w-full text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn("border-b border-border bg-secondary/40", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border/50 transition-colors",
        onClick && "cursor-pointer hover:bg-secondary/30",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className, align = "left" }: TableHeadProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th className={cn("px-3 sm:px-4 py-3 text-xs font-medium text-muted-foreground", alignClass, className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, align = "left" }: TableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <td className={cn("px-3 sm:px-4 py-3", alignClass, className)}>
      {children}
    </td>
  );
}
