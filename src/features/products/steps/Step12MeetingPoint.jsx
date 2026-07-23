import { useRef, useState, useEffect } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { HelpCircle, Info, Upload, X, ChevronDown, Image, Loader2, MapPin } from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { GYG_PICKUP_TRANSPORT } from '@/constants/gygLists'
import { useGeocoding } from '@/hooks/useGeocoding'

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

function AddressModal({ title, description, onSave, onCancel }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const { search, results, loading, error, clear } = useGeocoding()

  const handleSelect = (result) => {
    setSearchQuery(result.formatted)
    setSelected(result)
    setOpen(false)
  }

  useEffect(() => {
    search(searchQuery)
    setOpen(searchQuery.length > 0 && !selected)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        listRef.current && !listRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSave = () => {
    const loc = selected || { formatted: searchQuery, latitude: null, longitude: null }
    onSave({
      name: loc.formatted?.split(',').slice(0, 2).join(',') || loc.formatted || '',
      address: loc.formatted || searchQuery,
      lat: loc.latitude,
      lng: loc.longitude,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-auto">
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

          <div className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelected(null) }}
              placeholder="Search location"
              className="w-full h-11 rounded-lg border border-slate-200 px-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {loading && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
            )}
            {open && (
              <div
                ref={listRef}
                className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-[240px] overflow-y-auto"
              >
                {results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 transition-colors flex items-start gap-2 border-0 bg-transparent cursor-pointer"
                  >
                    <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="leading-snug">{r.formatted}</span>
                  </button>
                ))}
                {!loading && results.length === 0 && searchQuery.length > 1 && (
                  <p className="px-3.5 py-3 text-sm text-slate-400">No results found</p>
                )}
                {error && (
                  <p className="px-3.5 py-3 text-sm text-red-500">{error}</p>
                )}
              </div>
            )}
          </div>

          {selected && (
            <div className="rounded-xl overflow-hidden border border-slate-200 h-[300px] bg-slate-100 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">{selected.formatted}</p>
                {selected.latitude && selected.longitude && (
                  <p className="text-xs text-slate-400 mt-1">
                    {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          )}
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

function MeetingPointSection() {
  const {
    meetingPoint,
    meetingPointPicture,
    meetingPointDescription,
    arrivalTimeType,
    setField,
  } = useProductBuilderStore()
  const fileInputRef = useRef(null)
  const [showAddressModal, setShowAddressModal] = useState(false)

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setField('meetingPointPicture', ev.target.result)
    reader.readAsDataURL(file)
  }

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
          <p className="text-sm text-slate-600 mt-2">{meetingPoint.address}</p>
        )}
      </div>

      {showAddressModal && (
        <AddressModal
          title="Add meeting point address"
          description="This is where customers can come and find you to start the activity. To make it as specific as possible, zoom in and drag the pin to the right place."
          onSave={(loc) => {
            setField('meetingPoint', {
              name: meetingPoint?.name ?? '',
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
      </div>
    </div>
  )
}

function PickupSection() {
  const {
    pickupType,
    pickupDescription,
    pickupTiming,
    pickupFinalLocationTiming,
    referenceStartTime,
    pickupAreas,
    pickupLocations,
    pickupTransportTypes,
    setField,
    addPickupArea,
    updatePickupArea,
    removePickupArea,
    addPickupLocation,
    updatePickupLocation,
    removePickupLocation,
  } = useProductBuilderStore()

  const [newAreaName, setNewAreaName] = useState('')
  const [newLocationName, setNewLocationName] = useState('')

  const handleAddArea = () => {
    if (newAreaName.trim()) {
      addPickupArea(newAreaName.trim())
      setNewAreaName('')
    }
  }

  const handleAddLocation = () => {
    if (newLocationName.trim()) {
      addPickupLocation({ name: newLocationName.trim(), address: '', lat: null, lng: null })
      setNewLocationName('')
    }
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
      </div>

      {/* When to pick up */}
      <div>
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
      </div>

      {/* Final pickup confirmation */}
      <div>
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
      </div>

      {/* Pickup areas/locations list */}
      <div data-field="pickupAreas">
        <label className="block text-sm font-bold text-slate-900 mb-3">
          {pickupType === 'area' ? 'Pickup areas' : 'Pickup locations'}
        </label>
        <div className="space-y-2 mb-3">
          {pickupType === 'area'
            ? pickupAreas.map((area, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex-1">
                    <input
                      className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:border-emerald-500"
                      type="text"
                      value={area.name}
                      onChange={(e) => updatePickupArea(i, { name: e.target.value })}
                      placeholder="Area name"
                    />
                  </div>
                  <input
                    className="h-9 rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:border-emerald-500 w-[130px]"
                    type="time"
                    value={area.time}
                    onChange={(e) => updatePickupArea(i, { time: e.target.value })}
                  />
                  <button
                    onClick={() => removePickupArea(i)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            : pickupLocations.map((loc, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex-1 space-y-2">
                    <input
                      className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:border-emerald-500"
                      type="text"
                      value={loc.name}
                      onChange={(e) => updatePickupLocation(i, { name: e.target.value })}
                      placeholder="Location name"
                    />
                    <input
                      className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:border-emerald-500"
                      type="text"
                      value={loc.address}
                      onChange={(e) => updatePickupLocation(i, { address: e.target.value })}
                      placeholder="Address"
                    />
                  </div>
                  <button
                    onClick={() => removePickupLocation(i)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors mt-1"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 h-11 rounded-lg border border-slate-200 px-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            type="text"
            value={pickupType === 'area' ? newAreaName : newLocationName}
            onChange={(e) => pickupType === 'area' ? setNewAreaName(e.target.value) : setNewLocationName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                pickupType === 'area' ? handleAddArea() : handleAddLocation()
              }
            }}
            placeholder={pickupType === 'area' ? 'Type an area name' : 'Type a location name'}
          />
          <button
            onClick={pickupType === 'area' ? handleAddArea : handleAddLocation}
            className="px-4 h-11 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            type="button"
          >
            Add
          </button>
        </div>
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
      </div>
    </div>
  )
}

function DropoffSection() {
  const {
    meetingMode,
    dropoffOption,
    dropoffLocation,
    setField,
  } = useProductBuilderStore()
  const [showDropoffModal, setShowDropoffModal] = useState(false)

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
      </div>

      {dropoffOption === 'different_location' && (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-800 mb-2">Add drop-off address</label>
          <button
            type="button"
            onClick={() => setShowDropoffModal(true)}
            className="px-5 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
          >
            Add address
          </button>
          {dropoffLocation?.address && (
            <p className="text-sm text-slate-600 mt-2">{dropoffLocation.address}</p>
          )}
        </div>
      )}

      {showDropoffModal && (
        <AddressModal
          title="Add drop-off address"
          description="This is where you'll drop off customers after the activity. To make it as specific as possible, zoom in and drag the pin to the right place."
          onSave={(loc) => {
            setField('dropoffLocation', {
              name: dropoffLocation?.name ?? '',
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

function TransportationSection() {
  const {
    pickupTransportTypes,
    addPickupTransportType,
    removePickupTransportType,
  } = useProductBuilderStore()
  const [isOpen, setIsOpen] = useState(false)

  const selectedCount = pickupTransportTypes.length

  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-slate-900">Transportation</h3>
      <label className="block text-sm font-bold text-slate-900 mb-1">What's the transportation used for pickup and drop-off?</label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-11 rounded-lg border border-slate-200 px-3.5 text-sm text-left bg-white flex items-center justify-between focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          <span className={selectedCount > 0 ? 'text-slate-700' : 'text-slate-400'}>
            {selectedCount > 0 ? `${selectedCount} selected` : 'Select a transportation type'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[300px] overflow-auto">
            {Object.entries(GYG_PICKUP_TRANSPORT).map(([category, types]) => (
              <div key={category}>
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{category}</span>
                </div>
                {types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (pickupTransportTypes.includes(type)) {
                        removePickupTransportType(pickupTransportTypes.indexOf(type))
                      } else {
                        addPickupTransportType(type)
                      }
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${
                      pickupTransportTypes.includes(type) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {pickupTransportTypes.map((type, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"
            >
              {type}
              <button
                type="button"
                onClick={() => removePickupTransportType(i)}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-emerald-100 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Step12MeetingPoint() {
  const { meetingMode, setField } = useProductBuilderStore()

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
      {meetingMode === 'meeting_point' && <MeetingPointSection />}
      {meetingMode === 'pickup' && <PickupSection />}

      {/* Drop-off */}
      {meetingMode && meetingMode !== 'none' && (
        <>
          <hr className="border-slate-100" />
          <DropoffSection />
        </>
      )}

      {/* Transportation */}
      {meetingMode && meetingMode !== 'none' && (
        <>
          <hr className="border-slate-100" />
          <TransportationSection />
        </>
      )}
    </div>
  )
}
