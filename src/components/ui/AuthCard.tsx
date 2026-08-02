export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-8 text-center font-headline text-2xl font-extrabold uppercase tracking-wide">
        {title}
      </h1>
      <div className="rounded-lg border border-gc-carbon bg-gc-carbon/30 p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
