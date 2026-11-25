import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  compact?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground border-primary hover:bg-[oklch(var(--component-button-hover))] active:translate-y-px",
  secondary:
    "bg-card text-foreground border-border hover:border-primary hover:bg-secondary active:translate-y-px",
  ghost:
    "bg-transparent text-primary border-transparent hover:bg-secondary active:translate-y-px",
  danger:
    "bg-card text-red-800 border-red-300 hover:bg-red-50 hover:border-red-700 active:translate-y-px",
};

export function AppButton({
  children,
  className,
  variant = "primary",
  loading = false,
  compact = false,
  disabled,
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border px-5 text-center text-base font-bold transition-[background-color,border-color,transform,opacity] duration-150 disabled:pointer-events-none disabled:opacity-50",
        compact ? "min-h-11 px-4 text-sm" : "min-h-12",
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
