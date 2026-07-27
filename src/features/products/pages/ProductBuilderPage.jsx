import { useParams, useSearchParams, useNavigate, useBlocker } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Loader2, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { getMyProduct, createProduct, updateProduct, cleanupMediaUrls } from '@/features/products/api'
import { useAutoSave } from '@/features/products/useAutoSave'
import { GYG_STEPS, GYG_SECTIONS } from '@/features/products/gygSteps'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import WizardSidebar from '@/features/products/WizardSidebar'
import WizardNavFooter from '@/features/products/WizardNavFooter'
import Step01Language from '@/features/products/steps/Step01Language'
import Step02Category from '@/features/products/steps/Step02Category'
import Step03Title from '@/features/products/steps/Step03Title'
import Step04Descriptions from '@/features/products/steps/Step04Descriptions'
import Step05Locations from '@/features/products/steps/Step05Locations'
import Step06Keywords from '@/features/products/steps/Step06Keywords'
import Step07Inclusions from '@/features/products/steps/Step07Inclusions'
import Step08Transportation from '@/features/products/steps/Step08Transportation'
import Step09GuideInfo from '@/features/products/steps/Step09GuideInfo'
import Step10Photos from '@/features/products/steps/Step10Photos'
import Step11ExtraInfo from '@/features/products/steps/Step11ExtraInfo'
import Step12Options from '@/features/products/steps/Step12Options'
import Step13MeetingPoint from '@/features/products/steps/Step13MeetingPoint'
import Step14PricingAvailability from '@/features/products/steps/Step14PricingAvailability'
import Step15Cutoff from '@/features/products/steps/Step15Cutoff'
import Step16Itinerary from '@/features/products/steps/Step16Itinerary'
import { safeId } from '@/lib/utils'

const STEP_COMPONENTS = {
  1: Step01Language,
  2: Step03Title,
  3: Step02Category,
  4: Step04Descriptions,
  5: Step05Locations,
  6: Step06Keywords,
  7: Step07Inclusions,
  8: Step08Transportation,
  9: Step09GuideInfo,
  10: Step10Photos,
  11: Step11ExtraInfo,
  12: Step12Options,
  13: Step13MeetingPoint,
  14: Step14PricingAvailability,
  15: Step15Cutoff,
  16: Step16Itinerary,
}

const STEP_LABELS = {
  1: 'Language',
  2: 'Title & Reference Code',
  3: 'Product Category',
  4: 'Descriptions & highlights',
  5: 'Locations',
  6: 'Keywords',
  7: 'Inclusions',
  8: 'Transportation',
  9: 'Guide information',
  10: 'Photos',
  11: 'Extra information',
  12: 'Options',
  13: 'Meeting Point or Pickup',
  14: 'Pricing & Availability',
  15: 'Cut-off',
  16: 'Itinerary',
}

function getGygStepIndex(sectionId, stepId) {
  const idx = GYG_STEPS.findIndex((s) => s.sectionId === sectionId && s.stepId === stepId)
  return idx >= 0 ? idx : 0
}

