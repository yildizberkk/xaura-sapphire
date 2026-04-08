import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";

const gilroy = localFont({
  src: [
    { path: "../../public/fonts/Gilroy-Light.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/Gilroy-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Gilroy-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Gilroy-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Gilroy-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sapphire Momentum II",
  description: "24-26 Nisan | Kremlin Palace, Antalya",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#030d5f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={gilroy.variable}>
      <body className="font-gilroy antialiased bg-[#030d5f] text-cream overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
