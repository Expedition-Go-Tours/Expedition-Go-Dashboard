import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeId } from '@/lib/utils'
import { GYG_STEPS } from './gygSteps'
import { isStepComplete } from './stepValidation'
import { getCountryCallingCode } from 'libphonenumber-js'

function getSectionStep(index) {
  const step = GYG_STEPS[index]
  if (!step) return { sectionId: 'getting-started', stepId: 'language' }
  return { sectionId: step.sectionId, stepId: step.stepId }
}

const INITIAL_FORM = {
  language: '',
  category: '',
  subcategory: '',
  activityType: '',
  difficulty: '',
  transportMode: '',
  duration: null,
  durationUnit: 'hours',
  title: '',
  referenceCode: '',
  shortDescription: '',
  fullDescription: '',
  highlights: ['', '', ''],
  locations: [],
  attractions: [],
  keywords: [],
  activitiesIncluded: [],
  transportModes: [],
  transportServices: [],
  pickupTransportTypes: [],
  whatsIncluded: [],
  whatsNotIncluded: [],
  guideType: 'tour-guide',
  guideMaterials: { audioGuide: false, infoBooklet: false },
  foodProvided: false,
  meals: [],
  drinksIncluded: false,
  showDietaryRestrictions: false,
  dietaryOptions: [],
  transportationProvided: false,
  transportationType: '',
  crossCityTravel: false,
  cutoffMinutes: 20,
  lastMinuteBookings: false,
  perSlotCutoff: false,
  notSuitableFor: [],
  notAllowed: [],
  petFriendly: false,
  wifiIncluded: false,
  mandatoryItems: [],
  knowBeforeYouGo: '',
  emergencyPhone: '',
  voucherInfo: '',
  photos: [],
  _pendingFiles: {},
  _uploadedUrls: [],
  coverPhoto: '',
  copyrightConfirmed: false,
  options: [],
  meetingMode: 'meeting_point',
  meetingPoint: null,
  meetingPointPicture: '',
  meetingPointDescription: '',
  arrivalTimeType: 'none',
  arrivalTimeCustom: '',
  pickupType: 'area',
  pickupDescription: '',
  pickupTiming: 'at_start',
  pickupFinalLocationTiming: 'day_before',
  referenceStartTime: '',
  pickupAreas: [],
  pickupLocations: [],
  pickupGeoshape: null,
  planPickupTimes: false,
  pickupStartTime: '08:00',
  dropoffOption: 'none',
  dropoffLocation: null,
  dropoffDescription: '',
  pricingModel: 'perPerson',
  currency: 'USD',
  schedules: [],
  currentScheduleStep: 1,
  editingScheduleIndex: null,
  scheduleType: 'operatingHours',
  scheduleName: '',
  scheduleStartDate: '',
  scheduleHasEndDate: false,
  scheduleEndDate: '',
  weeklySchedule: {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  },
  dateExceptions: [],
  timeSlots: [],
  operatingHoursStart: '09:00',
  operatingHoursEnd: '17:00',
  pricingApproach: 'dependsOnAge',
  uniformPrice: null,
  pricingCategories: [{ name: 'Child', price: null, minAge: 0, maxAge: 17, notAllowed: false, ticketNotRequired: false, needsAdult: false, idRequired: false, idType: '', tiers: [] }, { name: 'Adult', price: null, minAge: 18, maxAge: 99, notAllowed: false, ticketNotRequired: false, needsAdult: false, idRequired: false, idType: '', tiers: [] }],
  showAdvancedCategorySettings: false,
  minParticipants: 1,
  maxParticipants: 10,
  groupSizes: [],
  additionalPersonsEnabled: false,
  additionalPersonPrice: null,
  maxGroupsPerTimeSlot: 1,
  itinerary: [],
  itineraryOverview: '',
  additionalItineraryInfo: '',
  dayTitles: {},
  cutoffHours: 0,
  cancellationType: 'standard',
  supplierCanCancelBadWeather: false,
  supplierCanCancelNotEnoughTravelers: false,
  metaTitle: '',
  metaDescription: '',
  contactPhone: null,
  isPrivateActivity: false,
  passportRequired: false,
  flightInfoRequired: false,
  shipInfoRequired: false,
  trainInfoRequired: false,
  hotelInfoRequired: false,
}

