import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

function Button({
  variant = 'primary',
  children,
  className,
  disabled,
  active = false,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  const variantClasses = {
    primary: {
      active: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 focus-visible:ring-primary',
      inactive: 'bg-muted text-foreground hover:bg-muted-foreground/10 active:bg-muted-foreground/20 focus-visible:ring-muted-foreground',
    },
    secondary: {
      active: 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/90 active:bg-secondary/95 focus-visible:ring-secondary',
      inactive: 'bg-muted text-foreground border border-border hover:bg-muted-foreground/10 active:bg-muted-foreground/20 focus-visible:ring-muted-foreground',
    },
    ghost: {
      active: 'bg-transparent text-foreground hover:bg-muted focus-visible:ring-ring active:bg-muted-foreground/10',
      inactive: 'bg-transparent text-muted-foreground hover:bg-muted focus-visible:ring-ring active:bg-muted-foreground/10',
    },
    disabled: 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={clsx(
        baseClasses,
        disabled
          ? variantClasses.disabled
          : active
            ? variantClasses[variant].active
            : variantClasses[variant].inactive,
        className
      )}
    >
      {children}
    </button>
  );
}

export { Button };
