/**
 * Public tour platforms — where a product can be live.
 *
 * - Travio Africa  (travioafrica.com): the main catalog. A tour is live here when
 *   its `status === "ACTIVE"` OR the ExpeditionGo listing is an EXTERNAL redirect
 *   (in which case the ExpeditionGo page points to the Travio Africa page).
 * - ExpeditionGo   (expeditiongotours.vercel.app): controlled separately via the
 *   `ExpeditionTour` record. A tour is live here when `expeditionTour.isActive === true`
 *   with a DIRECT booking flow.
 *
 * URL shapes:
 *   - https://travioafrica.com/tours/{slug}          (matches backend's own external links)
 *   - https://expeditiongotours.vercel.app/tour/{slug} (matches the ExpeditionGo router)
 */
import { Compass, Plane } from "lucide-react";
import { config } from "@/config";

export const TOUR_PLATFORMS = [
  {
    key: "travio_africa",
    name: "Travio Africa",
    domain: "travioafrica.com",
    baseUrl: config.VITE_TRAVIO_AFRICA_URL,
    icon: Compass,
    accent: "emerald",
    pathFor: (slug) => `/tours/${slug}`,
  },
  {
    key: "expedition_go",
    name: "ExpeditionGo",
    domain: "expeditiongotours.vercel.app",
    baseUrl: config.VITE_EXPEDITION_GO_URL,
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
 * Flow-aware:
 *   - Travio Africa: `status === "ACTIVE"`, or an ACTIVE ExpeditionGo listing with
 *     an EXTERNAL booking flow (that listing redirects to the Travio Africa page).
 *   - ExpeditionGo: ACTIVE ExpeditionGo listing with a DIRECT booking flow.
 * @param {{ slug?: string, status?: string, expeditionTour?: { isActive?: boolean, bookingFlow?: string } }} product
 * @returns {{ platform: typeof TOUR_PLATFORMS[number], url: string }[]}
 */
export function getLivePlatforms(product) {
  const slug = product?.slug;
  if (!slug) return [];

  const status = product?.status;
  const exp = product?.expeditionTour || {};
  const onExpedition = exp.isActive === true;
  const isExternal = exp.bookingFlow === "EXTERNAL";

  const [travio, expedition] = TOUR_PLATFORMS;

  const live = [];
  const onTravio = status === "ACTIVE" || (onExpedition && isExternal);
  const onExpeditionDirect = onExpedition && !isExternal;

  if (onTravio) {
    const url = platformUrl(travio, slug);
    if (url) live.push({ platform: travio, url });
  }
  if (onExpeditionDirect) {
    const url = platformUrl(expedition, slug);
    if (url) live.push({ platform: expedition, url });
  }
  return live;
}
