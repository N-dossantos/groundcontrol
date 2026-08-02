import type { Metadata } from "next";
import { Poppins, Lato, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["800"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Ground Control 90 — Camisetas y conjuntos de fútbol",
    template: "%s | Ground Control 90",
  },
  description:
    "Camisetas y conjuntos de fútbol personalizados. Control en tu movimiento. Entrega en puntos de encuentro en Canning, Buenos Aires, y envíos a todo el país.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${lato.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gc-negro text-gc-blanco">
        {children}
      </body>
    </html>
  );
}
