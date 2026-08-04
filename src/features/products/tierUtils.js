/**
 * Tier-range normalisation helpers.
 *
 * Group/vehicle pricing (GetYourGuide style) uses contiguous participant bands.
 * The base (Tier 1) band is always `1 to N` — by convention a single-person
 * group (`1 to 1`) — and every following band starts at `previous.to + 1`.
 *
 * Tiers saved by older clients (or edited in divergent states) can come back
 * overlapping, gapped, or with `to` values beyond `maxParticipants` (e.g.
 * `1 to 2 / 2 to 2 / 3 to 100`). `normalizeCategoryTiers` repairs that load
 * data to a canonical, contiguous shape while leaving intentionally-edited,
 * already-contiguous tiers untouched.
 */

const DEFAULT_MAX = 10

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

/**
 * Returns a *canonical* copy of a category's tier list.
 *
 *  - If every tier already satisfies the contiguity rules
 *    (`tier0.from === 1`, each `tier.from === prev.to + 1`,
 *    each `tier.to >= tier.from`, final band's `to === maxParticipants`),
 *    the tiers are returned unchanged (shallow-copied) so deliberate user
 *    edits — e.g. widening Tier 1 to `1 to 3` — survive a reload.
 *  - Otherwise the divergent list is rewritten to the `addCategoryTier`
 *    shape: `1 to 1`, `2 to 2`, …, `N to maxParticipants`, preserving each
 *    tier's `pricePerPerson` and `id` by position.
 *
 * @param {Array<{from?:number,to?:number,pricePerPerson?:number,id?:string}>} tiers
 * @param {number} maxParticipants
 * @returns {Array}
 */
export function normalizeCategoryTiers(tiers, maxParticipants) {
  if (!Array.isArray(tiers) || tiers.length === 0) return []

  const mp = toNum(maxParticipants) >= 1 ? toNum(maxParticipants) : DEFAULT_MAX

  const isContiguous = tiers.every((t, i, arr) => {
    const from = toNum(t && t.from)
    const to = toNum(t && t.to)
    if (!Number.isFinite(from) || !Number.isFinite(to)) return false
    if (to < from) return false
    if (i === 0 && from !== 1) return false
    if (i > 0 && from !== toNum(arr[i - 1].to) + 1) return false
    if (i === arr.length - 1 && to !== mp) return false
    return true
  })

  // Already valid — preserve the user's exact bands.
  if (isContiguous) return tiers.map((t) => ({ ...t }))

  // Divergent / overlapping / gapped legacy data → canonicalise.
  return tiers.map((t, i) => ({
    ...t,
    from: i + 1,
    to: i === tiers.length - 1 ? mp : i + 1,
  }))
}

/**
 * Normalises the tier ranges of every pricing category in a list, preserving
 * per-category metadata (name, age ranges, etc.).
 *
 * @param {Array<{tiers?:Array}>} categories
 * @param {number} maxParticipants
 * @returns {Array}
 */
export function normalizePricingCategories(categories, maxParticipants) {
  if (!Array.isArray(categories)) return []
  return categories.map((c) => ({
    ...c,
    tiers: normalizeCategoryTiers(c && c.tiers, maxParticipants),
  }))
}
