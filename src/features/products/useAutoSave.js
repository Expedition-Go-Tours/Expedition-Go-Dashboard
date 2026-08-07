import { useEffect, useRef } from 'react'
import { useProductBuilderStore } from './productBuilderStore'
import { createProduct, updateProduct } from './api'
import {
  effectiveOptionData,
  primaryOptionData,
  pricingBuffersFrom,
  availabilityBuffersFrom,
  cutoffBuffersFrom,
} from './optionData'
import { hasAnyWeeklyHours } from './utils/pricingValidation'

function normalizeLocationPoint(loc) {
  if (!loc || typeof loc !== 'object') return null
  if (loc.lat == null || loc.lng == null) return null
  if (!loc.name || !loc.address) return null
  return loc
}

function buildSchedulesAndPricing(state) {
  const { pricing, availability } = primaryOptionData(state)
  const schedules = Array.isArray(availability.schedules) ? availability.schedules : []
  const topCats = Array.isArray(pricing.pricingCategories) ? pricing.pricingCategories : []
  const topAgeGroups = topCats.map(c => ({ label: c.name, minAge: c.minAge, maxAge: c.maxAge }))
  const weekly = hasAnyWeeklyHours(availability.weeklySchedule)
    ? availability.weeklySchedule
    : (hasAnyWeeklyHours(schedules[0]?.weeklySchedule) ? schedules[0].weeklySchedule : (availability.weeklySchedule || {}))
  const activeDays = Object.entries(weekly)
    .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
    .map(([day]) => day)
  return {
    travelerDetails: {
      pricingModel: pricing.pricingModel || 'perPerson',
      pricingApproach: pricing.pricingApproach || 'dependsOnAge',
      uniformPrice: pricing.uniformPrice ?? null,
      pricingCategories: topCats,
      ageGroups: topAgeGroups,
      minParticipants: pricing.minParticipants ?? null,
      maxParticipants: pricing.maxParticipants ?? null,
      groupSizes: Array.isArray(pricing.groupSizes) ? pricing.groupSizes : [],
      additionalPersonsEnabled: !!pricing.additionalPersonsEnabled,
      additionalPersonPrice: pricing.additionalPersonPrice ?? null,
      maxGroupsPerTimeSlot: pricing.maxGroupsPerTimeSlot ?? 1,
    },
    pricingSchedules: {
      currency: pricing.currency || 'USD',
      schedules: schedules.length > 0
        ? schedules.map((s, idx) => {
            const cat = Array.isArray(s.pricingCategories) && s.pricingCategories.length > 0
              ? s.pricingCategories
              : topCats
            // The top-level `weeklySchedule` buffer is the primary schedule's
            // source of truth (the wizard edits it). For single-schedule tours
            // the primary schedule mirrors the aggregate; mirror `weekly` into
            // schedule[0] so aggregate and schedules[0] can never drift (e.g. a
            // deliberate "clear all hours" propagates instead of being
            // resurrected from a stale per-schedule buffer on next load).
            // For multi-schedule tours where a non-primary schedule has its own
            // hours, keep each schedule's own data and only fall back to the
            // aggregate when the schedule's data is absent.
            const scheduleHasHours = hasAnyWeeklyHours(s.weeklySchedule)
            const aggregateHasHours = hasAnyWeeklyHours(weekly)
            const weeklySchedule = idx === 0 && (schedules.length === 1 || !scheduleHasHours)
              ? (aggregateHasHours ? weekly : null)
              : (s.weeklySchedule || weekly || null)
            return {
              name: s.name || '',
              type: s.type || availability.scheduleType || 'fixedTimeSlot',
              startDate: s.startDate || '',
              hasEndDate: !!s.hasEndDate,
              endDate: s.hasEndDate ? (s.endDate || '') : null,
              weeklySchedule,
              dateExceptions: Array.isArray(s.dateExceptions) ? s.dateExceptions : [],
              timeSlots: Array.isArray(s.timeSlots) ? s.timeSlots : [],
              pricingModel: s.pricingModel || pricing.pricingModel || 'perPerson',
              currency: s.currency || pricing.currency || 'USD',
              pricingApproach: s.pricingApproach || pricing.pricingApproach || 'dependsOnAge',
              uniformPrice: s.uniformPrice ?? pricing.uniformPrice ?? null,
              pricingCategories: cat,
              prices: cat.filter(c => c.price != null).map(c => ({ ageGroup: c.name, retailPrice: c.price })),
              minParticipants: s.minParticipants ?? pricing.minParticipants ?? null,
              maxParticipants: s.maxParticipants ?? pricing.maxParticipants ?? null,
            }
          })
        : [],
    },
    availability: {
      scheduleType: availability.scheduleType || 'operatingHours',
      operatingHoursStart: availability.operatingHoursStart || '09:00',
      operatingHoursEnd: availability.operatingHoursEnd || '17:00',
      weeklySchedule: weekly || null,
      timeSlots: (Array.isArray(availability.timeSlots) && availability.timeSlots.length > 0
        ? availability.timeSlots
        : (Array.isArray(schedules[0]?.timeSlots) ? schedules[0].timeSlots : [])
      ).map(t => typeof t === 'string' ? t : t.startTime),
      daysOfWeek: activeDays,
      startDate: schedules.length > 0 ? (schedules[0].startDate || '') : '',
      endDate: schedules.length > 0 && schedules[0].hasEndDate ? (schedules[0].endDate || null) : null,
      timezone: availability.timezone || 'UTC',
    },
  }
}

