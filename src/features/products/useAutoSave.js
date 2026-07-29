    import { useEffect, useRef } from 'react'
import { useProductBuilderStore } from './productBuilderStore'
import { createProduct, updateProduct } from './api'

function normalizeLocationPoint(loc) {
  if (!loc || typeof loc !== 'object') return null
  if (loc.lat == null || loc.lng == null) return null
  if (!loc.name || !loc.address) return null
  return loc
}

function buildSchedulesAndPricing(state) {
  const schedules = Array.isArray(state.schedules) ? state.schedules : []
  const topCats = Array.isArray(state.pricingCategories) ? state.pricingCategories : []
  const topAgeGroups = topCats.map(c => ({ label: c.name, minAge: c.minAge, maxAge: c.maxAge }))
  const weekly = state.weeklySchedule || {}
  const activeDays = Object.entries(weekly)
    .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
    .map(([day]) => day)
  return {
    travelerDetails: {
      pricingModel: state.pricingModel || 'perPerson',
      pricingApproach: state.pricingApproach || 'dependsOnAge',
      uniformPrice: state.uniformPrice ?? null,
      pricingCategories: topCats,
      ageGroups: topAgeGroups,
      minParticipants: state.minParticipants ?? null,
      maxParticipants: state.maxParticipants ?? null,
      groupSizes: Array.isArray(state.groupSizes) ? state.groupSizes : [],
      additionalPersonsEnabled: !!state.additionalPersonsEnabled,
      additionalPersonPrice: state.additionalPersonPrice ?? null,
      maxGroupsPerTimeSlot: state.maxGroupsPerTimeSlot ?? 1,
    },
    pricingSchedules: {
      currency: state.currency || 'USD',
      schedules: schedules.length > 0
        ? schedules.map(s => {
            const cat = Array.isArray(s.pricingCategories) && s.pricingCategories.length > 0
              ? s.pricingCategories
              : topCats
            return {
              name: s.name || '',
              type: s.type || state.scheduleType || 'fixedTimeSlot',
              startDate: s.startDate || '',
              hasEndDate: !!s.hasEndDate,
              endDate: s.hasEndDate ? (s.endDate || '') : null,
              weeklySchedule: s.weeklySchedule || state.weeklySchedule || null,
              dateExceptions: Array.isArray(s.dateExceptions) ? s.dateExceptions : [],
              timeSlots: Array.isArray(s.timeSlots) ? s.timeSlots : [],
              pricingModel: s.pricingModel || state.pricingModel || 'perPerson',
              currency: s.currency || state.currency || 'USD',
              pricingApproach: s.pricingApproach || state.pricingApproach || 'dependsOnAge',
              uniformPrice: s.uniformPrice ?? state.uniformPrice ?? null,
              pricingCategories: cat,
              prices: cat.filter(c => c.price != null).map(c => ({ ageGroup: c.name, retailPrice: c.price })),
              minParticipants: s.minParticipants ?? state.minParticipants ?? null,
              maxParticipants: s.maxParticipants ?? state.maxParticipants ?? null,
            }
          })
        : [],
    },
    availability: {
      scheduleType: state.scheduleType || 'fixedTimeSlot',
      operatingHoursStart: state.operatingHoursStart || '09:00',
      operatingHoursEnd: state.operatingHoursEnd || '17:00',
      weeklySchedule: state.weeklySchedule || null,
      timeSlots: Array.isArray(state.timeSlots) ? state.timeSlots.map(t => typeof t === 'string' ? t : t.startTime) : [],
      daysOfWeek: activeDays,
      startDate: schedules.length > 0 ? (schedules[0].startDate || '') : '',
      endDate: schedules.length > 0 && schedules[0].hasEndDate ? (schedules[0].endDate || null) : null,
    },
  }
}

export function buildPayload(state) {
  const outgoingPhotos = (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || '')).filter(Boolean)

  const payload = {
    ...state,
    highlights: (state.highlights || []).filter(Boolean),
    photos: outgoingPhotos,
    ...(outgoingPhotos.length > 0 ? { existingPhotos: outgoingPhotos } : {}),
    meetingPoint: normalizeLocationPoint(state.meetingPoint),
    dropoffLocation: normalizeLocationPoint(state.dropoffLocation),
    options: (state.options || []),
    itinerary: (state.itinerary || [])
      .map((e) => ({
        ...e,
        type: ['activity', 'transfer'].includes(e.type) ? e.type : 'activity',
        duration: typeof e.duration === 'number' ? e.duration : 1,
        durationUnit: ['minute', 'hour', 'day'].includes(e.durationUnit) ? e.durationUnit : 'hour',
      })),
    schedulesAndPricing: buildSchedulesAndPricing(state),
  }

  const omit = [
    '_pendingFiles', '_hasHydrated', '_version', '_uploadedUrls',
    'currentStep', 'currentSectionId', 'currentStepId',
    'completedStepIds', 'isDirty', 'isSaving', 'isSubmitting',
    'hasHydrated', 'lastSaved', 'availableTimeSlots',
    'currentScheduleStep', 'editingScheduleIndex',
    'stepErrors', 'savedProductId',
    'showAdvancedCategorySettings',
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
        } catch (err) {
          const status = err?.response?.status
          if (status >= 400 && status < 500) {
            useProductBuilderStore.getState().markSaved()
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