export const useProductBuilderStore = create(
  persist(
    (set, get) => ({
      ...INITIAL_FORM,

      currentStep: 0,
      currentSectionId: 'getting-started',
      currentStepId: 'language',
      completedStepIds: [],
      stepErrors: {},

      isDirty: false,
      isSaving: false,
      isSubmitting: false,
      lastSaved: null,
      hasHydrated: false,
      savedProductId: null,

      setHasHydrated: (val) => set({ hasHydrated: val }),

      setField: (key, value) =>
        set((s) => {
          const updates = { [key]: value, isDirty: true }
          if (key === 'maxParticipants') {
            updates.pricingCategories = s.pricingCategories.map((c) => {
              const t = c.tiers || []
              if (t.length === 0) return c
              return { ...c, tiers: t.map((tier, j) => j === t.length - 1 ? { ...tier, to: value } : tier) }
            })
          }
          return updates
        }),

      addHighlight: (item) =>
        set((s) => ({ highlights: [...s.highlights, item], isDirty: true })),
      updateHighlight: (index, value) =>
        set((s) => ({
          highlights: s.highlights.map((h, i) => (i === index ? value : h)),
          isDirty: true,
        })),
      removeHighlight: (index) =>
        set((s) => ({ highlights: s.highlights.filter((_, i) => i !== index), isDirty: true })),

      addLocation: (loc) =>
        set((s) => ({ locations: [...s.locations, loc], isDirty: true })),
      removeLocation: (index) =>
        set((s) => ({ locations: s.locations.filter((_, i) => i !== index), isDirty: true })),
      updateLocation: (index, updates) =>
        set((s) => ({
          locations: s.locations.map((loc, i) => (i === index ? { ...loc, ...updates } : loc)),
          isDirty: true,
        })),
      reorderLocations: (from, to) =>
        set((s) => {
          const locations = [...s.locations]
          const [removed] = locations.splice(from, 1)
          locations.splice(to, 0, removed)
          return { locations, isDirty: true }
        }),

      addAttraction: (attraction) =>
        set((s) => ({ attractions: [...s.attractions, attraction], isDirty: true })),
      updateAttraction: (index, updates) =>
        set((s) => ({
          attractions: s.attractions.map((a, i) => (i === index ? { ...a, ...updates } : a)),
          isDirty: true,
        })),
      removeAttraction: (index) =>
        set((s) => ({ attractions: s.attractions.filter((_, i) => i !== index), isDirty: true })),

      addKeyword: (kw) =>
        set((s) => ({ keywords: [...s.keywords, kw], isDirty: true })),
      removeKeyword: (index) =>
        set((s) => ({ keywords: s.keywords.filter((_, i) => i !== index), isDirty: true })),

      addActivityIncluded: (item) =>
        set((s) => ({ activitiesIncluded: [...s.activitiesIncluded, item], isDirty: true })),
      removeActivityIncluded: (index) =>
        set((s) => ({ activitiesIncluded: s.activitiesIncluded.filter((_, i) => i !== index), isDirty: true })),
      addPickupTransportType: (item) =>
        set((s) => ({ pickupTransportTypes: [...s.pickupTransportTypes, item], isDirty: true })),
      removePickupTransportType: (index) =>
        set((s) => ({ pickupTransportTypes: s.pickupTransportTypes.filter((_, i) => i !== index), isDirty: true })),

      addInclusionItem: (field, item) =>
        set((s) => ({ [field]: [...s[field], item], isDirty: true })),
      removeInclusionItem: (field, index) =>
        set((s) => ({ [field]: s[field].filter((_, i) => i !== index), isDirty: true })),
      updateInclusionItem: (field, index, value) =>
        set((s) => ({
          [field]: s[field].map((item, i) => (i === index ? value : item)),
          isDirty: true,
        })),

      addMeal: () =>
        set((s) => ({ meals: [...s.meals, { type: '', format: '' }], isDirty: true })),
      updateMeal: (index, field, value) =>
        set((s) => ({
          meals: s.meals.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
          isDirty: true,
        })),
      removeMeal: (index) =>
        set((s) => ({ meals: s.meals.filter((_, i) => i !== index), isDirty: true })),

      addDietaryOption: (opt) =>
        set((s) => ({ dietaryOptions: [...s.dietaryOptions, opt], isDirty: true })),
      removeDietaryOption: (index) =>
        set((s) => ({ dietaryOptions: s.dietaryOptions.filter((_, i) => i !== index), isDirty: true })),

      addNotSuitable: (item) =>
        set((s) => ({ notSuitableFor: [...s.notSuitableFor, item], isDirty: true })),
      removeNotSuitable: (index) =>
        set((s) => ({ notSuitableFor: s.notSuitableFor.filter((_, i) => i !== index), isDirty: true })),

      addNotAllowed: (item) =>
        set((s) => ({ notAllowed: [...s.notAllowed, item], isDirty: true })),
      removeNotAllowed: (index) =>
        set((s) => ({ notAllowed: s.notAllowed.filter((_, i) => i !== index), isDirty: true })),

      addMandatoryItem: (item) =>
        set((s) => ({ mandatoryItems: [...s.mandatoryItems, item], isDirty: true })),
      removeMandatoryItem: (index) =>
        set((s) => ({ mandatoryItems: s.mandatoryItems.filter((_, i) => i !== index), isDirty: true })),

      addPhoto: (id, file) =>
        set((s) => ({
          photos: [...s.photos, { id, url: '' }],
          _pendingFiles: { ...s._pendingFiles, [id]: file },
          isDirty: true,
        })),
      setPhotoUrl: (id, url) =>
        set((s) => {
          const rest = { ...s._pendingFiles }
          delete rest[id]
          return {
            photos: s.photos.map((p) => (p.id === id ? { ...p, url } : p)),
            _pendingFiles: rest,
            isDirty: true,
          }
        }),
      removePhoto: (index) =>
        set((s) => {
          const photo = s.photos[index]
          if (!photo) return s
          const rest = { ...s._pendingFiles, [photo.id]: undefined }
          delete rest[photo.id]
          return {
            photos: s.photos.filter((_, i) => i !== index),
            _pendingFiles: rest,
            isDirty: true,
          }
        }),
      reorderPhotos: (from, to) =>
        set((s) => {
          const photos = [...s.photos]
          const [removed] = photos.splice(from, 1)
          photos.splice(to, 0, removed)
          return { photos, isDirty: true }
        }),
      setCoverPhoto: (url) => set({ coverPhoto: url, isDirty: true }),
      trackUploadedUrl: (url) =>
        set((s) => ({
          _uploadedUrls: s._uploadedUrls.includes(url) ? s._uploadedUrls : [...s._uploadedUrls, url],
        })),
      clearUploadedUrls: () => set({ _uploadedUrls: [] }),

      addOption: () =>
        set((s) => ({
          options: [
            ...s.options,
            {
              id: safeId(),
              title: '',
              refCode: 'default',
              description: '',
              isPrivate: false,
              skipTheLine: 'none',
              wheelchairAccessible: false,
              audioGuide: false,
              infoBooklet: false,
              maxGroupSize: null,
              duration: null,
              durationUnit: null,
              validityEnabled: false,
              validityType: 'date_picked',
              validity: null,
              validityUnit: null,
              validityStartDate: '',
              validityEndDate: '',
            },
          ],
          isDirty: true,
        })),
      updateOption: (index, updates) =>
        set((s) => ({
          options: s.options.map((opt, i) =>
            i === index ? { ...opt, ...updates } : opt,
          ),
          isDirty: true,
        })),
      removeOption: (index) =>
        set((s) => ({
          options: s.options.filter((_, i) => i !== index),
          isDirty: true,
        })),
      reorderOption: (from, to) =>
        set((s) => {
          const options = [...s.options]
          const [removed] = options.splice(from, 1)
          options.splice(to, 0, removed)
          return { options, isDirty: true }
        }),
      duplicateOption: (index) =>
        set((s) => {
          const original = s.options[index]
          if (!original) return s
          const clone = {
            ...original,
            id: safeId(),
            title: original.title ? `${original.title} (copy)` : '',
          }
          const options = [...s.options]
          options.splice(index + 1, 0, clone)
          return { options, isDirty: true }
        }),

      pushItineraryEntry: (entry) =>
        set((s) => ({
          itinerary: [...s.itinerary, { ...entry }],
          isDirty: true,
        })),

      addItineraryEntry: () =>
        set((s) => ({
          itinerary: [
            ...s.itinerary,
            { day: 1, time: '09:00', duration: 1, durationUnit: 'hour', title: '', description: '', type: 'activity', visitType: 'visit', locationName: '', locationAddress: '', locationLat: null, locationLng: null, isCustomLocation: false },
          ],
          isDirty: true,
        })),

      addItinerarySegment: (dayNumber) =>
        set((s) => ({
          itinerary: [
            ...s.itinerary,
            { day: dayNumber, time: '09:00', duration: 1, durationUnit: 'hour', title: '', description: '', type: 'activity', visitType: 'visit', locationName: '', locationAddress: '', locationLat: null, locationLng: null, isCustomLocation: false },
          ],
          isDirty: true,
        })),
      updateItineraryEntry: (index, updates) =>
        set((s) => ({
          itinerary: s.itinerary.map((entry, i) =>
            i === index ? { ...entry, ...updates } : entry,
          ),
          isDirty: true,
        })),
      removeItineraryEntry: (index) =>
        set((s) => ({
          itinerary: s.itinerary.filter((_, i) => i !== index),
          isDirty: true,
        })),
      reorderItineraryEntry: (from, to) =>
        set((s) => {
          const entries = [...s.itinerary]
          const [removed] = entries.splice(from, 1)
          entries.splice(to, 0, removed)
          return { itinerary: entries, isDirty: true }
        }),
      insertItineraryEntry: (index, entry) =>
        set((s) => {
          const entries = [...s.itinerary]
          entries.splice(index, 0, { ...entry })
          return { itinerary: entries, isDirty: true }
        }),

      addPricingCategory: (template) =>
        set((s) => ({
          pricingCategories: [...s.pricingCategories, template || { name: '', price: null, minAge: 1, maxAge: 99, notAllowed: false, ticketNotRequired: false, needsAdult: false, idRequired: false, idType: '', tiers: [] }],
          isDirty: true,
        })),
      updatePricingCategory: (index, updates) =>
        set((s) => ({
          pricingCategories: s.pricingCategories.map((g, i) => (i === index ? { ...g, ...updates } : g)),
          isDirty: true,
        })),
      removePricingCategory: (index) =>
        set((s) => ({
          pricingCategories: s.pricingCategories.filter((_, i) => i !== index),
          isDirty: true,
        })),

      addCategoryTier: (catIndex) =>
        set((s) => {
          const cat = s.pricingCategories[catIndex]
          if (!cat) return s
          const tiers = cat.tiers || []
          const lastTier = tiers[tiers.length - 1]

          // First tier: starts from 1 (GetYourGuide standard).
          // Peel a single unit off the front: Tier 1 becomes 1..1 and the
          // remaining 2..N becomes the first sub-tier. The base row (Tier 1)
          // stays in place and a sub-tier card appears right away.
          if (!lastTier) {
            const firstTo = s.maxParticipants ?? 10
            if (1 >= firstTo) return s

            // GetYourGuide behavior: Add same tier structure to ALL categories
            return {
              pricingCategories: s.pricingCategories.map((c) => ({
                ...c,
                tiers: [
                  { id: safeId(), from: 1, to: 1, pricePerPerson: c.price != null ? c.price : null },
                  { id: safeId(), from: 2, to: firstTo, pricePerPerson: null },
                ]
              })),
              isDirty: true,
            }
          }

          // Additional tiers: peel a single unit off the front of the last tier.
          // The new tier extends to the last tier's current upper bound
          // (normally the capacity step's max).
          const lastTo = lastTier.to ?? s.maxParticipants ?? 10
          const lastFrom = lastTier.from

          // Can't split if the range is too small (need at least 2 units)
          if (lastTo - lastFrom < 1) return s

          // GetYourGuide behavior: Apply tier structure change to ALL categories
          return {
            pricingCategories: s.pricingCategories.map((c) => {
              const catTiers = c.tiers || []
              const catLastTier = catTiers[catTiers.length - 1]

              if (!catLastTier) {
                // Category has no tiers yet, add the new tier structure
                return {
                  ...c,
                  tiers: [
                    { id: safeId(), from: 1, to: 1, pricePerPerson: null },
                    { id: safeId(), from: 2, to: lastTo, pricePerPerson: null },
                  ]
                }
              }

              // Split the last tier: keep [from..from] with its existing price,
              // the rest [from+1..to] becomes a new tier needing a price
              return {
                ...c,
                tiers: [
                  ...catTiers.slice(0, -1),
                  { ...catLastTier, to: catLastTier.from },
                  { id: safeId(), from: catLastTier.from + 1, to: lastTo, pricePerPerson: null },
                ]
              }
            }),
            isDirty: true,
          }
        }),
      updateCategoryTier: (catIndex, tierIndex, updates) =>
        set((s) => {
          const cat = s.pricingCategories[catIndex]
          const tiers = cat?.tiers || []
          const tier = tiers[tierIndex]
          if (!tier) return s
          
          const merged = { ...tier, ...updates }

          // If updating from/to range, sync across all categories (GetYourGuide behavior)
          const isRangeUpdate = 'from' in updates || 'to' in updates
          
          if (isRangeUpdate) {
            return {
              pricingCategories: s.pricingCategories.map((c) => {
                const catTiers = c.tiers || []
                return {
                  ...c,
                  tiers: catTiers.map((t, j) => {
                    if (j === tierIndex) {
                      // Update the current tier's range
                      return {
                        ...t,
                        from: merged.from,
                        to: merged.to,
                      }
                    }
                    
                    // Cascade: If next tier exists, update its "from" to be current tier's "to" + 1
                    // (GetYourGuide behavior: maintain sequential continuity)
                    if (j === tierIndex + 1 && 'to' in updates && merged.to != null) {
                      return {
                        ...t,
                        from: merged.to + 1,
                      }
                    }
                    
                    // Cascade backwards: If previous tier exists and we're updating "from",
                    // update previous tier's "to" to be current tier's "from" - 1
                    if (j === tierIndex - 1 && 'from' in updates && merged.from > 1) {
                      return {
                        ...t,
                        to: merged.from - 1,
                      }
                    }
                    
                    return t
                  })
                }
              }),
              isDirty: true,
            }
          }
          
          // Only updating price - apply to specific category only
          return {
            pricingCategories: s.pricingCategories.map((c, i) =>
              i === catIndex
                ? {
                    ...c,
                    tiers: tiers.map((t, j) => (j === tierIndex ? merged : t)),
                  }
                : c
            ),
            isDirty: true,
          }
        }),
      removeCategoryTier: (catIndex, tierIndex) =>
        set((s) => {
          const cat = s.pricingCategories[catIndex]
          if (!cat) return s
          const tiers = cat.tiers || []
          if (tiers.length <= 1) return s
          
          const removed = tiers[tierIndex]
          
          // GetYourGuide behavior: Remove tier from ALL categories
          return {
            pricingCategories: s.pricingCategories.map((c) => {
              const catTiers = c.tiers || []
              if (catTiers.length <= 1) return { ...c, tiers: [] } // Remove all tiers if only 1 left
              
              return {
                ...c,
                tiers: catTiers
                  .map((t, j) => {
                    // Merge adjacent tiers when removing
                    if (j === tierIndex - 1 && removed) return { ...t, to: removed.to }
                    if (j === tierIndex + 1 && tierIndex === 0 && removed) return { ...t, from: removed.from }
                    return t
                  })
                  .filter((_, j) => j !== tierIndex),
              }
            }),
            isDirty: true,
          }
        }),

      addGroupSize: () =>
        set((s) => {
          const sizes = s.groupSizes
          if (sizes.length === 0) {
            return {
              groupSizes: [{ id: safeId(), from: 1, to: 1, price: null }],
              isDirty: true,
            }
          }
          const last = sizes[sizes.length - 1]
          const newFrom = last ? last.to + 1 : 1
          return {
            groupSizes: [...sizes, { id: safeId(), from: newFrom, to: newFrom, price: null }],
            isDirty: true,
          }
        }),
      updateGroupSize: (index, updates) =>
        set((s) => {
          const gs = s.groupSizes
          const g = gs[index]
          if (!g) return s
          const merged = { ...g, ...updates }
          if (merged.to < merged.from) return s
          return {
            groupSizes: gs.map((g2, i) => (i === index ? merged : g2)),
            isDirty: true,
          }
        }),
      removeGroupSize: (index) =>
        set((s) => {
          if (s.groupSizes.length <= 1) return s
          const sorted = [...s.groupSizes].sort((a, b) => (a.from ?? 0) - (b.from ?? 0))
          if (index < 0 || index >= sorted.length) return s
          const current = sorted[index]
          if (!current) return s
          const prev = sorted[index - 1]
          const next = sorted[index + 1]
          const newFrom = prev ? prev.to + 1 : 1
          const newTo = next ? next.from - 1 : (current.to ?? 100)
          if (newFrom > newTo) return s
          return {
            groupSizes: sorted.map((g, i) => {
              if (i === index) return null
              if (i === index - 1) return { ...prev, to: newTo }
              if (i === index + 1) return { ...next, from: newFrom }
              return g
            }).filter(g => g != null),
            isDirty: true,
          }
        }),

      addDateException: () =>
        set((s) => ({
          dateExceptions: [...s.dateExceptions, { id: safeId(), date: '', type: 'closed', overrideTimes: [] }],
          isDirty: true,
        })),
      updateDateException: (index, updates) =>
        set((s) => ({
          dateExceptions: s.dateExceptions.map((d, i) => (i === index ? { ...d, ...updates } : d)),
          isDirty: true,
        })),
      removeDateException: (index) =>
        set((s) => ({
          dateExceptions: s.dateExceptions.filter((_, i) => i !== index),
          isDirty: true,
        })),

      addWeeklyHours: (day) =>
        set((s) => ({
          weeklySchedule: {
            ...s.weeklySchedule,
            [day]: [...(s.weeklySchedule[day] || []), { startTime: '08:00', endTime: '18:00' }],
          },
          isDirty: true,
        })),
      updateWeeklyHours: (day, index, updates) =>
        set((s) => ({
          weeklySchedule: {
            ...s.weeklySchedule,
            [day]: s.weeklySchedule[day].map((h, i) => (i === index ? { ...h, ...updates } : h)),
          },
          isDirty: true,
        })),
      removeWeeklyHours: (day, index) =>
        set((s) => ({
          weeklySchedule: {
            ...s.weeklySchedule,
            [day]: s.weeklySchedule[day].filter((_, i) => i !== index),
          },
          isDirty: true,
        })),
      copyDayToRemaining: (sourceDay) =>
        set((s) => {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          const sourceHours = s.weeklySchedule[sourceDay] || []
          const newSchedule = { ...s.weeklySchedule }
          const sourceIndex = days.indexOf(sourceDay)
          for (let i = sourceIndex + 1; i < days.length; i++) {
            newSchedule[days[i]] = sourceHours.map((h) => ({ ...h }))
          }
          return { weeklySchedule: newSchedule, isDirty: true }
        }),
      removeAllWeeklyHours: () =>
        set((s) => {
          const newSchedule = {}
          Object.keys(s.weeklySchedule).forEach((day) => { newSchedule[day] = [] })
          return { weeklySchedule: newSchedule, isDirty: true }
        }),

      addTimeSlot: () =>
        set((s) => ({
          timeSlots: [...s.timeSlots, { id: safeId(), startTime: '09:00' }],
          isDirty: true,
        })),
      updateTimeSlot: (index, updates) =>
        set((s) => ({
          timeSlots: s.timeSlots.map((t, i) => (i === index ? { ...t, ...updates } : t)),
          isDirty: true,
        })),
      removeTimeSlot: (index) =>
        set((s) => ({
          timeSlots: s.timeSlots.filter((_, i) => i !== index),
          isDirty: true,
        })),
      copyWeeklyHoursFromException: (exceptionIndex, day) =>
        set((s) => {
          const exception = s.dateExceptions[exceptionIndex]
          if (!exception) return s
          return {
            weeklySchedule: {
              ...s.weeklySchedule,
              [day]: (exception.overrideTimes || []).map((t) => ({ ...t })),
            },
            isDirty: true,
          }
        }),

      saveSchedule: () =>
        set((s) => {
          const schedule = {
            name: s.scheduleName,
            type: s.scheduleType,
            startDate: s.scheduleStartDate,
            hasEndDate: s.scheduleHasEndDate,
            endDate: s.scheduleEndDate,
            weeklySchedule: JSON.parse(JSON.stringify(s.weeklySchedule)),
            dateExceptions: [...s.dateExceptions],
            timeSlots: JSON.parse(JSON.stringify(s.timeSlots)),
            pricingModel: s.pricingModel,
            currency: 'USD',
            pricingApproach: s.pricingApproach,
            uniformPrice: s.uniformPrice,
            pricingCategories: JSON.parse(JSON.stringify(s.pricingCategories)),
            minParticipants: s.minParticipants,
            maxParticipants: s.maxParticipants,
            maxGroupsPerTimeSlot: s.maxGroupsPerTimeSlot,
            groupSizes: JSON.parse(JSON.stringify(s.groupSizes)),
            additionalPersonsEnabled: s.additionalPersonsEnabled,
            additionalPersonPrice: s.additionalPersonPrice,
          }
          const newSchedules = [...s.schedules]
          if (s.editingScheduleIndex !== null) {
            newSchedules[s.editingScheduleIndex] = schedule
          } else {
            newSchedules.push(schedule)
          }
          return {
            schedules: newSchedules,
            editingScheduleIndex: null,
            currentScheduleStep: 1,
            isDirty: true,
          }
        }),
      editSchedule: (index) =>
        set((s) => {
          const schedule = s.schedules[index]
          if (!schedule) return s
          return {
            editingScheduleIndex: index,
            currentScheduleStep: 1,
            scheduleName: schedule.name,
            scheduleType: schedule.type,
            scheduleStartDate: schedule.startDate,
            scheduleHasEndDate: schedule.hasEndDate,
            scheduleEndDate: schedule.endDate,
            weeklySchedule: JSON.parse(JSON.stringify(schedule.weeklySchedule)),
            dateExceptions: [...schedule.dateExceptions],
            timeSlots: JSON.parse(JSON.stringify(Array.isArray(schedule.timeSlots) ? schedule.timeSlots : [])),
            pricingModel: schedule.pricingModel,
            currency: schedule.currency || 'USD',
            pricingApproach: schedule.pricingApproach,
            uniformPrice: schedule.uniformPrice,
            pricingCategories: JSON.parse(JSON.stringify(schedule.pricingCategories || [])).map((c) => ({ ...c, tiers: c.tiers || [] })),
            minParticipants: schedule.minParticipants,
            maxParticipants: schedule.maxParticipants,
            maxGroupsPerTimeSlot: schedule.maxGroupsPerTimeSlot ?? 1,
            groupSizes: JSON.parse(JSON.stringify(schedule.groupSizes || [])),
            additionalPersonsEnabled: schedule.additionalPersonsEnabled ?? false,
            additionalPersonPrice: schedule.additionalPersonPrice ?? null,
          }
        }),
      removeSchedule: (index) =>
        set((s) => ({
          schedules: s.schedules.filter((_, i) => i !== index),
          isDirty: true,
        })),
      resetScheduleForm: () =>
        set((s) => ({
          currentScheduleStep: 1,
          editingScheduleIndex: null,
          scheduleName: '',
          scheduleType: s.scheduleType,
          scheduleStartDate: '',
          scheduleHasEndDate: false,
          scheduleEndDate: '',
          weeklySchedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
          dateExceptions: [],
          timeSlots: [],
          pricingApproach: 'dependsOnAge',
          uniformPrice: null,
          pricingCategories: [{ name: 'Child', price: null, minAge: 0, maxAge: 17, notAllowed: false, ticketNotRequired: false, needsAdult: false, idRequired: false, idType: '', tiers: [] }, { name: 'Adult', price: null, minAge: 18, maxAge: 99, notAllowed: false, ticketNotRequired: false, needsAdult: false, idRequired: false, idType: '', tiers: [] }],
          minParticipants: 1,
          maxParticipants: 10,
          maxGroupsPerTimeSlot: 1,
          groupSizes: [],
          additionalPersonsEnabled: false,
          additionalPersonPrice: null,
        })),

      addPickupArea: (area) =>
        set((s) => ({
          pickupAreas: [...s.pickupAreas, { name: area.name || '', time: area.time || '', address: area.address || '', lat: area.lat ?? null, lng: area.lng ?? null }],
          isDirty: true,
        })),
      updatePickupArea: (index, updates) =>
        set((s) => ({
          pickupAreas: s.pickupAreas.map((a, i) => (i === index ? { ...a, ...updates } : a)),
          isDirty: true,
        })),
      removePickupArea: (index) =>
        set((s) => ({
          pickupAreas: s.pickupAreas.filter((_, i) => i !== index),
          isDirty: true,
        })),

      addPickupLocation: (loc) =>
        set((s) => ({
          pickupLocations: [...s.pickupLocations, loc],
          isDirty: true,
        })),
      updatePickupLocation: (index, updates) =>
        set((s) => ({
          pickupLocations: s.pickupLocations.map((l, i) => (i === index ? { ...l, ...updates } : l)),
          isDirty: true,
        })),
      removePickupLocation: (index) =>
        set((s) => ({
          pickupLocations: s.pickupLocations.filter((_, i) => i !== index),
          isDirty: true,
        })),
      reorderPickupLocations: (from, to) =>
        set((s) => {
          const locations = [...s.pickupLocations]
          const [removed] = locations.splice(from, 1)
          locations.splice(to, 0, removed)
          return { pickupLocations: locations, isDirty: true }
        }),

      nextStep: () => {
        const { currentStep, completedStepIds } = get()
        const mapping = getSectionStep(currentStep)
        const newCompleted = [...new Set([...completedStepIds, mapping.stepId])]
        const next = Math.min(currentStep + 1, GYG_STEPS.length - 1)
        const nextMapping = getSectionStep(next)
        set({
          currentStep: next,
          currentSectionId: nextMapping.sectionId,
          currentStepId: nextMapping.stepId,
          completedStepIds: newCompleted,
          isDirty: false,
          lastSaved: new Date().toISOString(),
        })
      },

      prevStep: () => {
        const prev = Math.max(get().currentStep - 1, 0)
        const mapping = getSectionStep(prev)
        set({ currentStep: prev, currentSectionId: mapping.sectionId, currentStepId: mapping.stepId })
      },

      goToStep: (step) => {
        const idx = Math.max(0, Math.min(step, GYG_STEPS.length - 1))
        const mapping = getSectionStep(idx)
        set({ currentStep: idx, currentSectionId: mapping.sectionId, currentStepId: mapping.stepId })
      },

      navigateTo: (sectionId, stepId) => {
        const idx = GYG_STEPS.findIndex(
          (s) => s.sectionId === sectionId && s.stepId === stepId,
        )
        if (idx >= 0) {
          const mapping = getSectionStep(idx)
          set({ currentStep: idx, currentSectionId: mapping.sectionId, currentStepId: mapping.stepId })
        }
      },

      getOverallProgress: () => {
        return Math.round((get().completedStepIds.length / GYG_STEPS.length) * 100)
      },

      setSaving: (val) => set({ isSaving: val }),
      setSubmitting: (val) => set({ isSubmitting: val }),
      setSavedProductId: (id) => set({ savedProductId: id }),

      markSaved: () => set({ isDirty: false, lastSaved: new Date().toISOString() }),
      completeStep: (stepId) =>
        set((s) => ({
          completedStepIds: [...new Set([...s.completedStepIds, stepId])],
        })),

      loadDraft: (data) => {
        const clean = {}
        for (const [key, value] of Object.entries(data)) {
          if (value !== null && value !== undefined) clean[key] = value
        }
        const state = { ...INITIAL_FORM, ...clean }
        const computedCompleted = GYG_STEPS
          .filter((s) => isStepComplete(s.id, state))
          .map((s) => s.stepId)
        set({
          ...state,
          currentStep: 0,
          currentSectionId: 'getting-started',
          currentStepId: 'language',
          completedStepIds: computedCompleted,
          currentScheduleStep: 1,
          editingScheduleIndex: null,
          scheduleName: '',
          scheduleStartDate: '',
          scheduleHasEndDate: false,
          scheduleEndDate: '',
          timeSlots: [],
          weeklySchedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
          dateExceptions: [],
          stepErrors: {},
          isDirty: false,
        })
      },

      setStepErrors: (stepIndex, errors) =>
        set((s) => ({
          stepErrors: { ...s.stepErrors, [stepIndex]: errors },
        })),
      clearStepErrors: (stepIndex) =>
        set((s) => {
          const stepErrors = { ...s.stepErrors }
          delete stepErrors[stepIndex]
          return { stepErrors }
        }),
      clearAllStepErrors: () => set({ stepErrors: {} }),

      reset: () => {
        const mapping = getSectionStep(0)
        set({
          ...INITIAL_FORM,
          currentStep: 0,
          currentSectionId: mapping.sectionId,
          currentStepId: mapping.stepId,
          completedStepIds: [],
          stepErrors: {},
          isDirty: false,
          isSaving: false,
          isSubmitting: false,
          lastSaved: null,
          savedProductId: null,
        })
      },
    }),
    {
      name: 'product-builder-draft',
      version: 2,
      migrate: (persistedState, version) => {
        let state = persistedState
        if (version < 1) {
          state = {
            ...state,
            currentStep: 0,
            currentSectionId: 'getting-started',
            currentStepId: 'language',
            completedStepIds: [],
            stepErrors: {},
          }
        }
        if (version < 2) {
          const { emergencyCountryCode, emergencyPhone, ...rest } = state
          let mergedPhone = ''
          if (emergencyCountryCode || emergencyPhone) {
            const cc = (emergencyCountryCode || '').trim().toUpperCase()
            const pn = (emergencyPhone || '').trim()
            if (cc && /^[A-Z]{2}$/.test(cc)) {
              try {
                const dialCode = getCountryCallingCode(cc)
                const digits = pn.replace(/\D/g, '')
                mergedPhone = digits ? `+${dialCode}${digits}` : ''
              } catch {
                const digits = (cc + pn).replace(/\D/g, '')
                mergedPhone = digits ? `+${digits}` : ''
              }
            } else {
              const digits = (cc + pn).replace(/\D/g, '')
              mergedPhone = digits ? `+${digits}` : ''
            }
          }
          state = {
            ...rest,
            emergencyPhone: mergedPhone,
            currentStep: 0,
            currentSectionId: 'getting-started',
            currentStepId: 'language',
            completedStepIds: [],
            stepErrors: {},
          }
        }
        return state
      },
      partialize: (state) => {
        const rest = { ...state }
        delete rest.isDirty
        delete rest.isSaving
        delete rest.isSubmitting
        delete rest.lastSaved
        delete rest.hasHydrated
        delete rest._pendingFiles
        delete rest._uploadedUrls
        delete rest.stepErrors
        return rest
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true
          if (state.emergencyCountryCode !== undefined) {
            delete state.emergencyCountryCode
          }
          for (const key of Object.keys(INITIAL_FORM)) {
            if (state[key] === undefined) {
              state[key] = INITIAL_FORM[key]
            }
          }
          for (const cat of state.pricingCategories || []) {
            const tiers = cat.tiers || []
            let prevTo = 1
            for (let idx = 0; idx < tiers.length; idx++) {
              const tier = tiers[idx]
              if (idx === 0) {
                if (tier.from !== 1 || (tier.to !== null && tier.from > tier.to)) {
                  tier.from = 1
                }
              } else {
                tier.from = prevTo + 1
              }
              if (tier.to !== null) prevTo = tier.to
            }
          }
          const mapping = getSectionStep(state.currentStep || 0)
          state.currentSectionId = mapping.sectionId
          state.currentStepId = mapping.stepId
        }
      },
    },
  ),
)
