import { buildPayload } from '../useAutoSave'

describe('buildPayload nested -> flat mapping', () => {
  it('maps nested categorization to flat keys', () => {
    const state = {
      title: 'Test',
      categorization: { category: 'transport', difficulty: 'hard', duration: { value: 4, unit: 'hours' } },
      productContent: { writingLanguage: 'Bislama' },
      schedulesAndPricing: { availability: { weeklySchedule: { Monday: [{ startTime: '09:00', endTime: '10:00' }] }, timeSlots: [] }, travelerDetails: { pricingCategories: [{ name: 'Adult', price: 100 }], pricingModel: 'perPerson' }, pricingSchedules: { currency: 'USD', schedules: [] } },
      photos: [],
      options: [],
      fullDescription: 'desc',
    }

    const payload = buildPayload(state)
    expect(payload.category).toBe('transport')
    expect(payload.difficulty).toBe('hard')
    expect(payload.duration).toBe(4)
    expect(payload.durationUnit).toBe('hours')
    expect(payload.language).toBe('Bislama')
    expect(payload.pricingCategories).toEqual([{ name: 'Adult', price: 100 }])
  })
})
