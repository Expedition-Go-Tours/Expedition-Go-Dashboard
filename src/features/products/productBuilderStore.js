import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeId } from '@/lib/utils'
import { GYG_STEPS } from './gygSteps'

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
  highlights: [],
  locations: [],
  attractions: [],
  keywords: [],
  activitiesIncluded: [],
  pickupTransportTypes: [],
  whatsIncluded: [],
  whatsNotIncluded: [],
  guideType: 'tour-guide',
  guideMaterials: { audioGuide: false, infoBooklet: false },
  foodProvided: false,
  mealType: '',
  drinksIncluded: false,
  dietaryOptions: [],
  transportationProvided: false,
  transportationType: '',
  notSuitableFor: [],
  notAllowed: [],
  petFriendly: false,
  mandatoryItems: [],
  knowBeforeYouGo: '',
  emergencyCountryCode: '',
  emergencyPhone: '',
  voucherInfo: '',
  photos: [],
  _pendingFiles: {},
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
  dropoffOption: 'none',
  dropoffLocation: null,
  dropoffDescription: '',
  pricingModel: 'perPerson',
  currency: '',
  scheduleType: 'fixedTimeSlot',
  scheduleName: '',
  scheduleStartDate: '',
  scheduleHasEndDate: false,
  scheduleEndDate: '',
  timeSlots: [],
  operatingHoursStart: '09:00',
  operatingHoursEnd: '17:00',
  dateExceptions: [],
  pricingApproach: 'dependsOnAge',
  uniformPrice: null,
  ageGroups: [{ name: 'Adult', price: null, minAge: 13, maxAge: 99, notAllowed: false, ticketNotRequired: false, needsAdult: false }],
  minParticipants: 1,
  maxParticipants: 10,
  pricingTiers: [],
  groupSizes: [],
  additionalPersonsEnabled: false,
  additionalPersonPrice: null,
  maxGroupsPerTimeSlot: 1,
  itinerary: [],
  cutoffHours: 0,
  primaryTheme: '',
  secondaryThemes: [],
  metaTitle: '',
  metaDescription: '',
}

export const useProductBuilderStore = create(
  persist(
    (set, get) => ({
      ...INITIAL_FORM,

      currentStep: 0,
      currentSectionId: 'getting-started',
      currentStepId: 'language',
      completedStepIds: [],

      isDirty: false,
      isSaving: false,
      isSubmitting: false,
      lastSaved: null,
      hasHydrated: false,

      setHasHydrated: (val) => set({ hasHydrated: val }),

      setField: (key, value) => set({ [key]: value, isDirty: true }),

      addHighlight: (item) =>
        set((s) => ({ highlights: [...s.highlights, item], isDirty: true })),
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
          const { [id]: _, ...rest } = s._pendingFiles
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
          const { [photo.id]: _, ...rest } = s._pendingFiles
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

      addOption: () =>
        set((s) => ({
          options: [
            ...s.options,
            {
              id: safeId(),
              title: '',
              refCode: '',
              description: '',
              languages: [],
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

      addItineraryEntry: () =>
        set((s) => {
          const maxDay = s.itinerary.reduce((max, e) => Math.max(max, e.day), 0)
          return {
            itinerary: [
              ...s.itinerary,
              { day: maxDay + 1, time: '09:00', duration: 1, durationUnit: 'hour', title: '', description: '', type: 'activity', locationName: '', locationAddress: '', locationLat: null, locationLng: null, isCustomLocation: false },
            ],
            isDirty: true,
          }
        }),

      addItinerarySegment: (dayNumber) =>
        set((s) => ({
          itinerary: [
            ...s.itinerary,
            { day: dayNumber, time: '09:00', duration: 1, durationUnit: 'hour', title: '', description: '', type: 'activity', locationName: '', locationAddress: '', locationLat: null, locationLng: null, isCustomLocation: false },
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

      addAgeGroup: () =>
        set((s) => ({
          ageGroups: [...s.ageGroups, { name: '', price: null, minAge: 1, maxAge: 99, notAllowed: false, ticketNotRequired: false, needsAdult: false }],
          isDirty: true,
        })),
      updateAgeGroup: (index, updates) =>
        set((s) => ({
          ageGroups: s.ageGroups.map((g, i) => (i === index ? { ...g, ...updates } : g)),
          isDirty: true,
        })),
      removeAgeGroup: (index) =>
        set((s) => ({
          ageGroups: s.ageGroups.filter((_, i) => i !== index),
          isDirty: true,
        })),

      addPricingTier: () =>
        set((s) => ({
          pricingTiers: [...s.pricingTiers, { id: safeId(), from: null, to: null, pricePerPerson: null }],
          isDirty: true,
        })),
      updatePricingTier: (index, updates) =>
        set((s) => ({
          pricingTiers: s.pricingTiers.map((t, i) => (i === index ? { ...t, ...updates } : t)),
          isDirty: true,
        })),
      removePricingTier: (index) =>
        set((s) => ({
          pricingTiers: s.pricingTiers.filter((_, i) => i !== index),
          isDirty: true,
        })),

      addGroupSize: () =>
        set((s) => ({
          groupSizes: [...s.groupSizes, { id: safeId(), size: null, price: null }],
          isDirty: true,
        })),
      updateGroupSize: (index, updates) =>
        set((s) => ({
          groupSizes: s.groupSizes.map((g, i) => (i === index ? { ...g, ...updates } : g)),
          isDirty: true,
        })),
      removeGroupSize: (index) =>
        set((s) => ({
          groupSizes: s.groupSizes.filter((_, i) => i !== index),
          isDirty: true,
        })),

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

      addPickupArea: (name) =>
        set((s) => ({
          pickupAreas: [...s.pickupAreas, { name, time: '' }],
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
        const next = Math.min(currentStep + 1, 12)
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
        const idx = Math.max(0, Math.min(step, 12))
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
        return Math.round((get().completedStepIds.length / 13) * 100)
      },

      setSaving: (val) => set({ isSaving: val }),
      setSubmitting: (val) => set({ isSubmitting: val }),

      markSaved: () => set({ isDirty: false, lastSaved: new Date().toISOString() }),

      loadDraft: (data) => {
        set((s) => ({
          ...INITIAL_FORM,
          ...data,
          currentStep: s.currentStep,
          currentSectionId: s.currentSectionId,
          currentStepId: s.currentStepId,
          completedStepIds: s.completedStepIds,
          isDirty: false,
        }))
      },

      reset: () => {
        const mapping = getSectionStep(0)
        set({
          ...INITIAL_FORM,
          currentStep: 0,
          currentSectionId: mapping.sectionId,
          currentStepId: mapping.stepId,
          completedStepIds: [],
          isDirty: false,
          isSaving: false,
          isSubmitting: false,
          lastSaved: null,
        })
      },
    }),
    {
      name: 'product-builder-draft',
      partialize: (state) => {
        const { isDirty, isSaving, isSubmitting, lastSaved, hasHydrated, _pendingFiles, ...rest } = state
        return rest
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true
          for (const key of Object.keys(INITIAL_FORM)) {
            if (state[key] === undefined) {
              state[key] = INITIAL_FORM[key]
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
