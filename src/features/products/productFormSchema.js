import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  visitType: z.string().min(1, 'Visit type is required'),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
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
  description: z.string().min(1, 'Description is required'),
  isOptional: z.boolean().optional(),
  additionalFee: z.boolean().optional(),
})

export const stepSchemas = {
   1: z.object({
     language: z.string().min(1, 'Select a language'),
   }),
   2: z.object({
     category: z.string().min(1, 'Select a product category'),
     activityType: z.string().min(1, 'Select an activity type'),
     difficulty: z.string().min(1, 'Select a difficulty level'),
     duration: z.number({ invalid_type_error: 'Duration is required' }).min(0.5, 'Duration must be at least 0.5').nullable().optional(),
     durationUnit: z.enum(['minutes', 'hours', 'days']).optional(),
     activitiesIncluded: z.array(z.string()).optional(),
     pickupTransportTypes: z.array(z.string()).optional(),
   }),
   3: z.object({
    title: z.string().min(1, 'Title is required'),
    referenceCode: z.string().optional(),
  }),
  4: z.object({
    shortDescription: z
      .string()
      .min(10, 'Short description must be at least 10 characters'),
    fullDescription: z
      .string()
      .min(20, 'Full description must be at least 20 characters'),
    highlights: z
      .array(z.string().min(1))
      .min(3, 'Add at least 3 highlights')
      .max(5, 'Maximum 5 highlights'),
  }),
  5: z.object({
    locations: z
      .array(locationSchema)
      .min(1, 'Add at least one location'),
    attractions: z.array(attractionSchema).optional(),
  }),
  6: z.object({
    keywords: z.array(z.string()).max(15, 'Maximum 15 keywords'),
  }),
  7: z.object({
    whatsIncluded: z.array(z.string()).optional(),
    whatsNotIncluded: z.array(z.string()).optional(),
    activitiesIncluded: z.array(z.string()).optional(),
    pickupTransportTypes: z.array(z.string()).optional(),
    foodProvided: z.boolean(),
    mealType: z.string().optional(),
    drinksIncluded: z.boolean().optional(),
    dietaryOptions: z.array(z.string()).optional(),
    transportationProvided: z.boolean(),
    transportationType: z.string().optional(),
  }),
  8: z.object({
    guideType: z.enum(['tour-guide', 'driver', 'host', 'greeter', 'self-guided', 'instructor']),
    guideMaterials: z.object({
      audioGuide: z.boolean(),
      infoBooklet: z.boolean(),
    }),
  }),
  9: z.object({
    photos: z
      .array(z.object({ id: z.string(), url: z.string() }))
      .min(7, 'Upload at least 7 photos'),
    copyrightConfirmed: z.literal(true, {
      message: 'You must confirm copyright ownership',
    }),
  }),
  10: z.object({
    notSuitableFor: z.array(z.string()).optional(),
    notAllowed: z.array(z.string()).optional(),
    petFriendly: z.boolean().optional(),
    mandatoryItems: z.array(z.string()).optional(),
    knowBeforeYouGo: z.string().optional(),
    emergencyCountryCode: z.string().optional(),
    emergencyPhone: z.string().optional(),
    voucherInfo: z.string().optional(),
  }),
  11: z.object({
    options: z
      .array(productOptionSchema)
      .min(1, 'Add at least one option'),
  }),
  12: z.object({
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
    pickupAreas: z.array(z.object({ name: z.string(), time: z.string() })).optional(),
    pickupLocations: z.array(locationPointSchema).optional(),
    pickupGeoshape: z.any().nullable().optional(),
    dropoffOption: z.enum(['same_location', 'different_location', 'none', 'service']).optional(),
    dropoffLocation: locationPointSchema.nullable().optional(),
    dropoffDescription: z.string().optional(),
  }),
  13: z.object({
    pricingModel: z.enum(['perPerson', 'perGroup'], {
      errorMap: () => ({ message: 'Select a pricing model' }),
    }),
    currency: z.string().min(1, 'Select a currency'),
    scheduleType: z.enum(['fixedTimeSlot', 'operatingHours']),
    scheduleName: z.string().min(1, 'Schedule name is required'),
    scheduleStartDate: z.string().min(1, 'Start date is required'),
    scheduleHasEndDate: z.boolean().optional(),
    scheduleEndDate: z.string().optional(),
    timeSlots: z
      .array(z.object({ id: z.string(), startTime: z.string().min(1, 'Start time is required'), cutoff: z.number().min(0).optional() }))
      .optional(),
    operatingHoursStart: z.string().optional(),
    operatingHoursEnd: z.string().optional(),
    dateExceptions: z
      .array(
        z.object({
          id: z.string(),
          date: z.string(),
          type: z.enum(['closed', 'override']),
          overrideTimes: z.array(z.string()).optional(),
        }),
      )
      .optional(),
    pricingApproach: z.enum(['sameForEveryone', 'dependsOnAge']).optional(),
    uniformPrice: z.number().min(0).nullable().optional(),
    ageGroups: z
      .array(
        z.object({
          name: z.string().min(1, 'Age group name is required'),
          price: z.number().min(0, 'Price must be 0 or greater').nullable().optional(),
          minAge: z.number().min(0, 'Min age must be 0 or greater'),
          maxAge: z.number().min(0, 'Max age must be 0 or greater'),
          notAllowed: z.boolean().optional(),
          ticketNotRequired: z.boolean().optional(),
          needsAdult: z.boolean().optional(),
        }),
      )
      .optional(),
    minParticipants: z.number().min(1).optional(),
    maxParticipants: z.number().min(1, 'Max participants must be at least 1').optional(),
    pricingTiers: z
      .array(
        z.object({
          id: z.string(),
          from: z.number().min(1).nullable(),
          to: z.number().min(1).nullable(),
          pricePerPerson: z.number().min(0).nullable(),
        }),
      )
      .optional(),
    groupSizes: z
      .array(z.object({ id: z.string(), size: z.number().min(1).nullable(), price: z.number().min(0).nullable() }))
      .optional(),
    additionalPersonsEnabled: z.boolean().optional(),
    additionalPersonPrice: z.number().min(0).nullable().optional(),
    maxGroupsPerTimeSlot: z.number().min(1).optional(),
  }).superRefine((data, ctx) => {
    if (data.pricingModel === 'perPerson') {
      if (data.pricingApproach === 'sameForEveryone') {
        if (data.uniformPrice == null || data.uniformPrice <= 0) {
          ctx.addIssue({ code: 'custom', path: ['uniformPrice'], message: 'Enter a price per person' })
        }
      }
      if (data.pricingApproach === 'dependsOnAge') {
        if (!data.ageGroups || data.ageGroups.length === 0) {
          ctx.addIssue({ code: 'custom', path: ['ageGroups'], message: 'Add at least one age group' })
        }
        if (Array.isArray(data.ageGroups)) {
          data.ageGroups.forEach((g, i) => {
            if (g.maxAge <= g.minAge) {
              ctx.addIssue({ code: 'custom', path: [`ageGroups.${i}.maxAge`], message: 'Max age must be greater than min age' })
            }
          })
        }
      }
      if (!Array.isArray(data.pricingTiers) || data.pricingTiers.length === 0) return
      data.pricingTiers.forEach((tier, i) => {
        if (tier.from === null || tier.to === null || tier.pricePerPerson === null) return
        if (tier.to < tier.from) {
          ctx.addIssue({ code: 'custom', path: [`pricingTiers.${i}.to`], message: 'Max must be greater than or equal to min' })
        }
      })
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
  14: z.object({
    itinerary: z
      .array(itineraryEntrySchema)
      .min(1, 'Add at least one itinerary entry'),
  }),
}
