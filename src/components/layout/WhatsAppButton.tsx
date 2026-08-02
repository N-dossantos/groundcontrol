type WhatsAppButtonProps = {
  numero: string;
  mensaje?: string;
  className?: string;
  children: React.ReactNode;
};

export function buildWhatsAppLink(numero: string, mensaje?: string) {
  const digits = numero.replace(/[^0-9]/g, "");
  const base = `https://wa.me/${digits}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export function WhatsAppButton({
  numero,
  mensaje,
  className,
  children,
}: WhatsAppButtonProps) {
  return (
    <a
      href={buildWhatsAppLink(numero, mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
