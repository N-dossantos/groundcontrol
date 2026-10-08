import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-lg border border-gc-carbon bg-gc-carbon/10 px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gc-carbon text-gc-blanco/40">
          <Icon size={22} />
        </div>
      )}
      <h2 className="font-headline text-lg font-extrabold uppercase tracking-wide">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-gc-blanco/60">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
