import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { HelpCircle, Info, Upload, X, Image, Loader2, Shapes, Trash2 } from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import LocationMapPicker from '@/components/shared/LocationMapPicker'
import PickupGeoshapeDrawer from '@/components/shared/PickupGeoshapeDrawer'
import AmPmTimePicker from '@/components/shared/AmPmTimePicker'
import { uploadPhotos } from '@/features/products/api'

const ARRIVAL_OPTIONS = [
  { value: 'none', label: 'Not relevant for this activity' },
  { value: '5min', label: '5 minutes before the activity' },
  { value: '10min', label: '10 minutes before the activity' },
  { value: '15min', label: '15 minutes before the activity' },
  { value: '20min', label: '20 minutes before the activity' },
  { value: '25min', label: '25 minutes before the activity' },
  { value: '30min', label: '30 minutes before the activity' },
]

const PICKUP_TIME_OPTIONS = [
  { value: '0-15', label: '0 - 15 min before the activity starts' },
  { value: '0-30', label: '0 - 30 min before the activity starts' },
  { value: '0-45', label: '0 - 45 min before the activity starts' },
  { value: '0-60', label: '0 - 1 hour before the activity starts' },
  { value: '0-90', label: '0 - 1.5 hours before the activity starts' },
  { value: '0-120', label: '0 - 2 hours before the activity starts' },
]

