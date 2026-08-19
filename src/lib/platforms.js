/**
 * Public tour platforms — where a product can be live.
 *
 * - Travio Africa  (travioafrica.com): the main catalog. Every ACTIVE tour is
 *   automatically live here.
 * - ExpeditionGo   (expeditiongotours.vercel.app): live whenever the tour is
 *   published on Expedition Go (`expeditionTour.isActive === true`), regardless
 *   of its booking flow (DIRECT or EXTERNAL).
 *
 * URL shapes:
 *   - https://travioafrica.com/tours/{slug}          (matches backend's own external links)
 *   - https://expeditiongotours.vercel.app/tour/{slug} (matches the ExpeditionGo router)
 */
import { Compass, Plane } from "lucide-react";
import { config } from "@/config";

// Env-backed with hard production fallbacks: a stale config module or a missing
// env value must never disable the preview link for a live tour.
const TRAVIO_AFRICA_URL = config.VITE_TRAVIO_AFRICA_URL || "https://travioafrica.com";
const EXPEDITION_GO_URL = config.VITE_EXPEDITION_GO_URL || "https://expeditiongotours.vercel.app";

export const TOUR_PLATFORMS = [
  {
    key: "travio_africa",
    name: "Travio Africa",
    domain: "travioafrica.com",
    baseUrl: TRAVIO_AFRICA_URL,
    icon: Compass,
    accent: "emerald",
    pathFor: (slug) => `/tours/${slug}`,
  },
  {
    key: "expedition_go",
    name: "ExpeditionGo",
    domain: "expeditiongotours.vercel.app",
    baseUrl: EXPEDITION_GO_URL,
    icon: Plane,
    accent: "sky",
    pathFor: (slug) => `/tour/${slug}`,
  },
];

export function platformUrl(platform, slug) {
  const base = platform?.baseUrl;
  if (!base || !/^https?:\/\//.test(base)) return null;
  const clean = base.replace(/\/$/, "");
  return `${clean}${platform.pathFor(encodeURIComponent(slug))}`;
}

/**
 * Determine which platform(s) a product is currently live on.
 *   - Travio Africa: every ACTIVE tour is automatically live there.
 *   - ExpeditionGo: shown whenever `expeditionTour.isActive === true`, regardless
 *     of booking flow (DIRECT or EXTERNAL).
 * @param {{ slug?: string, status?: string, expeditionTour?: { isActive?: boolean, bookingFlow?: string } }} product
 * @returns {{ platform: typeof TOUR_PLATFORMS[number], url: string }[]}
 */
export function getLivePlatforms(product) {
  const slug = product?.slug;
  if (!slug) return [];

  const status = product?.status;
  const exp = product?.expeditionTour || {};

  const [travio, expedition] = TOUR_PLATFORMS;

  const live = [];
  if (status === "ACTIVE") {
    const url = platformUrl(travio, slug);
    if (url) live.push({ platform: travio, url });
  }
  if (exp.isActive === true) {
    const url = platformUrl(expedition, slug);
    if (url) live.push({ platform: expedition, url });
  }
  return live;
}
