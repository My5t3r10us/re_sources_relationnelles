import { ReactNode } from "react";

type BadgeVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "error"
  | "success"
  | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary-container/50 text-on-secondary-container",
  tertiary: "bg-tertiary/10 text-tertiary",
  error: "bg-error/10 text-error",
  success: "bg-tertiary/10 text-tertiary",
  outline: "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20",
};

export function Badge({
  variant = "primary",
  children,
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-2 h-2 rounded-full ${
            variant === "error"
              ? "bg-error"
              : variant === "tertiary" || variant === "success"
                ? "bg-tertiary"
                : variant === "secondary"
                  ? "bg-secondary"
                  : "bg-primary"
          }`}
        />
      )}
      {children}
    </span>
  );
}
