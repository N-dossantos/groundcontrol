import { clsx } from "clsx";
import { forwardRef } from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  padding?: "none" | "sm" | "md";
};

const PADDING_CLASSES: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-4 sm:p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, padding = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-lg border border-gc-carbon bg-gc-carbon/20",
          hover && "transition-colors hover:border-gc-blanco/30",
          PADDING_CLASSES[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
