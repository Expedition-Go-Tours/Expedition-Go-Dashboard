import { stepSchemas } from './productFormSchema'

const STEP_FIELDS = {
  1: ['language'],
  2: ['category', 'activityType', 'difficulty', 'duration', 'durationUnit'],
  3: ['title', 'referenceCode'],
  4: ['shortDescription', 'fullDescription', 'highlights'],
  5: ['locations'],
  6: ['keywords'],
   7: [
     'whatsIncluded',
     'whatsNotIncluded',
     'activitiesIncluded',
     'pickupTransportTypes',
     'guideType',
     'foodProvided',
     'mealType',
     'drinksIncluded',
     'dietaryOptions',
     'transportationProvided',
     'transportationType',
   ],
  8: ['photos', 'copyrightConfirmed'],
  9: [
    'notSuitableFor',
    'notAllowed',
    'petFriendly',
    'mandatoryItems',
    'knowBeforeYouGo',
    'emergencyCountryCode',
    'emergencyPhone',
    'voucherInfo',
  ],
  10: ['options'],
  11: [
    'meetingPoint',
    'meetingPointDescription',
    'arrivalTime',
    'pickupProvided',
    'pickupType',
    'pickupDescription',
    'referenceStartTime',
    'pickupAreas',
    'dropoffProvided',
    'dropoffDescription',
  ],
  12: [
    'pricingModel',
    'currency',
    'scheduleType',
    'scheduleName',
    'scheduleStartDate',
    'scheduleHasEndDate',
    'scheduleEndDate',
    'timeSlots',
    'operatingHoursStart',
    'operatingHoursEnd',
    'dateExceptions',
    'pricingApproach',
    'ageGroups',
    'minParticipants',
    'maxParticipants',
    'pricingTiers',
    'groupSizes',
    'additionalPersonsEnabled',
    'additionalPersonPrice',
    'maxGroupsPerTimeSlot',
  ],
  13: ['itinerary'],
}

function pick(obj, keys) {
  const result = {}
  for (const key of keys) {
    if (key in obj) result[key] = obj[key]
  }
  return result
}

export function validateStep(stepIndex, formData) {
  const schema = stepSchemas[stepIndex]
  if (!schema) return {}

  const fields = STEP_FIELDS[stepIndex]
  if (!fields) return {}

  const partialData = pick(formData, fields)

  const result = schema.safeParse(partialData)
  if (result.success) return {}

  const errors = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) errors[path] = []
    errors[path].push(issue.message)
  }
  return errors
}

export function isStepComplete(stepIndex, formData) {
  return Object.keys(validateStep(stepIndex, formData)).length === 0
}