function tourToProduct(tour) {
  if (!tour) return null
  const content = tour.productContent || {}
  const categorization = tour.categorization || {}
  const booking = tour.bookingAndTickets || {}
  const meetingPoint = booking.meetingPoint || {}
  const sp = tour.schedulesAndPricing || {}
  const td = sp.travelerDetails || {}
  const ps = sp.pricingSchedules || {}
  const schedule = Array.isArray(ps.schedules) && ps.schedules.length > 0 ? ps.schedules[0] : {}
  const avail = sp.availability || {}
  const theme = tour.theme || {}

  return {
    language: content.writingLanguage || '',
    category: categorization.category || '',
    subcategory: categorization.subcategory || '',
    activityType: categorization.activityType || '',
    difficulty: categorization.difficulty || '',
    transportMode: categorization.transportMode || '',
    duration: categorization.duration?.value ?? categorization.duration?.hours ?? null,
    durationUnit: categorization.duration?.unit || 'hours',
    title: tour.title || '',
    referenceCode: tour.referenceCode || '',
    shortDescription: content.shortSummary || '',
    fullDescription: tour.description || '',
    highlights: Array.isArray(content.highlights) ? content.highlights : [],
    locations: content.locations || [],
    attractions: content.attractions || [],
    keywords: tour.tags || [],
    activitiesIncluded: content.activitiesIncluded || [],
    transportModes: content.transportModes || [],
    transportServices: content.transportServices || [],
    pickupTransportTypes: content.pickupTransportTypes || [],
    whatsIncluded: content.included || [],
    whatsNotIncluded: content.excluded || [],
    guideType: (content.guideType === 'greeter' ? 'host' : content.guideType) || 'tour-guide',
    guideMaterials: content.guideMaterials || { audioGuide: false, infoBooklet: false },
    foodProvided: !!content.foodProvided,
    meals: Array.isArray(content.meals) ? content.meals :
      (content.mealType ? [{ type: content.mealType, format: '' }] : []),
    drinksIncluded: !!content.drinksIncluded,
    showDietaryRestrictions: !!content.showDietaryRestrictions,
    dietaryOptions: content.dietaryOptions || [],
    transportationProvided: !!content.transportationProvided,
    transportationType: content.transportationType || '',
    crossCityTravel: !!content.crossCityTravel,
    cutoffMinutes: booking.cutoffMinutes ?? 20,
    lastMinuteBookings: !!booking.lastMinuteBookings,
    perSlotCutoff: !!booking.perSlotCutoff,
    notSuitableFor: content.healthRestrictions || [],
    notAllowed: content.notAllowed || [],
    petFriendly: !!content.petFriendly,
    mandatoryItems: content.whatToBring || [],
    knowBeforeYouGo: content.additionalInfo || '',
    emergencyCountryCode: content.emergencyCountryCode || '',
    emergencyPhone: content.emergencyPhone || '',
    voucherInfo: content.voucherInfo || '',
    photos: (tour.photos || []).map((p) => {
      const url = typeof p === 'string' ? p : p.url || '';
      return { id: safeId(), url };
    }),
    copyrightConfirmed: !!content.copyrightConfirmed,
    coverPhoto: tour.coverPhoto || '',
    options: content.options || [],
    meetingMode: content.meetingMode || 'meeting_point',
    meetingPoint: meetingPoint.lat
      ? {
          name: meetingPoint.name || '',
          address: meetingPoint.address || '',
          lat: meetingPoint.lat,
          lng: meetingPoint.lng,
        }
      : null,
    meetingPointPicture: content.meetingPointPicture || '',
    meetingPointDescription: content.meetingInstructions || '',
    arrivalTimeType: content.arrivalTimeType || 'none',
    arrivalTimeCustom: content.arrivalTimeCustom || '',
    pickupType: content.pickupType || 'area',
    pickupDescription: content.pickupDescription || '',
    pickupTiming: content.pickupTiming || 'at_start',
    pickupFinalLocationTiming: content.pickupFinalLocationTiming || 'day_before',
    referenceStartTime: content.referenceStartTime || '',
    pickupAreas: (content.pickupAreas || []).map((a) =>
      typeof a === 'string' ? { name: a, time: '' } : a,
    ),
    pickupLocations: content.pickupLocations || [],
    pickupGeoshape: content.pickupGeoshape || null,
    planPickupTimes: !!content.planPickupTimes,
    pickupStartTime: content.pickupStartTime || '08:00',
    dropoffOption: content.dropoffOption || 'none',
    dropoffLocation: content.dropoffLocation || null,
    dropoffDescription: content.dropoffDescription || '',
    cutoffHours: booking.cancellationPolicy?.cutoffHours ?? 0,
    itinerary: Array.isArray(content.itinerary) ? content.itinerary : [],
    itineraryOverview: content.itineraryOverview || tour.itineraryOverview || '',
    additionalItineraryInfo: content.additionalItineraryInfo || tour.additionalItineraryInfo || '',
    dayTitles: content.dayTitles || tour.dayTitles || {},
    pricingModel: td.pricingModel || 'perPerson',
    pricingApproach: td.pricingApproach || 'dependsOnAge',
    uniformPrice: td.uniformPrice ?? (td.pricingApproach === 'sameForEveryone'
      ? ((Array.isArray(td.pricingCategories) && td.pricingCategories[0]?.price != null) || (Array.isArray(td.ageGroups) && td.ageGroups[0]?.price != null) ? (td.pricingCategories || td.ageGroups)[0].price : null)
      : null),
    pricingCategories: (Array.isArray(td.pricingCategories) && td.pricingCategories.length > 0)
      ? td.pricingCategories.map((c) => ({ ...c, tiers: c.tiers || [] }))
      : (Array.isArray(td.ageGroups) && td.ageGroups.length > 0)
        ? td.ageGroups.map((c) => ({ ...c, tiers: [] }))
        : [{ name: 'Adult', price: null, minAge: 13, maxAge: 99, notAllowed: false, ticketNotRequired: false, needsAdult: false, idRequired: false, idType: '', tiers: [] }],
    minParticipants: td.minParticipants ?? 1,
    maxParticipants: td.maxParticipants ?? 10,
    groupSizes: Array.isArray(td.groupSizes) ? td.groupSizes : [],
    additionalPersonsEnabled: !!td.additionalPersonsEnabled,
    additionalPersonPrice: td.additionalPersonPrice ?? null,
    maxGroupsPerTimeSlot: td.maxGroupsPerTimeSlot ?? 1,
    currency: ps.currency || 'USD',
    scheduleType: avail.scheduleType || 'fixedTimeSlot',
    weeklySchedule: avail.weeklySchedule || { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
    scheduleName: schedule.name || '',
    scheduleStartDate: schedule.startDate || '',
    scheduleHasEndDate: !!schedule.hasEndDate,
    scheduleEndDate: schedule.hasEndDate ? (schedule.endDate || '') : '',
    timeSlots: Array.isArray(schedule.timeSlots) ? schedule.timeSlots : [],
    operatingHoursStart: avail.operatingHoursStart || '09:00',
    operatingHoursEnd: avail.operatingHoursEnd || '17:00',
    dateExceptions: Array.isArray(schedule.dateExceptions) ? schedule.dateExceptions : [],
    metaTitle: tour.metaTitle || '',
    metaDescription: tour.metaDescription || '',
  }
}

export default function ProductBuilderPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const store = useProductBuilderStore()
  const {
    currentStep,
    hasHydrated,
    completedStepIds,
    isDirty,
    isSubmitting,
    navigateTo,
    loadDraft,
    reset,
  } = store

  const contentRef = useRef(null)

  const [loadingProduct, setLoadingProduct] = useState(false)
  const [productError, setProductError] = useState(null)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [stepDirection, setStepDirection] = useState(1)

  const gygStepNumber = currentStep + 1
  const StepComponent = STEP_COMPONENTS[gygStepNumber]

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname,
      [isDirty, isSubmitting],
    ),
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitWarning(true)
    }
  }, [blocker.state])

  const handleConfirmExit = () => {
    const urls = useProductBuilderStore.getState()._uploadedUrls
    if (urls.length > 0) cleanupMediaUrls(urls)
    useProductBuilderStore.getState().clearUploadedUrls()
    setShowExitWarning(false)
    blocker.proceed?.()
  }

  const handleCancelExit = () => {
    setShowExitWarning(false)
    blocker.reset?.()
  }

  useEffect(() => {
    if (!isDirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const querySection = searchParams.get('section') || ''
  const queryStep = searchParams.get('step') || ''

  useEffect(() => {
    if (!hasHydrated) return
    if (querySection && queryStep) {
      const idx = getGygStepIndex(querySection, queryStep)
      if (idx !== currentStep) {
        navigateTo(querySection, queryStep)
      }
    }
  }, [querySection, queryStep, hasHydrated])

  useEffect(() => {
    if (!hasHydrated) return
    const gygStep = GYG_STEPS[currentStep]
    if (!gygStep) return
    const section = gygStep.sectionId
    const step = gygStep.stepId
    if (section !== querySection || step !== queryStep) {
      setSearchParams({ section, step }, { replace: true })
    }
  }, [currentStep, hasHydrated])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const [showResumePrompt, setShowResumePrompt] = useState(false)

  useEffect(() => {
    if (id !== 'new' || !hasHydrated) return
    if (sessionStorage.getItem('pb-draft-discarded') === 'true') {
      reset()
      return
    }
    try {
      const raw = localStorage.getItem('product-builder-draft')
      if (raw) {
        const parsed = JSON.parse(raw)
        const hasData = Object.keys(parsed).some(
          (k) => !['hasHydrated', 'currentStep', 'currentSectionId', 'currentStepId', 'completedStepIds', 'stepErrors', 'savedProductId'].includes(k)
            && parsed[k] != null && parsed[k] !== '' && (!Array.isArray(parsed[k]) || parsed[k].length > 0)
        )
        if (hasData) {
          setShowResumePrompt(true)
          return
        }
      }
    } catch {}
    reset()
  }, [id, hasHydrated])

  function handleResumeDraft() {
    setShowResumePrompt(false)
  }

  function handleDiscardDraft() {
    const urls = useProductBuilderStore.getState()._uploadedUrls
    if (urls.length > 0) cleanupMediaUrls(urls)
    useProductBuilderStore.getState().clearUploadedUrls()
    sessionStorage.setItem('pb-draft-discarded', 'true')
    setShowResumePrompt(false)
    reset()
  }

  useEffect(() => {
    if (!id || id === 'new' || !hasHydrated) return

    let cancelled = false
    setLoadingProduct(true)
    setProductError(null)

    getMyProduct(id)
      .then((res) => {
        if (cancelled) return
        const tour = res.data?.data?.tour
        if (!tour) {
          setProductError('Product not found')
          return
        }
        const product = tourToProduct(tour)
        loadDraft(product)
      })
      .catch((err) => {
        if (cancelled) return
        setProductError(err.response?.data?.message || err.message || 'Failed to load product')
      })
      .finally(() => {
        if (!cancelled) setLoadingProduct(false)
      })

    return () => { cancelled = true }
  }, [id, hasHydrated])

  useEffect(() => {
    return () => {
      const urls = useProductBuilderStore.getState()._uploadedUrls
      if (urls.length > 0) {
        cleanupMediaUrls(urls)
        useProductBuilderStore.getState().clearUploadedUrls()
      }
    }
  }, [])

  const [saving, setSaving] = useState(false)
  const savedProductId = useProductBuilderStore((s) => s.savedProductId)
  const setStoreSavedProductId = useProductBuilderStore((s) => s.setSavedProductId)

  useAutoSave()

  function normalizeLocationPoint(loc) {
    if (!loc || typeof loc !== 'object') return null
    if (loc.lat == null || loc.lng == null) return null
    if (!loc.name || !loc.address) return null
    return loc
  }

  async function handleSave() {
    const state = useProductBuilderStore.getState()

    const payload = {
      ...state,
      highlights: (state.highlights || []).filter(Boolean),
      photos: (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || '')).filter(Boolean),
      existingPhotos: (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || '')).filter(Boolean),
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

    delete payload._pendingFiles
    delete payload._hasHydrated
    delete payload._version
    delete payload.currentStep
    delete payload.currentSectionId
    delete payload.currentStepId
    delete payload.completedStepIds
    delete payload.isDirty
    delete payload.isSaving
    delete payload.isSubmitting
    delete payload.hasHydrated
    delete payload.lastSaved
    delete payload.availableTimeSlots
    delete payload.currentScheduleStep
    delete payload.editingScheduleIndex
    delete payload.stepErrors
    delete payload.savedProductId
    delete payload.showAdvancedCategorySettings

    if (!payload.copyrightConfirmed) delete payload.copyrightConfirmed

    state.setSaving(true)
    setSaving(true)
    try {
      const res = savedProductId
        ? await updateProduct(savedProductId, payload)
        : await createProduct(payload)
      const newId = savedProductId || res.data?.data?.tour?.id
      if (newId) setStoreSavedProductId(newId)
      state.markSaved()
      state.clearUploadedUrls()
      if (gygStepNumber === 16) {
        useProductBuilderStore.getState().completeStep('itinerary')
        navigate('/products')
      }
      return res
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save product')
      throw err
    } finally {
      state.setSaving(false)
      setSaving(false)
    }
  }

  function handleNext() {
    if (gygStepNumber < 16) {
      setStepDirection(1)
      const storeState = useProductBuilderStore.getState()
      storeState.nextStep()
    }
  }

  function handleBack() {
    if (gygStepNumber > 1) {
      setStepDirection(-1)
      const storeState = useProductBuilderStore.getState()
      storeState.prevStep()
    }
  }

  function handleSelectStep(stepId) {
    const gygStep = GYG_STEPS.find((s) => s.id === stepId)
    if (gygStep) {
      setStepDirection(gygStep.id > gygStepNumber ? 1 : -1)
      navigateTo(gygStep.sectionId, gygStep.stepId)
    }
  }

  if (loadingProduct) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Loading product...</p>
        </div>
      </div>
    )
  }

  if (productError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="bg-red-50 border border-red-300 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle size={40} className="text-red-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Product</h2>
          <p className="text-sm text-red-700 mb-4">{productError}</p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-50 bg-white overflow-hidden"
    ><div className="h-full flex flex-col">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/products')}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
              <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-emerald-300 rounded-full" />
              <div>
                <h1 className="text-base font-bold text-slate-800">
                  {id && id !== 'new' ? 'Edit Product' : 'Create New Product'}
                </h1>
                <p className="text-xs text-slate-500">
                  Step {gygStepNumber} of 16: {STEP_LABELS[gygStepNumber]}
                </p>
              </div>
            </div>
          </div>

          {/* Main area: sidebar + content */}
          <div className="flex-1 flex gap-0 min-h-0 px-6 py-5">
            <WizardSidebar currentStep={gygStepNumber} onSelectStep={handleSelectStep} />
            <div className="flex-1 flex flex-col ml-6 bg-white overflow-hidden">
              <div ref={contentRef} className="flex-1 p-8 overflow-y-auto">
                <h2 className="text-xl font-bold mb-6 tracking-tight">{STEP_LABELS[gygStepNumber]}</h2>
                <AnimatePresence mode="wait" custom={stepDirection}>
                  {StepComponent && (
                    <motion.div
                      key={gygStepNumber}
                      custom={stepDirection}
                      variants={{
                        initial: (d) => ({ opacity: 0, x: d * 24 }),
                        animate: { opacity: 1, x: 0 },
                        exit: (d) => ({ opacity: 0, x: d * -24 }),
                      }}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <ErrorBoundary errorMessage="Something went wrong in this step. Try refreshing or contact support.">
                        <StepComponent />
                      </ErrorBoundary>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <WizardNavFooter
                currentStep={gygStepNumber}
                totalSteps={16}
                onBack={handleBack}
                onNext={handleNext}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          </div>
        </div>

        {/* Resume Draft Prompt */}
        {showResumePrompt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Unsaved draft found</h3>
              <p className="text-sm text-slate-600 mb-6">
                You have an unsaved draft from your previous session. Would you like to resume editing or start fresh?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDiscardDraft}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Discard draft
                </button>
                <button
                  onClick={handleResumeDraft}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Resume editing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exit Warning Modal */}
        {showExitWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Unsaved changes</h3>
              <p className="text-sm text-slate-600 mb-6">
                You have unsaved changes. Are you sure you want to leave? Your progress will be lost.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelExit}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Leave anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
  )
}
