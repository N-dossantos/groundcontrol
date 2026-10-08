import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getAppSettings } from "@/lib/settings";
import { WishlistInitializer } from "@/components/wishlist/WishlistInitializer";
import { CartSyncInitializer } from "@/components/cart/CartSyncInitializer";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getAppSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <WishlistInitializer />
      <CartSyncInitializer />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer
        whatsappNumero={settings.whatsapp_numero}
        puntoEncuentroDescripcion={settings.punto_encuentro_descripcion}
      />
    </div>
  );
}
