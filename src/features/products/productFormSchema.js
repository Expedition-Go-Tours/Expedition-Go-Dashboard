import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(200),
  address: z.string().max(300).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  timeSpent: z.number().nullable().optional(),
  timeSpentUnit: z.enum(['minutes', 'hours']).optional(),
  admissionIncluded: z.enum(['yes', 'no', 'na']).optional(),
})

export const locationPointSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  lat: z.number(),
  lng: z.number(),
})

export const productOptionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Option title is required'),
  refCode: z.string().optional(),
  description: z.string().optional(),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  isPrivate: z.boolean(),
  skipTheLine: z.enum([
    'none',
    'skip_tickets',
    'separate_entrance',
    'express_security',
    'express_elevators',
  ]),
  wheelchairAccessible: z.boolean(),
  audioGuide: z.boolean().optional(),
  infoBooklet: z.boolean().optional(),
  maxGroupSize: z.number().nullable().optional(),
  duration: z.number().nullable(),
  durationUnit: z.enum(['minutes', 'hours', 'days']).nullable(),
  validityEnabled: z.boolean().optional(),
  validityType: z.enum(['date_picked', 'from_activation', 'period']).optional(),
  validity: z.number().nullable(),
  validityUnit: z.enum(['days', 'weeks', 'months']).nullable(),
  validityStartDate: z.string().optional(),
  validityEndDate: z.string().optional(),
})

export const attractionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Attraction name is required'),
  location: z.string().optional(),
  description: z.string().optional(),
  timeSpent: z.number().nullable(),
  timeSpentUnit: z.enum(['minutes', 'hours']),
  admissionIncluded: z.enum(['yes', 'no', 'na']),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
})

export const itineraryEntrySchema = z.object({
  day: z.number().min(1, 'Day number must be 1 or greater'),
  time: z.string().min(1, 'Start time is required'),
  type: z.enum(['activity', 'transfer']),
  locationName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationLat: z.number().nullable().optional(),
  locationLng: z.number().nullable().optional(),
  isCustomLocation: z.boolean().optional(),
  duration: z.number().min(0, 'Duration is required'),
  durationUnit: z.enum(['minute', 'hour', 'day']),
  title: z.string().optional(),
  description: z.string().max(2000).optional(),
  isOptional: z.boolean().optional(),
  additionalFee: z.boolean().optional(),
})

