import { stepSchemas } from './productFormSchema'

const STEP_FIELDS = {
  1: ['language'],
  2: ['title', 'referenceCode'],
  3: ['category', 'activitiesIncluded', 'transportModes', 'transportServices', 'difficulty', 'duration', 'durationUnit', 'accommodationIncluded'],
  4: ['shortDescription', 'fullDescription', 'highlights'],
    5: ['locations'],
   6: ['keywords', 'activitiesIncluded'],
    7: [
      'whatsIncluded',
      'whatsNotIncluded',
      'foodProvided',
      'meals',
      'drinksIncluded',
      'showDietaryRestrictions',
      'dietaryOptions',
    ],
   8: ['transportationProvided', 'pickupTransportTypes', 'crossCityTravel'],
   9: ['guideType', 'guideMaterials'],
10: [
      'notSuitableFor',
      'notAllowed',
      'petFriendly',
      'mandatoryItems',
      'knowBeforeYouGo',
      'emergencyPhone',
      'voucherInfo',
    ],
    11: ['cancellationType', 'supplierCanCancelBadWeather', 'supplierCanCancelNotEnoughTravelers'],
    12: ['photos', 'copyrightConfirmed'],
    13: ['options'],
    14: [
     'meetingMode',
     'meetingPoint',
     'meetingPointPicture',
     'meetingPointDescription',
     'arrivalTimeType',
     'arrivalTimeCustom',
     'pickupType',
     'pickupDescription',
     'pickupTiming',
     'pickupFinalLocationTiming',
     'referenceStartTime',
     'pickupAreas',
     'pickupLocations',
     'pickupGeoshape',
     'dropoffOption',
     'dropoffLocation',
     'dropoffDescription',
   ],
    15: [],
    16: [
      'pricingModel',
      'currency',
      'scheduleType',
      'schedules',
      'pricingApproach',
      'pricingCategories',
      'uniformPrice',
      'groupSizes',
      'timeSlots',
      'minParticipants',
      'maxParticipants',
      'maxGroupsPerTimeSlot',
      'additionalPersonsEnabled',
      'additionalPersonPrice',
    ],
    17: ['cutoffMinutes', 'lastMinuteBookings', 'perSlotCutoff', 'perSlotCutoffs'],
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