export function buildPayload(state) {

  const outgoingPhotos = (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || '')).filter(Boolean)

  const options = Array.isArray(state.options) ? state.options : []
  const optionPayload = options.map((o) => {
    const { pricing, availability, cutoff } = effectiveOptionData(state, o)
    return { ...o, pricing, availability, cutoff }
  })

  // The first option is the product's primary / default option, so the legacy
  // top-level pricing & availability fields mirror its effective data. This
  // keeps the flat shape consistent with schedulesAndPricing below.
  const primary = primaryOptionData(state)
  const topLevelOverrides = options.length > 0
    ? {
        ...pricingBuffersFrom(primary.pricing),
        ...availabilityBuffersFrom(primary.availability),
        ...cutoffBuffersFrom(primary.cutoff),
      }
    : {}

  const payload = {
    ...state,
    ...topLevelOverrides,
    description: state.fullDescription || '',
    shortSummary: state.shortDescription || '',
    highlights: (state.highlights || []).filter(Boolean),
    photos: outgoingPhotos,
    ...(outgoingPhotos.length > 0 ? { existingPhotos: outgoingPhotos } : {}),
    meetingPoint: normalizeLocationPoint(state.meetingPoint),
    dropoffLocation: normalizeLocationPoint(state.dropoffLocation),
    options: optionPayload,
    schedulesAndPricing: buildSchedulesAndPricing(state),
  }

  const omit = [
    '_pendingFiles', '_hasHydrated', '_version', '_uploadedUrls',
    'currentStep', 'currentSectionId', 'currentStepId',
    'completedStepIds', 'isDirty', 'isSaving', 'isSubmitting',
    'hasHydrated', 'lastSaved', 'autosaveError', 'availableTimeSlots',
    'currentScheduleStep', 'editingScheduleIndex',
    'stepErrors', 'savedProductId',
    'previewFocus',
    'showAdvancedCategorySettings',
    'selectedOptionId', 'pricingTemplate', 'availabilityTemplate', 'cutoffTemplate',
    'itinerary', 'itineraryOverview', 'additionalItineraryInfo', 'dayTitles',
  ]
  for (const key of omit) delete payload[key]
  if (!payload.copyrightConfirmed) delete payload.copyrightConfirmed

  return payload
}

export function useAutoSave() {
  const timerRef = useRef(null)
  const savingRef = useRef(false)

  useEffect(() => {
    const unsub = useProductBuilderStore.subscribe((state) => {
      if (!state.hasHydrated) return
      if (state.draftStatus === 'PENDING_APPROVAL') return
      if (savingRef.current) return
      if (!state.isDirty) return
      if (state.isSaving || state.isSubmitting) return
      const stepNum = state.currentStep + 1
      if (state.stepErrors?.[stepNum] && Object.keys(state.stepErrors[stepNum]).length > 0) return

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        if (savingRef.current) return
        savingRef.current = true

        const s = useProductBuilderStore.getState()
        s.setSaving(true)

        try {
          const payload = buildPayload(s)
          const id = s.savedProductId
          const res = id
            ? await updateProduct(id, payload, { skipGlobalErrorHandler: true })
            : await createProduct(payload, { skipGlobalErrorHandler: true })

          const newId = id || res.data?.data?.tour?.id
          if (newId) s.setSavedProductId(newId)
          s.markSaved()
          s.setAutosaveError(null)
        } catch (err) {
          const status = err?.response?.status
          const message = err?.response?.data?.message || err?.message || 'Autosave failed'
          if (status === 409) {
            const store = useProductBuilderStore.getState()
            store.setDraftStatus('PENDING_APPROVAL')
            store.setAutosaveError(message)
          } else if (status >= 400 && status < 500) {
            useProductBuilderStore.getState().markSaved()
            useProductBuilderStore.getState().setAutosaveError(message)
          } else {
            useProductBuilderStore.getState().setAutosaveError(message)
          }
        } finally {
          savingRef.current = false
          const current = useProductBuilderStore.getState()
          if (current.isSaving) current.setSaving(false)
        }
      }, 3000)
    })

    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
}
