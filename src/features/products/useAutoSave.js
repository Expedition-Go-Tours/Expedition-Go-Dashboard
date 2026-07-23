import { useEffect, useRef } from 'react'
import { useProductBuilderStore } from './productBuilderStore'
import { createProduct, updateProduct } from './api'

function buildPayload(state) {
  function normalizeLocationPoint(loc) {
    if (!loc || typeof loc !== 'object') return null
    if (loc.lat == null || loc.lng == null) return null
    if (!loc.name || !loc.address) return null
    return loc
  }

  const payload = {
    ...state,
    photos: (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || p)),
    existingPhotos: (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || p)),
    meetingPoint: normalizeLocationPoint(state.meetingPoint),
    dropoffLocation: normalizeLocationPoint(state.dropoffLocation),
    options: (state.options || []).filter((o) => o.title && o.languages?.length),
    itinerary: (state.itinerary || [])
      .filter((e) => e.description)
      .map((e) => ({
        ...e,
        type: ['activity', 'transfer'].includes(e.type) ? e.type : 'activity',
        duration: typeof e.duration === 'number' ? e.duration : 1,
        durationUnit: ['minute', 'hour', 'day'].includes(e.durationUnit) ? e.durationUnit : 'hour',
      })),
  }

  const omit = [
    '_pendingFiles', '_hasHydrated', '_version',
    'currentStep', 'currentSectionId', 'currentStepId',
    'completedStepIds', 'isDirty', 'isSaving', 'isSubmitting',
    'hasHydrated', 'lastSaved', 'availableTimeSlots',
    'currentScheduleStep', 'editingScheduleIndex', 'schedules',
    'stepErrors', 'savedProductId',
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
      if (savingRef.current) return
      if (!state.isDirty) return
      if (state.isSaving || state.isSubmitting) return

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
            ? await updateProduct(id, payload)
            : await createProduct(payload)

          const newId = id || res.data?.data?.tour?._id
          if (newId) s.setSavedProductId(newId)
          s.markSaved()
        } catch (err) {
          if (err?.code !== 'ERR_CANCELED' && err?.message !== 'AUTH_REQUIRED') {
            console.warn('[AutoSave] Failed:', err.message)
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
