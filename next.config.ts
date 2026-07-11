import type { NextConfig } from "next";

/**
 * Pour GitHub Pages en « project page » : URL = https://USER.github.io/NOM_DU_REPO/
 * Définir BASE_PATH=/NOM_DU_REPO au build (voir .github/workflows).
 * Pour un site racine (repo USERNAME.github.io), laisser BASE_PATH vide.
 */
const basePath = process.env.BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  /** Exposé au client pour les liens absolus (ex. QR en GitHub Pages). */
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
