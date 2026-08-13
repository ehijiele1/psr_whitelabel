import type { MetadataRoute } from "next"
import { brand } from "@/lib/config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: brand.description,
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: brand.themeColor,
    orientation: "portrait-primary",
    categories: ["business", "productivity"],
    lang: brand.locale,
    icons: [
      {
        src: "/icons/icon-72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Record Payment",
        url: "/dashboard/payments?action=new",
        icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
      },
      {
        name: "View Tenants",
        url: "/dashboard/tenants",
        icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
      },
    ],
  }
}
