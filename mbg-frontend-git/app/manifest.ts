import type { MetadataRoute } from "next";

const siteUrl = "https://mbg.kuningankab.go.id";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Makan Bergizi Gratis - Kabupaten Kuningan",
    short_name: "MBG Kuningan",
    description: "Pantau distribusi Program Makan Bergizi Gratis real-time dari SPPG dan sekolah di Kabupaten Kuningan.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ea580c",
    orientation: "portrait",
    lang: "id",
    dir: "ltr",
    categories: ["government", "food", "health", "education"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo-kuningan.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo-kuningan.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo-kuningan.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo-kuningan.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/images/logo-kuningan.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    screenshots: [
      {
        src: "/images/logo-kuningan.png",
        sizes: "1280x720",
        type: "image/png",
        label: "MBG Kuningan - Tampilan Utama",
      },
    ],
    related_applications: [
      {
        platform: "play",
        url: "https://play.google.com/store/apps/details?id=com.mbg.kuningan",
        id: "com.mbg.kuningan",
      },
    ],
  };
}
