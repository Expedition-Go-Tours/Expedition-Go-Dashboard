import { useParams, useSearchParams, useNavigate, useBlocker } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { Loader2, AlertCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { getMyProduct, createProduct, updateProduct } from '@/features/products/api'
import { GYG_STEPS, GYG_SECTIONS } from '@/features/products/gygSteps'
import WizardSidebar from '@/features/products/WizardSidebar'
import WizardNavFooter from '@/features/products/WizardNavFooter'
import Step01Language from '@/features/products/steps/Step01Language'
import Step02Category from '@/features/products/steps/Step02Category'
import Step03Title from '@/features/products/steps/Step03Title'
import Step04Descriptions from '@/features/products/steps/Step04Descriptions'
import Step05Locations from '@/features/products/steps/Step05Locations'
import Step06Keywords from '@/features/products/steps/Step06Keywords'
import Step07Inclusions from '@/features/products/steps/Step07Inclusions'
import Step08Photos from '@/features/products/steps/Step08Photos'
import Step09ExtraInfo from '@/features/products/steps/Step09ExtraInfo'
import Step10Options from '@/features/products/steps/Step10Options'
import Step11MeetingPoint from '@/features/products/steps/Step11MeetingPoint'
import Step12PricingAvailability from '@/features/products/steps/Step12PricingAvailability'
import Step13Itinerary from '@/features/products/steps/Step13Itinerary'

const STEP_COMPONENTS = {
  1: Step01Language,
  2: Step02Category,
  3: Step03Title,
  4: Step04Descriptions,
  5: Step05Locations,
  6: Step06Keywords,
  7: Step07Inclusions,
  8: Step08Photos,
  9: Step09ExtraInfo,
  10: Step10Options,
  11: Step11MeetingPoint,
  12: Step12PricingAvailability,
  13: Step13Itinerary,
}

const STEP_LABELS = {
  1: 'Language',
  2: 'Product Category',
  3: 'Title & Reference Code',
  4: 'Descriptions & highlights',
  5: 'Locations',
  6: 'Keywords',
  7: 'Inclusions',
  8: 'Photos',
  9: 'Extra information',
  10: 'Options',
  11: 'Meeting Point & Pickup',
  12: 'Pricing & Availability',
  13: 'Itinerary',
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

  return {
    language: content.writingLanguage || '',
    category: categorization.category || '',
    activityType: categorization.activityType || '',
    difficulty: categorization.difficulty || '',
    duration: categorization.duration?.value ?? categorization.duration?.hours ?? null,
    durationUnit: categorization.duration?.unit || 'hours',
    title: tour.title || '',
    referenceCode: tour.referenceCode || '',
    shortDescription: content.shortSummary || '',
    fullDescription: tour.description || '',
    highlights: Array.isArray(content.highlights) ? content.highlights : [],
    locations: content.locations || [],
    keywords: tour.tags || [],
    whatsIncluded: content.included || [],
    whatsNotIncluded: content.excluded || [],
    guideType: content.guideType || 'guide',
    foodProvided: !!content.foodProvided,
    mealType: content.mealType || '',
    drinksIncluded: !!content.drinksIncluded,
    dietaryOptions: content.dietaryOptions || [],
    transportationProvided: !!content.transportationProvided,
    transportationType: content.transportationType || '',
    notSuitableFor: content.healthRestrictions || [],
    notAllowed: content.notAllowed || [],
    petFriendly: !!content.petFriendly,
    mandatoryItems: content.whatToBring || [],
    knowBeforeYouGo: content.additionalInfo || '',
    emergencyCountryCode: content.emergencyCountryCode || '',
    emergencyPhone: content.emergencyPhone || '',
    voucherInfo: content.voucherInfo || '',
    photos: (tour.photos || []).map((p) => (typeof p === 'string' ? p : p.url || '')),
    copyrightConfirmed: true,
    options: content.options || [],
    meetingPoint: meetingPoint.lat
      ? {
          name: meetingPoint.name || '',
          address: meetingPoint.address || '',
          lat: meetingPoint.lat,
          lng: meetingPoint.lng,
        }
      : null,
    meetingPointDescription: content.meetingInstructions || '',
    arrivalTime: content.arrivalTime || '',
    pickupProvided: !!content.pickupAvailable,
    pickupType: content.pickupType || 'area',
    pickupDescription: content.pickupDescription || '',
    referenceStartTime: content.referenceStartTime || '',
    pickupAreas: (content.pickupAreas || []).map((a) =>
      typeof a === 'string' ? { name: a, time: '' } : a,
    ),
    dropoffProvided: !!content.dropoffAvailable,
    dropoffDescription: content.dropoffDescription || '',
    cutoffHours: booking.cancellationPolicy?.cutoffHours ?? 0,
    itinerary: Array.isArray(content.itinerary) ? content.itinerary : [],
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

  const [loadingProduct, setLoadingProduct] = useState(false)
  const [productError, setProductError] = useState(null)
  const [showExitWarning, setShowExitWarning] = useState(false)

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

  const [saving, setSaving] = useState(false)
  const [savedProductId, setSavedProductId] = useState(id && id !== 'new' ? id : null)

  async function handleSave() {
    const state = useProductBuilderStore.getState()

    const payload = {
      ...state,
      photos: (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || p)),
      existingPhotos: (state.photos || []).map((p) => (typeof p === 'string' ? p : p.url || p)),
    }

    delete payload._pendingFiles
    delete payload._hasHydrated
    delete payload._version
    delete payload.currentStep
    delete payload.completedStepIds
    delete payload.isDirty
    delete payload.isSubmitting
    delete payload.lastSaved

    setSaving(true)
    try {
      const res = savedProductId
        ? await updateProduct(savedProductId, payload)
        : await createProduct(payload)
      const newId = savedProductId || res.data?.data?.tour?._id
      if (newId) setSavedProductId(newId)
      return res
    } finally {
      setSaving(false)
    }
  }

  function handleNext() {
    if (gygStepNumber < 13) {
      const storeState = useProductBuilderStore.getState()
      storeState.nextStep()
    }
  }

  function handleBack() {
    if (gygStepNumber > 1) {
      const storeState = useProductBuilderStore.getState()
      storeState.prevStep()
    }
  }

  function handleSelectStep(stepId) {
    const gygStep = GYG_STEPS.find((s) => s.id === stepId)
    if (gygStep) {
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
                onClick={() => {
                  if (isDirty) {
                    setShowExitWarning(true)
                  } else {
                    navigate('/products')
                  }
                }}
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
                  Step {gygStepNumber} of 13: {STEP_LABELS[gygStepNumber]}
                </p>
              </div>
            </div>
          </div>

          {/* Main area: sidebar + content */}
          <div className="flex-1 flex gap-0 min-h-0 px-6 py-5">
            <WizardSidebar currentStep={gygStepNumber} onSelectStep={handleSelectStep} />
            <div className="flex-1 flex flex-col ml-6 bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex-1 p-8 overflow-y-auto">
                <h2 className="text-xl font-bold mb-6 tracking-tight">{STEP_LABELS[gygStepNumber]}</h2>
                {StepComponent && <StepComponent />}
              </div>
              <WizardNavFooter
                currentStep={gygStepNumber}
                totalSteps={13}
                onBack={handleBack}
                onNext={handleNext}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          </div>
        </div>

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