export const stepSchemas = {
   1: z.object({
     language: z.string().min(1, 'Select a language'),
   }),
  2: z.object({
      title: z.string().min(1, 'Title is required'),
      referenceCode: z.string().optional(),
    }),
    3: z.object({
      category: z.enum(['tour', 'activity', 'transport'], { errorMap: () => ({ message: 'Select a product type' }) }),
      activitiesIncluded: z.array(z.string()).optional(),
      transportModes: z.array(z.string()).optional(),
      transportServices: z.array(z.string()).optional(),
      difficulty: z.string().min(1, 'Select a difficulty level'),
      duration: z.number({ invalid_type_error: 'Duration is required' }).min(0.5, 'Duration must be at least 0.5').nullable().optional(),
      durationUnit: z.enum(['minutes', 'hours', 'days']).optional(),
    }),
  4: z.object({
    shortDescription: z
      .string()
      .min(10, 'Short description must be at least 10 characters')
      .max(200, 'Short description must be at most 200 characters'),
    fullDescription: z
      .string()
      .min(500, 'Full description must be at least 500 characters')
      .max(3000, 'Full description must be at most 3000 characters'),
    highlights: z
      .array(z.string().min(1).max(80, 'Each highlight must be 80 characters or fewer'))
      .min(3, 'Add at least 3 highlights')
      .max(5, 'Maximum 5 highlights'),
  }),
  5: z.object({
    locations: z
      .array(locationSchema)
      .min(1, 'Add at least one location'),
  }),
  6: z.object({
    keywords: z.array(z.string()).max(15, 'Maximum 15 keywords'),
  }),
  7: z.object({
    whatsIncluded: z.array(z.string()).optional(),
    whatsNotIncluded: z.array(z.string()).optional(),
    activitiesIncluded: z.array(z.string()).optional(),
    foodProvided: z.boolean(),
    meals: z.array(z.object({
      type: z.string().optional(),
      format: z.string().optional(),
    })).optional(),
    drinksIncluded: z.boolean().optional(),
    showDietaryRestrictions: z.boolean().optional(),
    dietaryOptions: z.array(z.string()).optional(),
  }),
  8: z.object({
    transportationProvided: z.boolean(),
    pickupTransportTypes: z.array(z.string()).optional(),
    crossCityTravel: z.boolean().optional(),
  }),
  9: z.object({
    guideType: z.enum(['tour-guide', 'driver', 'host', 'greeter', 'self-guided', 'instructor']),
    guideMaterials: z.object({
      audioGuide: z.boolean(),
      infoBooklet: z.boolean(),
    }),
  }),
  10: z.object({
    notSuitableFor: z.array(z.string()).optional(),
    notAllowed: z.array(z.string()).optional(),
    petFriendly: z.boolean().optional(),
    mandatoryItems: z.array(z.string()).optional(),
    knowBeforeYouGo: z.string().max(2000).optional(),
    emergencyCountryCode: z.string().max(5).optional(),
    emergencyPhone: z.string().max(20).optional(),
    voucherInfo: z.string().max(500).optional(),
  }),
  11: z.object({
    photos: z
      .array(z.object({ id: z.string(), url: z.string() }))
      .min(4, 'Upload at least 4 photos'),
    copyrightConfirmed: z.literal(true, {
      message: 'You must confirm copyright ownership',
    }),
  }),
  12: z.object({
    options: z
      .array(productOptionSchema)
      .min(1, 'Add at least one option'),
  }),
  13: z.object({
    meetingMode: z.enum(['meeting_point', 'pickup', 'none']),
    meetingPoint: locationPointSchema.nullable().optional(),
    meetingPointPicture: z.string().optional(),
    meetingPointDescription: z.string().optional(),
    arrivalTimeType: z.enum(['none', '5min', '10min', '15min', '30min', 'notified', 'custom']).optional(),
    arrivalTimeCustom: z.string().optional(),
    pickupType: z.enum(['area', 'address']).optional(),
    pickupDescription: z.string().optional(),
    pickupTiming: z.enum(['at_start', 'before_start']).optional(),
    pickupFinalLocationTiming: z.enum(['day_before', 'after_selection']).optional(),
    referenceStartTime: z.string().optional(),
    pickupAreas: z.array(z.object({ name: z.string().min(1, 'Pickup area name is required'), time: z.string().min(1, 'Pickup time is required') })).optional(),
    pickupLocations: z.array(locationPointSchema).optional(),
    pickupGeoshape: z.any().nullable().optional(),
    planPickupTimes: z.boolean().optional(),
    pickupStartTime: z.string().optional(),
    dropoffOption: z.enum(['same_location', 'different_location', 'none', 'service']).optional(),
    dropoffLocation: locationPointSchema.nullable().optional(),
    dropoffDescription: z.string().optional(),
  }),
   14: z.object({
    pricingModel: z.enum(['perPerson', 'perGroup'], {
      errorMap: () => ({ message: 'Select a pricing model' }),
    }),
    currency: z.string().min(1, 'Select a currency'),
    scheduleType: z.enum(['fixedTimeSlot', 'operatingHours']),
    schedules: z.array(z.any()).min(1, 'Add at least one schedule'),
  }).superRefine((data, ctx) => {
    if (data.pricingModel === 'perPerson') {
      if (data.pricingApproach === 'sameForEveryone') {
        if (data.uniformPrice == null || data.uniformPrice <= 0) {
          ctx.addIssue({ code: 'custom', path: ['uniformPrice'], message: 'Enter a price per person' })
        }
      }
      if (data.pricingApproach === 'dependsOnAge') {
        const cats = data.pricingCategories
        if (!cats || cats.length === 0) {
          ctx.addIssue({ code: 'custom', path: ['pricingCategories'], message: 'Add at least one pricing category' })
        }
        if (Array.isArray(cats)) {
          cats.forEach((g, i) => {
            if (g.maxAge <= g.minAge) {
              ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.maxAge`], message: 'Max age must be greater than min age' })
            }
            if (Array.isArray(g.tiers) && g.tiers.length > 0) {
              g.tiers.forEach((tier, ti) => {
                if (tier.from === null || tier.to === null || tier.pricePerPerson === null) return
                if (tier.to < tier.from) {
                  ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.tiers.${ti}.to`], message: 'Max must be greater than or equal to min' })
                }
              })
            }
          })
        }
      }
    }
    if (data.pricingModel === 'perGroup') {
      if (!Array.isArray(data.groupSizes) || data.groupSizes.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['groupSizes'], message: 'Add at least one group size' })
      }
    }
    if (data.scheduleType === 'fixedTimeSlot') {
      if (!Array.isArray(data.timeSlots) || data.timeSlots.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['timeSlots'], message: 'Add at least one time slot' })
      }
    }
  }),
  15: z.object({
    cutoffMinutes: z.number().min(1, 'Select a cut-off time'),
    lastMinuteBookings: z.boolean().optional(),
    perSlotCutoff: z.boolean().optional(),
  }),
  16: z.object({
    itinerary: z
      .array(itineraryEntrySchema)
      .min(1, 'Add at least one itinerary entry'),
  }),
}
