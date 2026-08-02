import { clsx } from "clsx";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "dorado" | "danger" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-gc-blanco text-gc-negro hover:opacity-90",
  secondary:
    "border border-gc-blanco/30 text-gc-blanco hover:border-gc-blanco bg-transparent",
  dorado: "bg-gc-dorado text-gc-negro hover:opacity-90",
  danger: "bg-red-600 text-gc-blanco hover:bg-red-500",
  ghost: "bg-transparent text-gc-blanco/80 hover:text-gc-blanco",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-headline text-sm font-extrabold uppercase tracking-wide transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
          VARIANT_CLASSES[variant],
          className
        )}
        {...props}
      >
        {isLoading ? "..." : children}
      </button>
    );
  }
);
Button.displayName = "Button";
