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
    highlights: (state.highlights || []).filter(Boolean),
    photos: (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || '')).filter(Boolean),
    existingPhotos: (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || '')).filter(Boolean),
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

export { buildPayload }

export function useAutoSave() {
  const timerRef = useRef(null)
  const savingRef = useRef(false)

  useEffect(() => {
    const unsub = useProductBuilderStore.subscribe((state) => {
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
            // Validation — stop retrying, inline errors shown in WizardNavFooter
            useProductBuilderStore.getState().markSaved()
          } else if (err?.code !== 'ERR_CANCELED' && err?.message !== 'AUTH_REQUIRED') {
            // Server/network error — keep isDirty so we retry on next change
            console.warn('[AutoSave] Save failed, will retry:', err.message)
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
