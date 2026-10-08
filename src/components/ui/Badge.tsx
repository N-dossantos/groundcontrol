import { clsx } from "clsx";

type BadgeVariant = "neutral" | "dorado" | "outline" | "success" | "danger";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-gc-negro/90 text-gc-blanco/70",
  dorado: "bg-gc-dorado text-gc-negro",
  outline: "border border-gc-carbon bg-gc-negro/90 text-gc-dorado backdrop-blur",
  success: "bg-green-500/15 text-green-400",
  danger: "bg-red-500/15 text-red-400",
};

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded px-2 py-1 text-xs font-bold uppercase tracking-wide",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
