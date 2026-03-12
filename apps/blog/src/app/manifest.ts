import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AaaS Knowledge Index",
    short_name: "AaaS Index",
    description:
      "Schema-first knowledge index of AI tools, models, agents, skills, and benchmarks.",
    start_url: "/",
    display: "standalone",
    theme_color: "#080809",
    background_color: "#080809",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