function AddressModal({ title, description, onSave, onCancel, initialValues }) {
  const [selected, setSelected] = useState(initialValues
    ? { formatted: initialValues.address, latitude: initialValues.lat, longitude: initialValues.lng }
    : null
  )
  const scrollRef = useRef(null)

  const handleSelect = (result) => {
    setSelected(result)
  }

  const handleSave = () => {
    const loc = selected || { formatted: '', latitude: null, longitude: null }
    onSave({
      name: loc.formatted?.split(',').slice(0, 2).join(',') || loc.formatted || '',
      address: loc.formatted || '',
      lat: loc.latitude,
      lng: loc.longitude,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div ref={scrollRef} className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 text-center mb-5 leading-relaxed">{description}</p>

          <LocationMapPicker
            onSelect={handleSelect}
            initialLat={initialValues?.lat}
            initialLng={initialValues?.lng}
            label="Search Location"
            placeholder="Search for a location..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Save address
          </button>
        </div>
      </div>
    </div>
  )
}

function MeetingPointSection({ errors }) {
  const {
    meetingPoint,
    meetingPointPicture,
    meetingPointDescription,
    arrivalTimeType,
    setField,
    previewFocus,
    clearPreviewFocus,
  } = useProductBuilderStore()
  const fileInputRef = useRef(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (previewFocus?.step === 'meeting-point' && previewFocus.section === 'meeting') {
      const t = setTimeout(() => {
        setShowAddressModal(true)
        clearPreviewFocus()
      }, 250)
      return () => clearTimeout(t)
    }
  }, [previewFocus, clearPreviewFocus])

  const handlePhotoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photos', file)
      const res = await uploadPhotos(formData)
      const urls = res.data?.data?.photos || []
      if (urls.length > 0) {
        setField('meetingPointPicture', urls[0])
      }
    } catch {
      // upload failed silently
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [setField])

  return (
    <div className="space-y-8">
      {/* Meeting point address */}
      <div data-field="meetingPoint">
        <h3 className="text-base font-bold text-slate-900 mb-3">Meeting point</h3>
        <label className="block text-sm font-semibold text-slate-800 mb-2">Add meeting point address</label>
        <button
          type="button"
          onClick={() => setShowAddressModal(true)}
          className="px-5 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
        >
          Add address
        </button>
        {meetingPoint?.address && (
          <div className="flex items-center justify-between gap-3 mt-2 p-3 rounded-lg border border-slate-200 bg-white">
            <p className="text-sm text-slate-600 flex-1">{meetingPoint.address}</p>
            <button
              type="button"
              onClick={() => setField('meetingPoint', null)}
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove meeting point address"
              aria-label="Remove meeting point address"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {errors.meetingPoint && <span className="text-[13px] text-red-600 font-medium mt-1 block">{errors.meetingPoint[0]}</span>}
      </div>

      {showAddressModal && (
        <AddressModal
          title="Add meeting point address"
          description="This is where customers can come and find you to start the activity. To make it as specific as possible, zoom in and drag the pin to the right place."
          onSave={(loc) => {
            setField('meetingPoint', {
              name: loc.name || '',
              address: loc.address,
              lat: loc.lat,
              lng: loc.lng,
            })
            setShowAddressModal(false)
          }}
          onCancel={() => setShowAddressModal(false)}
        />
      )}

      {/* Describe meeting point */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-1">
          Describe the meeting point <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <p className="text-sm text-slate-500 mb-3">Is there a specific landmark to look out for? How will customers recognize the guide?</p>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-vertical"
          rows={4}
          value={meetingPointDescription}
          onChange={(e) => setField('meetingPointDescription', e.target.value)}
          placeholder="Please insert your text in English"
          data-field="meetingPointDescription"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-slate-400">{meetingPointDescription.length} / 1000</span>
        </div>
        {errors.meetingPointDescription && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.meetingPointDescription[0]}</span>}
      </div>

      {/* Meeting point picture */}
      <div data-field="meetingPointPicture">
        <label className="block text-sm font-bold text-slate-900 mb-1">
          Meeting point picture <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <p className="text-sm text-slate-500 mb-3">Make sure you show a recognizable landmark or place to meet in your image.</p>

        {meetingPointPicture ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200">
            <img src={meetingPointPicture} alt="Meeting point" className="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={() => setField('meetingPointPicture', '')}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : uploading ? (
          <div className="border-2 border-dashed border-emerald-300 rounded-xl p-8 text-center bg-emerald-50/50">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Uploading to cloud...</p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
          >
            <p className="text-sm text-slate-500 mb-3">Drag your photo into the area below or select "Upload photo".</p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <Image className="w-6 h-6 text-slate-400" />
                </div>
                <span className="text-xs text-slate-500">Drag photo here.</span>
              </div>
              <span className="text-sm text-slate-400">or</span>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload photo
              </button>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        {errors.meetingPointPicture && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.meetingPointPicture[0]}</span>}
      </div>

      {/* Arrival time */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-1">When do customers need to arrive?</label>
        <p className="text-sm text-slate-500 mb-3">Do customers need to arrive early to be ready for their activity - for example, to pick up tickets, paperwork, or equipment?</p>
        <Select value={arrivalTimeType} onValueChange={(v) => setField('arrivalTimeType', v)} data-field="arrivalTimeType">
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select arrival time" />
          </SelectTrigger>
          <SelectContent>
            {ARRIVAL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.arrivalTimeType && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.arrivalTimeType[0]}</span>}
      </div>
    </div>
  )
}

function PickupSection({ errors }) {
  const {
    pickupType,
    pickupDescription,
    pickupTiming,
    pickupFinalLocationTiming,
    referenceStartTime,
    pickupAreas,
    pickupLocations,
    planPickupTimes,
    pickupStartTime,
    pickupAtSpecificTime,
    setField,
    addPickupArea,
    updatePickupArea,
    removePickupArea,
    addPickupLocation,
    updatePickupLocation,
    removePickupLocation,
    previewFocus,
    clearPreviewFocus,
  } = useProductBuilderStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [showGeoshapeModal, setShowGeoshapeModal] = useState(false)
  const [geoshapeAreaIdx, setGeoshapeAreaIdx] = useState(null)

  useEffect(() => {
    if (previewFocus?.step === 'meeting-point' && previewFocus.section === 'pickup') {
      const t = setTimeout(() => {
        if (pickupType === 'area') {
          setShowGeoshapeModal(true)
        } else {
          setShowAddModal(true)
        }
        clearPreviewFocus()
      }, 250)
      return () => clearTimeout(t)
    }
  }, [previewFocus, clearPreviewFocus, pickupType])

  const handleSaveLocation = (loc) => {
    if (editingIdx !== null) {
      updatePickupLocation(editingIdx, { name: loc.name, address: loc.address, lat: loc.lat, lng: loc.lng })
    } else {
      addPickupLocation({ name: loc.name, address: loc.address, lat: loc.lat, lng: loc.lng })
    }
    setShowAddModal(false)
    setEditingIdx(null)
  }

  const handleGeoshapeSave = ({ polygon, exclusions, location }) => {
    const hasZone = polygon && polygon.length >= 3
    if (!hasZone && !location) return
    const nameFrom = (base) =>
      base || location?.name || location?.address?.split(',').slice(0, 2).join(',') || ''
    if (geoshapeAreaIdx !== null && pickupAreas[geoshapeAreaIdx]) {
      const existing = pickupAreas[geoshapeAreaIdx]
      updatePickupArea(geoshapeAreaIdx, {
        name: nameFrom(existing?.name),
        address: location ? location.address || '' : existing?.address || '',
        lat: location ? location.lat : polygon[0][0],
        lng: location ? location.lng : polygon[0][1],
        polygon: hasZone ? polygon : undefined,
        exclusions: exclusions || [],
      })
    } else {
      addPickupArea({
        name: nameFrom(''),
        time: '',
        address: location?.address || '',
        lat: location ? location.lat : polygon[0][0],
        lng: location ? location.lng : polygon[0][1],
        polygon: hasZone ? polygon : undefined,
        exclusions: exclusions || [],
      })
    }
    setShowGeoshapeModal(false)
    setGeoshapeAreaIdx(null)
  }

  const clearAreaZone = (i) => {
    updatePickupArea(i, { polygon: undefined, exclusions: [] })
  }

  return (
    <div className="space-y-8">
      {/* Pickup service header */}
      <h3 className="text-base font-bold text-slate-900">Pickup service</h3>

      {/* Where to pick up */}
      <div data-field="pickupType">
        <label className="block text-sm font-bold text-slate-900 mb-3">Where will you pick up your customers?</label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pickupType"
              checked={pickupType === 'area'}
              onChange={() => setField('pickupType', 'area')}
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">From any address within a specific area</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pickupType"
              checked={pickupType === 'address'}
              onChange={() => setField('pickupType', 'address')}
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">From a defined list of pickup locations (hotels, airports, etc.)</span>
          </label>
        </div>
        {errors.pickupType && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.pickupType[0]}</span>}
      </div>

      {/* When to pick up */}
      <div data-field="pickupTiming">
        <label className="block text-sm font-bold text-slate-900 mb-3">When do you pick up your customers?</label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pickupTiming"
              checked={pickupTiming === 'at_start'}
              onChange={() => setField('pickupTiming', 'at_start')}
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm text-slate-700">At the activity start time</span>
              <p className="text-xs text-slate-500 mt-0.5">Pickup and activity are at the same time</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pickupTiming"
              checked={pickupTiming === 'before_start'}
              onChange={() => setField('pickupTiming', 'before_start')}
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm text-slate-700">Before the activity starts</span>
              <p className="text-xs text-slate-500 mt-0.5">Example: pickup is at 8:00 AM, activity starts at 9:00 AM</p>
            </div>
          </label>
        </div>
        {errors.pickupTiming && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.pickupTiming[0]}</span>}
      </div>

      {/* Final pickup confirmation */}
      <div data-field="pickupFinalLocationTiming">
        <label className="block text-sm font-bold text-slate-900 mb-1">When can the customer expect your final pickup confirmation?</label>
        <p className="text-sm text-slate-500 mb-3">We'll inform the customer about your suggested pickup details but you're responsible to confirm the exact pickup details to each customer individually.</p>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pickupFinalLocationTiming"
              checked={pickupFinalLocationTiming === 'day_before'}
              onChange={() => setField('pickupFinalLocationTiming', 'day_before')}
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">The day before the activity takes place</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pickupFinalLocationTiming"
              checked={pickupFinalLocationTiming === 'after_selection'}
              onChange={() => setField('pickupFinalLocationTiming', 'after_selection')}
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Directly after customer selects pickup location</span>
          </label>
        </div>
        {errors.pickupFinalLocationTiming && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.pickupFinalLocationTiming[0]}</span>}
      </div>

      {/* Pickup locations with geocoding */}
      <div data-field="pickupLocations">

        {/* Pickup time toggle */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-slate-900 mb-3">Do customers get picked up at a specific time?</label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="pickupAtSpecificTime"
                checked={pickupAtSpecificTime === true}
                onChange={() => setField('pickupAtSpecificTime', true)}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm text-slate-700">Yes, at a specific time</span>
                <p className="text-xs text-slate-500 mt-0.5">You'll set a pickup time for each area or location</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="pickupAtSpecificTime"
                checked={pickupAtSpecificTime === false}
                onChange={() => setField('pickupAtSpecificTime', false)}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm text-slate-700">No, pickup time varies</span>
                <p className="text-xs text-slate-500 mt-0.5">You'll coordinate pickup times individually with each customer</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-bold text-slate-900">
            {pickupType === 'area' ? 'Pickup areas' : 'Pickup locations'}
          </label>
          <HelpCircle size={16} className="text-slate-400" />
        </div>

        {/* Plan pickup times toggle */}
        {pickupType !== 'area' && pickupLocations.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setField('planPickupTimes', !planPickupTimes)}
              className={`relative w-11 h-6 rounded-full transition-colors ${planPickupTimes ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${planPickupTimes ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm font-semibold text-slate-800">Plan pickup times</span>
          </div>
        )}

        {/* Plan pickup times ON — tutorial banner */}
        {planPickupTimes && pickupType !== 'area' && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <span className="font-semibold">Let's get you started</span>
              <p className="mt-0.5">
                Skip entering your pickup route for every time slot. Learn how to set it up correctly and save time with our{' '}
                <a href="#" className="underline font-medium">tutorial video</a> and <a href="#" className="underline font-medium">FAQs</a>.
              </p>
            </div>
          </div>
        )}

        {/* Area mode — simple list */}
        {pickupType === 'area' && (
          <div className="space-y-2 mb-3" data-field="pickupAreas">
            {pickupAreas.map((area, i) => {
              const hasZone = Array.isArray(area.polygon) && area.polygon.length >= 3
              const exclusionCount = Array.isArray(area.exclusions) ? area.exclusions.length : 0
              return (
              <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white" data-field={`pickupAreas.${i}`}>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:border-emerald-500"
                      type="text"
                      value={area.name}
                      onChange={(e) => updatePickupArea(i, { name: e.target.value })}
                      placeholder="Area name"
                      data-field={`pickupAreas.${i}.name`}
                    />
                    {errors[`pickupAreas.${i}.name`] && <span className="text-[13px] text-red-600 font-medium mt-1">{errors[`pickupAreas.${i}.name`][0]}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setGeoshapeAreaIdx(i); setShowGeoshapeModal(true) }}
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                      hasZone || area.lat
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'
                    }`}
                    title={hasZone ? 'Edit zone or location on map' : 'Set zone or location on map'}
                  >
                    <Shapes className="w-4 h-4" />
                  </button>
                  {pickupAtSpecificTime && (
                    <AmPmTimePicker
                      value={area.time}
                      onChange={(t) => updatePickupArea(i, { time: t })}
                      className="shrink-0"
                    />
                  )}
                  <button
                    onClick={() => removePickupArea(i)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {area.address && (
                  <p className="text-[12px] text-slate-400 mt-1.5 ml-0.5 truncate">{area.address}</p>
                )}
                {(hasZone || exclusionCount > 0) && (
                  <div className="flex items-center gap-2 mt-2">
                    {hasZone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                        <Shapes className="w-3 h-3" /> Zone drawn ({area.polygon.length} pts)
                      </span>
                    )}
                    {exclusionCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-600">
                        {exclusionCount} exclusion zone{exclusionCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {hasZone && (
                      <button
                        type="button"
                        onClick={() => clearAreaZone(i)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Clear zone
                      </button>
                    )}
                  </div>
                )}
                {pickupAtSpecificTime && errors[`pickupAreas.${i}.time`] && <span className="text-[13px] text-red-600 font-medium mt-1">{errors[`pickupAreas.${i}.time`][0]}</span>}
              </div>
              )
            })}
          </div>
        )}

        {/* Address mode — simple card list (when planPickupTimes is OFF) */}
        {pickupType !== 'area' && !planPickupTimes && (
          <div className="space-y-2 mb-3">
            {pickupLocations.length > 0 && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-600">Pickup locations</span>
                </div>
                {pickupLocations.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{loc.name}</p>
                      {loc.address && <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingIdx(i); setShowAddModal(true) }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removePickupLocation(i)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Address mode — pickup times table (when planPickupTimes is ON) */}
        {pickupType !== 'area' && planPickupTimes && (
          <div className="space-y-4 mb-3">
            {/* Example activity start */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-semibold text-slate-800">Example activity start</label>
                  <HelpCircle size={14} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-3">
                  <AmPmTimePicker
                    value={pickupStartTime}
                    onChange={(t) => setField('pickupStartTime', t)}
                  />
                  <p className="text-xs text-slate-500">
                    We'll use this example to calculate the timing between your pickup locations. Your actual activity start times won't change.
                  </p>
                </div>
              </div>

              {/* Pickup time table */}
              <div className="border-t border-slate-200">
                <div className={`grid ${pickupAtSpecificTime ? 'grid-cols-[auto_1fr]' : 'grid-cols-[1fr]'} bg-slate-50 px-4 py-2.5 border-b border-slate-200 gap-4`}>
                  {pickupAtSpecificTime && <span className="text-xs font-bold text-slate-600">Pickup time</span>}
                  <span className="text-xs font-bold text-slate-600">Pickup locations</span>
                </div>
                {pickupLocations.map((loc, i) => (
                  <div key={i} className="grid grid-cols-[auto_1fr] items-center px-4 py-3 border-b border-slate-100 last:border-b-0 gap-4">
                    {pickupAtSpecificTime && (
                      <AmPmTimePicker
                        value={loc.pickupTime || ''}
                        onChange={(t) => updatePickupLocation(i, { pickupTime: t })}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{loc.name}</p>
                        {loc.address && <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditingIdx(i); setShowAddModal(true) }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removePickupLocation(i)}
                          className="text-sm text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning if < 2 addresses */}
            {pickupLocations.length < 2 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-600 text-lg">⚠</span>
                <p className="text-sm text-amber-800 flex-1">Add at least 2 addresses where you offer pickup</p>
                <button type="button" className="text-amber-400 hover:text-amber-600">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add address button */}
        {pickupType !== 'area' && (
          <button
            type="button"
            onClick={() => { setEditingIdx(null); setShowAddModal(true) }}
            className="px-4 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
          >
            + Add address
          </button>
        )}

        {/* Add pickup area button (for area mode) */}
        {pickupType === 'area' && (
          <>
            <button
              type="button"
              onClick={() => { setGeoshapeAreaIdx(null); setShowGeoshapeModal(true) }}
              className="px-4 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
            >
              + Add pickup area
            </button>
            <p className="w-full text-xs text-slate-500 mt-1">
              Draw the exact boundary of your pickup area — or search a location to save the area by name. Customers whose address is inside the zone can book pickup; add exclusion zones for streets you can't reach.
            </p>
          </>
        )}

        {/* Pickup geoshape drawer — draw the service zone or set a location point */}
        {showGeoshapeModal && (
          <PickupGeoshapeDrawer
            title={geoshapeAreaIdx !== null ? 'Edit pickup area' : 'Add pickup area'}
            description={
              geoshapeAreaIdx !== null
                ? 'Redraw the boundary of your pickup area, adjust exclusion zones, or update its location point.'
                : 'Trace the exact boundary of where you pick up customers, or search a location to save the area by name. Customers with addresses inside your zone can book pickup; addresses outside cannot.'
            }
            initialZone={geoshapeAreaIdx !== null && pickupAreas[geoshapeAreaIdx] ? pickupAreas[geoshapeAreaIdx].polygon : undefined}
            initialExclusions={geoshapeAreaIdx !== null && pickupAreas[geoshapeAreaIdx] ? pickupAreas[geoshapeAreaIdx].exclusions : undefined}
            initialLocation={
              geoshapeAreaIdx !== null && pickupAreas[geoshapeAreaIdx]?.lat != null
                ? {
                    name: pickupAreas[geoshapeAreaIdx].name || '',
                    address: pickupAreas[geoshapeAreaIdx].address || '',
                    lat: pickupAreas[geoshapeAreaIdx].lat,
                    lng: pickupAreas[geoshapeAreaIdx].lng,
                  }
                : undefined
            }
            onSave={handleGeoshapeSave}
            onCancel={() => { setShowGeoshapeModal(false); setGeoshapeAreaIdx(null) }}
          />
        )}

        {/* AddressModal for adding/editing pickup locations */}
        {showAddModal && (
          <AddressModal
            title={editingIdx !== null ? 'Edit pickup address' : 'Add pickup address'}
            description="Search for the pickup location. Customers will be picked up from this address."
            onSave={handleSaveLocation}
            onCancel={() => { setShowAddModal(false); setEditingIdx(null) }}
            initialValues={editingIdx !== null ? pickupLocations[editingIdx] : null}
          />
        )}
        {errors.pickupLocations && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.pickupLocations[0]}</span>}
      </div>

      {/* When do you usually pick up */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-1">When do you usually pick up your customers?</label>
        <p className="text-sm text-slate-500 mb-3">Note that you'll still need to communicate the exact pickup time for every booking.</p>
        <Select value={referenceStartTime} onValueChange={(v) => setField('referenceStartTime', v)} data-field="referenceStartTime">
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Choose one..." />
          </SelectTrigger>
          <SelectContent>
            {PICKUP_TIME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.referenceStartTime && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.referenceStartTime[0]}</span>}
      </div>

      {/* Describe pickup */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-1">
          Describe your pickup <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <p className="text-sm text-slate-500 mb-3">What should customers look for when waiting for their vehicle? Where should they wait? If your pickup areas/places are very specific, describe them in more detail.</p>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-vertical"
          rows={4}
          value={pickupDescription}
          onChange={(e) => setField('pickupDescription', e.target.value)}
          placeholder="Please insert your text in English"
          data-field="pickupDescription"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-slate-400">{pickupDescription.length} / 1000</span>
        </div>
        {errors.pickupDescription && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.pickupDescription[0]}</span>}
      </div>
    </div>
  )
}

function DropoffSection({ errors }) {
  const {
    meetingMode,
    dropoffOption,
    dropoffLocation,
    setField,
    previewFocus,
    clearPreviewFocus,
  } = useProductBuilderStore()
  const [showDropoffModal, setShowDropoffModal] = useState(false)

  useEffect(() => {
    if (previewFocus?.step === 'meeting-point' && previewFocus.section === 'dropoff') {
      const t = setTimeout(() => {
        setShowDropoffModal(true)
        clearPreviewFocus()
      }, 250)
      return () => clearTimeout(t)
    }
  }, [previewFocus, clearPreviewFocus])

  const samePlaceLabel = meetingMode === 'pickup'
    ? 'At the same place you picked them up'
    : 'At the same place you met them'

  return (
    <div className="space-y-5">
      <h3 className="text-base font-bold text-slate-900">Drop-off</h3>
      <label className="block text-sm font-bold text-slate-900 mb-3">Where will you drop off the customer at the end of the activity?</label>

      <div className="space-y-3" data-field="dropoffOption">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="dropoffOption"
            checked={dropoffOption === 'same_location'}
            onChange={() => setField('dropoffOption', 'same_location')}
            className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700">{samePlaceLabel}</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="dropoffOption"
            checked={dropoffOption === 'different_location'}
            onChange={() => setField('dropoffOption', 'different_location')}
            className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700">At a different place</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="dropoffOption"
            checked={dropoffOption === 'none'}
            onChange={() => setField('dropoffOption', 'none')}
            className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700">No drop-off service, the customer stays at the site or destination</span>
        </label>
        {errors.dropoffOption && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.dropoffOption[0]}</span>}
      </div>

      {dropoffOption === 'different_location' && (
        <div className="mt-4" data-field="dropoffLocation">
          <label className="block text-sm font-semibold text-slate-800 mb-2">Add drop-off address</label>
          <button
            type="button"
            onClick={() => setShowDropoffModal(true)}
            className="px-5 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
          >
            Add address
          </button>
          {dropoffLocation?.address && (
            <div className="flex items-center justify-between gap-3 mt-2 p-3 rounded-lg border border-slate-200 bg-white">
              <p className="text-sm text-slate-600 flex-1">{dropoffLocation.address}</p>
              <button
                type="button"
                onClick={() => setField('dropoffLocation', null)}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remove drop-off address"
                aria-label="Remove drop-off address"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {errors.dropoffLocation && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.dropoffLocation[0]}</span>}
        </div>
      )}

      {showDropoffModal && (
        <AddressModal
          title="Add drop-off address"
          description="This is where you'll drop off customers after the activity. To make it as specific as possible, zoom in and drag the pin to the right place."
          onSave={(loc) => {
            setField('dropoffLocation', {
              name: loc.name || '',
              address: loc.address,
              lat: loc.lat,
              lng: loc.lng,
            })
            setShowDropoffModal(false)
          }}
          onCancel={() => setShowDropoffModal(false)}
        />
      )}
    </div>
  )
}

export default function Step13MeetingPoint() {
  const { meetingMode, setField } = useProductBuilderStore()
  const errors = useStepErrors(13)

  return (
    <div className="max-w-[720px] space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Meeting point or pickup</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
            <Info className="w-3.5 h-3.5" />
            Customizable
          </span>
          <HelpCircle className="w-5 h-5 text-slate-400" />
        </div>

        {/* Mode selection */}
        <div data-field="meetingMode">
          <label className="block text-sm font-bold text-slate-900 mb-3">How do customers get to the activity?</label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="meetingMode"
                checked={meetingMode === 'meeting_point'}
                onChange={() => setField('meetingMode', 'meeting_point')}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">They go to the starting point of the activity by themselves (e.g. meeting point, entrance)</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="meetingMode"
                checked={meetingMode === 'pickup'}
                onChange={() => setField('meetingMode', 'pickup')}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">They get picked up (by bus, car, etc.)</span>
            </label>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Mode-specific content */}
      {meetingMode === 'meeting_point' && <MeetingPointSection errors={errors} />}
      {meetingMode === 'pickup' && <PickupSection errors={errors} />}

      {/* Drop-off */}
      {meetingMode && meetingMode !== 'none' && (
        <>
          <hr className="border-slate-100" />
          <DropoffSection errors={errors} />
        </>
      )}
    </div>
  )
}
