import { listMyProducts } from "@/features/products/api";

const PUBLISHED_STATUSES = ["ACTIVE", "PAUSED"];
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

// Option keys are matched contract-symbolically against the customer's
// checkout `tourOptionKey`: the slugified schedule name. Both sides must use
// the same transformation, so keep this in sync with the booking engine.
export function optionKeyFor(name) {
  const key = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return key || "option";
}

export function parseBlob(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value || null;
}

export function scheduleOptions(tour) {
  const blob = parseBlob(tour?.schedulesAndPricing);
  const schedules = blob?.pricingSchedules?.schedules;
  if (!Array.isArray(schedules) || schedules.length <= 1) return [];
  return schedules.map((s, i) => ({
    key: optionKeyFor(s?.name || `Option ${i + 1}`),
    label: s?.name || `Option ${i + 1}`,
  }));
}

export function startPriceOf(tour) {
  const blob = parseBlob(tour?.schedulesAndPricing);
  const price = blob?.pricingSchedules?.schedules?.[0]?.prices?.[0]?.retailPrice;
  return price ? Number(price) : null;
}

// Loads every page of the supplier's own product catalogue, keeping only
// published products (draft/rejected products can't receive offers).
export async function fetchPublishedCatalogue() {
  const collected = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await listMyProducts({ page, limit: PAGE_SIZE });
    const data = res.data?.data;
    const batch = data?.tours || [];
    collected.push(...batch);
    const pagination = data?.pagination;
    if (!pagination || page >= pagination.totalPages) break;
  }
  return collected.filter((tour) => PUBLISHED_STATUSES.includes(tour.status));
}