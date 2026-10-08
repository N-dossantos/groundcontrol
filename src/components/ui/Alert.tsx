import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AlertVariant = "error" | "success" | "info";

const VARIANT_CONFIG: Record<AlertVariant, { icon: typeof AlertCircle; classes: string }> = {
  error: { icon: AlertCircle, classes: "border-red-500/30 bg-red-500/10 text-red-400" },
  success: { icon: CheckCircle2, classes: "border-green-500/30 bg-green-500/10 text-green-400" },
  info: { icon: Info, classes: "border-gc-blanco/15 bg-gc-carbon/40 text-gc-blanco/70" },
};

export function Alert({
  variant = "error",
  children,
  className,
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, classes } = VARIANT_CONFIG[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={clsx("flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm", classes, className)}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
