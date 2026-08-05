import { z } from 'zod'

export const TITLE_MAX_CHARS = 60
export const REFERENCE_CODE_MAX_CHARS = 20
export const SHORT_DESCRIPTION_MAX_CHARS = 200
export const FULL_DESCRIPTION_MAX_CHARS = 3000
export const HIGHLIGHT_MAX_CHARS = 80
export const INCLUSION_ITEM_MAX_CHARS = 100
export const EXTRA_INFO_TAG_MAX_CHARS = 50
export const KNOW_BEFORE_YOU_GO_MAX_CHARS = 2000
export const VOUCHER_INFO_MAX_CHARS = 500

export function limitMessage(max) {
  return `You've reached the ${max} character limit.`
}

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(200),
  address: z.string().max(300).optional(),
  lat: z.coerce.number().min(-90).max(90).nullish(),
  lng: z.coerce.number().min(-180).max(180).nullish(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  timeSpent: z.number().nullable().optional(),
  timeSpentUnit: z.enum(['minutes', 'hours']).optional(),
  admissionIncluded: z.enum(['yes', 'no', 'na']).optional(),
  isDropoff: z.boolean().optional(),
  isPickup: z.boolean().optional(),
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

export const stepSchemas = {
   1: z.object({
     language: z.string().min(1, 'Select a language'),
   }),
  2: z.object({
      title: z.string().min(1, 'Title is required').max(TITLE_MAX_CHARS, `Title must be ${TITLE_MAX_CHARS} characters or fewer`),
      referenceCode: z.string().max(REFERENCE_CODE_MAX_CHARS, `Reference code must be ${REFERENCE_CODE_MAX_CHARS} characters or fewer`).optional(),
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
      .max(SHORT_DESCRIPTION_MAX_CHARS, 'Short description must be at most 200 characters'),
    fullDescription: z
      .string()
      .min(500, 'Full description must be at least 500 characters')
      .max(FULL_DESCRIPTION_MAX_CHARS, 'Full description must be at most 3000 characters'),
    highlights: z
      .array(z.string().min(1).max(HIGHLIGHT_MAX_CHARS, 'Each highlight must be 80 characters or fewer'))
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
    activitiesIncluded: z.array(z.string()).optional(),
  }),
   7: z.object({
    whatsIncluded: z.array(z.string().max(INCLUSION_ITEM_MAX_CHARS, `Each inclusion must be ${INCLUSION_ITEM_MAX_CHARS} characters or fewer`)).optional(),
    whatsNotIncluded: z.array(z.string().max(INCLUSION_ITEM_MAX_CHARS, `Each exclusion must be ${INCLUSION_ITEM_MAX_CHARS} characters or fewer`)).optional(),
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
    notSuitableFor: z.array(z.string().max(EXTRA_INFO_TAG_MAX_CHARS, `Each item must be ${EXTRA_INFO_TAG_MAX_CHARS} characters or fewer`)).optional(),
    notAllowed: z.array(z.string().max(EXTRA_INFO_TAG_MAX_CHARS, `Each item must be ${EXTRA_INFO_TAG_MAX_CHARS} characters or fewer`)).optional(),
    petFriendly: z.boolean().optional(),
    mandatoryItems: z.array(z.string().max(EXTRA_INFO_TAG_MAX_CHARS, `Each item must be ${EXTRA_INFO_TAG_MAX_CHARS} characters or fewer`)).optional(),
    knowBeforeYouGo: z.string().max(KNOW_BEFORE_YOU_GO_MAX_CHARS, `Know before you go must be ${KNOW_BEFORE_YOU_GO_MAX_CHARS} characters or fewer`).optional(),
    emergencyPhone: z.string()
      .refine((val) => !val || /^\+[1-9]\d{2,14}$/.test(val), 'Enter a complete phone number with country code')
      .optional(),
    voucherInfo: z.string().max(VOUCHER_INFO_MAX_CHARS, `Voucher info must be ${VOUCHER_INFO_MAX_CHARS} characters or fewer`).optional(),
  }),
  12: z.object({
    photos: z
      .array(z.object({ id: z.string(), url: z.string() }))
      .min(4, 'Upload at least 4 photos'),
    copyrightConfirmed: z.literal(true, {
      message: 'You must confirm copyright ownership',
    }),
  }),
  13: z.object({
    options: z
      .array(productOptionSchema)
      .min(1, 'Add at least one option'),
  }),
  14: z.object({
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
    pickupAreas: z.array(z.object({ name: z.string().min(1, 'Pickup area name is required'), time: z.string().min(1, 'Pickup time is required'), address: z.string().optional(), lat: z.number().nullable().optional(), lng: z.number().nullable().optional() })).optional(),
    pickupLocations: z.array(locationPointSchema).optional(),
    pickupGeoshape: z.any().nullable().optional(),
    planPickupTimes: z.boolean().optional(),
    pickupStartTime: z.string().optional(),
    dropoffOption: z.enum(['same_location', 'different_location', 'none', 'service']).optional(),
    dropoffLocation: locationPointSchema.nullable().optional(),
    dropoffDescription: z.string().optional(),
  }),
   15: z.object({}),
   16: z.object({
    pricingModel: z.enum(['perPerson', 'perGroup'], {
      errorMap: () => ({ message: 'Select a pricing model' }),
    }),
    currency: z.string().min(1, 'Select a currency'),
    scheduleType: z.enum(['fixedTimeSlot', 'operatingHours']),
    schedules: z.array(z.any()).min(1, 'Add at least one schedule'),
    pricingApproach: z.any().optional(),
    pricingCategories: z.any().optional(),
    uniformPrice: z.any().nullable().optional(),
    groupSizes: z.any().optional(),
    timeSlots: z.any().optional(),
    minParticipants: z.any().optional(),
    maxParticipants: z.any().optional(),
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
          const seen = []
          cats.forEach((g, i) => {
            if (g.maxAge <= g.minAge) {
              ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.maxAge`], message: 'Max age must be greater than min age' })
            }
            for (const existing of seen) {
              if (g.minAge <= existing.maxAge && existing.minAge <= g.maxAge) {
                ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.name`], message: `Age range overlaps with "${existing.name}" (${existing.minAge}-${existing.maxAge})` })
                break
              }
            }
            seen.push({ name: g.name, minAge: g.minAge, maxAge: g.maxAge })
            const isFree = g.ticketNotRequired === true
            if (g.price == null && !isFree) {
              ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.price`], message: 'Enter a price for this category' })
            } else if (typeof g.price === 'number' && g.price < 0) {
              ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.price`], message: 'Price must be 0 or greater' })
            }
            if (Array.isArray(g.tiers) && g.tiers.length > 0) {
              // Validate each tier
              g.tiers.forEach((tier, ti) => {
                // Base tier (Tier 1) must always have an explicit upper bound.
                // Its `from` is fixed at 1; `to` is editable, so require a value.
                if (ti === 0 && (tier.from == null || tier.to == null)) {
                  ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.tiers.${ti}.to`], message: 'Set the maximum group size for the first people group (e.g. 1)' })
                }
                if (tier.from === null || tier.to === null || tier.pricePerPerson === null) return
                
                // Tier range validation
                if (tier.to < tier.from) {
                  ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.tiers.${ti}.to`], message: 'Max must be greater than or equal to min' })
                }
                
                // First tier must start at 1 (GetYourGuide standard)
                if (ti === 0 && tier.from !== 1) {
                  ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.tiers.${ti}.from`], message: 'First tier must start at 1' })
                }
                
                // Subsequent tiers must be sequential (no gaps)
                if (ti > 0) {
                  const prevTier = g.tiers[ti - 1]
                  if (prevTier && prevTier.to !== null && tier.from !== prevTier.to + 1) {
                    ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.tiers.${ti}.from`], message: 'Tiers must be sequential without gaps' })
                  }
                }
              })
              
              // Check for missing tier prices
              const anyMissingTierPrice = g.tiers.some((tier) => tier.from !== null && tier.pricePerPerson == null)
              if (anyMissingTierPrice) {
                ctx.addIssue({ code: 'custom', path: [`pricingCategories.${i}.tiers`], message: 'Enter a price for each tier' })
              }
            }
          })
        }
      }
    }
    if (data.pricingModel === 'perGroup') {
      const sizes = data.groupSizes
      if (!sizes || sizes.length < 1) {
        ctx.addIssue({ code: 'custom', path: ['groupSizes'], message: 'Add at least one group size' })
      } else {
        sizes.forEach((gs, i) => {
          if (gs.price == null || gs.price <= 0) {
            ctx.addIssue({ code: 'custom', path: [`groupSizes.${i}.price`], message: 'Enter a price for this group size' })
          }
          if (gs.from > gs.to) {
            ctx.addIssue({ code: 'custom', path: [`groupSizes.${i}.to`], message: 'Max must be greater than or equal to min' })
          }
        })
        const sorted = [...sizes].sort((a, b) => a.from - b.from)
        if (sorted.length > 0 && sorted[0].from !== 1) {
          ctx.addIssue({ code: 'custom', path: [`groupSizes.${sizes.indexOf(sorted[0])}.from`], message: 'First group size must start at 1' })
        }
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].from <= sorted[i - 1].to) {
            ctx.addIssue({ code: 'custom', path: [`groupSizes.${i}.from`], message: `Group sizes must not overlap ("${sorted[i-1].from}-${sorted[i-1].to}" → "${sorted[i].from}")` })
          }
        }
      }
    }
    if (data.scheduleType === 'fixedTimeSlot') {
      if (!Array.isArray(data.timeSlots) || data.timeSlots.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['timeSlots'], message: 'Add at least one time slot' })
      }
    }
    if (data.minParticipants != null && data.maxParticipants != null && data.minParticipants > data.maxParticipants) {
      ctx.addIssue({ code: 'custom', path: ['minParticipants'], message: 'Min must be less than or equal to max' })
    }
  }),
  17: z.object({
    cutoffMinutes: z.number().min(1, 'Select a cut-off time'),
    lastMinuteBookings: z.boolean().optional(),
    perSlotCutoff: z.boolean().optional(),
  }),
  11: z.object({
    cancellationType: z.enum(['standard', 'all_sales_final'], {
      errorMap: () => ({ message: 'Select a cancellation policy' }),
    }),
    supplierCanCancelBadWeather: z.boolean().optional(),
    supplierCanCancelNotEnoughTravelers: z.boolean().optional(),
  }),
}
