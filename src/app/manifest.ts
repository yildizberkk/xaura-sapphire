import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sapphire Momentum II",
    short_name: "Sapphire II",
    description: "24-26 Nisan | Kremlin Palace, Antalya",
    start_url: "/",
    display: "standalone",
    background_color: "#030d5f",
    theme_color: "#030d5f",
    icons: [
      { src: "/logos/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/logos/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
