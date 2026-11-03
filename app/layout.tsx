import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Inter_Tight } from "next/font/google";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { CartProvider } from "@/components/providers/CartProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import Loader from "@/components/layout/Loader";
import FloatingActions from "@/components/layout/FloatingActions";
import OfferMarquee from "@/components/ui/OfferMarquee";
import { SITE_URL } from "@/lib/config";
import { getSettings } from "@/lib/api";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const cormorant = Cormorant_Garamond({ variable: "--font-serif", subsets: ["latin"], weight: ["500"], style: ["italic"] });

const DESCRIPTION =
  "Mirasha is a premium Ayurvedic and modern wellness range: Shilajit resin and gummies, multivitamin and magnesium gummies, collagen, vitamin B12, apple cider vinegar tablets, rosemary oil and combos. Delivered across India.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Mirasha — The Art of Inner Harmony", template: "%s — Mirasha" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Mirasha",
    url: SITE_URL,
    title: "Mirasha — The Art of Inner Harmony",
    description: DESCRIPTION,
    images: ["/products/shilajit-resin.jpg"],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${interTight.variable} ${cormorant.variable} antialiased`}>
      {/* suppressHydrationWarning: browser extensions inject attributes before React loads */}
      <body className="min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <SmoothScroll>
              <Header shopifyUrl={settings.shopifyUrl} marquee={<OfferMarquee />} />
              <main>{children}</main>
              <Footer />
              <CartDrawer />
              <FloatingActions whatsappNumber={settings.whatsappNumber} whatsappMessage={settings.whatsappMessage} />
              <Loader />
            </SmoothScroll>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
