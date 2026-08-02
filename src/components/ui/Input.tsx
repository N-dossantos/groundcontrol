import { clsx } from "clsx";
import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <input
        ref={ref}
        id={id}
        className={clsx(
          "w-full rounded-md border bg-gc-carbon px-4 py-3 text-sm text-gc-blanco placeholder:text-gc-blanco/40 focus:outline-none focus:ring-1",
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gc-blanco/15 focus:border-gc-dorado focus:ring-gc-dorado",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gc-blanco/70"
    >
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}
