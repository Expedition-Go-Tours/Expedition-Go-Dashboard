import { describe, it, expect } from 'vitest'
import { normalizeCategoryTiers, normalizePricingCategories } from '../tierUtils'

describe('normalizeCategoryTiers', () => {
  const mp = 10

  it('returns [] for empty/undefined input', () => {
    expect(normalizeCategoryTiers([], mp)).toEqual([])
    expect(normalizeCategoryTiers(undefined, mp)).toEqual([])
    expect(normalizeCategoryTiers(null, mp)).toEqual([])
  })

  it('fixes the reported divergent overlap (1-2 / 2-2 / 3-10) -> 1-1 / 2-2 / 3-10', () => {
    const input = [
      { from: 1, to: 2, pricePerPerson: 100 },
      { from: 2, to: 2, pricePerPerson: 90 },
      { from: 3, to: 10, pricePerPerson: 80 },
    ]
    const out = normalizeCategoryTiers(input, mp)
    expect(out.map((t) => `${t.from}-${t.to}`)).toEqual(['1-1', '2-2', '3-10'])
    // prices preserved by position
    expect(out.map((t) => t.pricePerPerson)).toEqual([100, 90, 80])
  })

  it('canonicalises an overlapping two-tier (1-2 / 2-10) -> 1-1 / 2-10', () => {
    const input = [
      { from: 1, to: 2, pricePerPerson: 100 },
      { from: 2, to: 10, pricePerPerson: 80 },
    ]
    const out = normalizeCategoryTiers(input, mp)
    expect(out.map((t) => `${t.from}-${t.to}`)).toEqual(['1-1', '2-10'])
  })

  it('preserves a contiguous, editable Tier 1 band (1-2 / 3-10) when there is no overlap', () => {
    const input = [
      { from: 1, to: 2, pricePerPerson: 100 },
      { from: 3, to: 10, pricePerPerson: 80 },
    ]
    const out = normalizeCategoryTiers(input, mp)
    expect(out.map((t) => `${t.from}-${t.to}`)).toEqual(['1-2', '3-10'])
    expect(out[0]).not.toBe(input[0]) // shallow-copied, not mutated
  })

  it('clamps a garbage upper bound (3-100) to maxParticipants', () => {
    const input = [
      { from: 1, to: 1, pricePerPerson: 100 },
      { from: 2, to: 100, pricePerPerson: 90 },
    ]
    const out = normalizeCategoryTiers(input, mp)
    expect(out[1].to).toBe(10)
  })

  it('fixes a `from` that does not start at 1 (e.g. 5-6 / 7-10)', () => {
    const input = [
      { from: 5, to: 6, pricePerPerson: 100 },
      { from: 7, to: 10, pricePerPerson: 80 },
    ]
    const out = normalizeCategoryTiers(input, mp)
    expect(out.map((t) => `${t.from}-${t.to}`)).toEqual(['1-1', '2-10'])
  })

  it('preserves a contiguous, intentionally-widened Tier 1 (1-3 / 4-10)', () => {
    const input = [
      { from: 1, to: 3, pricePerPerson: 100 },
      { from: 4, to: 10, pricePerPerson: 80 },
    ]
    const out = normalizeCategoryTiers(input, mp)
    expect(out.map((t) => `${t.from}-${t.to}`)).toEqual(['1-3', '4-10'])
    expect(out).not.toBe(input) // shallow-copied, not mutated
  })

  it('preserves ids and pricePerPerson through canonicalisation', () => {
    const input = [
      { id: 'a', from: 1, to: 2, pricePerPerson: 100 },
      { id: 'b', from: 2, to: 2, pricePerPerson: 90 },
      { id: 'c', from: 3, to: 10, pricePerPerson: 80 },
    ]
    const out = normalizeCategoryTiers(input, mp)
    expect(out.map((t) => t.id)).toEqual(['a', 'b', 'c'])
    expect(out.map((t) => t.pricePerPerson)).toEqual([100, 90, 80])
  })

  it('defaults maxParticipants to 10 and canonicalises divergent data when missing', () => {
    const input = [
      { from: 1, to: 2, pricePerPerson: 100 },
      { from: 2, to: 2, pricePerPerson: 90 },
      { from: 3, to: 100, pricePerPerson: 80 },
    ]
    const out = normalizeCategoryTiers(input) // no maxParticipants -> defaults to 10
    expect(out.map((t) => `${t.from}-${t.to}`)).toEqual(['1-1', '2-2', '3-10'])
  })

  it('handles a single tier by setting its `to` to maxParticipants', () => {
    const input = [{ from: 1, to: 1, pricePerPerson: 100 }]
    const out = normalizeCategoryTiers(input, mp)
    expect(out).toEqual([{ from: 1, to: 10, pricePerPerson: 100 }])
  })
})

describe('normalizePricingCategories', () => {
  it('normalises every category independently without touching metadata', () => {
    const cats = [
      { name: 'Adult', minAge: 18, maxAge: 99, tiers: [{ from: 1, to: 2, pricePerPerson: 100 }, { from: 2, to: 2, pricePerPerson: 90 }, { from: 3, to: 10, pricePerPerson: 80 }] },
      { name: 'Child', minAge: 0, maxAge: 17, tiers: [{ from: 1, to: 1, pricePerPerson: 60 }, { from: 2, to: 10, pricePerPerson: 50 }] },
    ]
    const out = normalizePricingCategories(cats, 10)
    expect(out[0].tiers.map((t) => `${t.from}-${t.to}`)).toEqual(['1-1', '2-2', '3-10'])
    expect(out[1].tiers.map((t) => `${t.from}-${t.to}`)).toEqual(['1-1', '2-10'])
    expect(out[0].name).toBe('Adult')
    expect(out[1].minAge).toBe(0)
    expect(out[0]).not.toBe(cats[0])
  })

  it('returns [] for non-array input', () => {
    expect(normalizePricingCategories(null, 10)).toEqual([])
    expect(normalizePricingCategories(undefined, 10)).toEqual([])
  })
})
