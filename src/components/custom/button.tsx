import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

type VariantState = {
  active: string;
  inactive: string;
};

function Button({
  variant = "primary",
  size = "default",
  children,
  className,
  disabled,
  active = false,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-9 w-9",
  };

  const variantClasses: Record<string, VariantState> = {
    primary: {
      active:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
      inactive:
        "bg-muted text-foreground hover:bg-muted-foreground/10 active:bg-muted-foreground/20",
    },
    secondary: {
      active:
        "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/90",
      inactive:
        "bg-muted text-foreground border border-border hover:bg-muted-foreground/10",
    },
    ghost: {
      active: "bg-transparent text-foreground hover:bg-muted",
      inactive: "bg-transparent text-muted-foreground hover:bg-muted",
    },
    outline: {
      active: "border border-input bg-background hover:bg-accent",
      inactive: "border border-input bg-background hover:bg-accent",
    },
    destructive: {
      active:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive",
      inactive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive",
    },
  };

  const disabledClasses =
    "bg-muted text-muted-foreground opacity-50 cursor-not-allowed";

  const currentVariant =
    variantClasses[variant] || variantClasses.primary;

  return (
    <button
      {...props}
      disabled={disabled}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        disabled
          ? disabledClasses
          : active
          ? currentVariant.active
          : currentVariant.inactive,
        className
      )}
    >
      {children}
    </button>
  );
}

export { Button };
