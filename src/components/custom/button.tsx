import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

function Button({
  variant = 'primary',
  size = 'default',
  children,
  className,
  disabled,
  active = false,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-9 w-9',
  };

  const variantClasses = {
    primary: {
      active: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 focus-visible:ring-primary',
      inactive: 'bg-muted text-foreground hover:bg-muted-foreground/10 active:bg-muted-foreground/20 focus-visible:ring-muted-foreground',
    },
    destructive: {
      active: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive',
      inactive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive',
    },
    secondary: {
      active: 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/90 active:bg-secondary/95 focus-visible:ring-secondary',
      inactive: 'bg-muted text-foreground border border-border hover:bg-muted-foreground/10 active:bg-muted-foreground/20 focus-visible:ring-muted-foreground',
    },
    ghost: {
      active: 'bg-transparent text-foreground hover:bg-muted focus-visible:ring-ring active:bg-muted-foreground/10',
      inactive: 'bg-transparent text-muted-foreground hover:bg-muted focus-visible:ring-ring active:bg-muted-foreground/10',
    },
    outline: { // Added outline variant as it was used in viewer
      active: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      inactive: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    },
    disabled: 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
  };

  const currentVariant = variantClasses[variant] || variantClasses.primary;

  return (
    <button
      {...props}
      disabled={disabled}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        disabled
          ? variantClasses.disabled
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
