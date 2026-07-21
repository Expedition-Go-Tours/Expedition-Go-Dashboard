import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MapPin,
  Bus,
  Compass,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  GripVertical,
  Clock,
  Map,
} from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { GYG_PICKUP_TRANSPORT } from '@/constants/gygLists'

const DEFAULT_CENTER = [2.3522, 48.8566]

const ARRIVAL_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '5min', label: '5 minutes before' },
  { value: '10min', label: '10 minutes before' },
  { value: '15min', label: '15 minutes before' },
  { value: '30min', label: '30 minutes before' },
  { value: 'notified', label: 'Will be notified' },
  { value: 'custom', label: 'Custom time' },
]

const DROPOFF_OPTIONS = [
  { value: 'same_location', label: 'Same as meeting point / pickup', desc: 'Customers are returned to where they were picked up' },
  { value: 'different_location', label: 'Different location', desc: 'Customers are dropped off at a different place' },
  { value: 'none', label: 'No drop-off', desc: 'Customer stays at the site or destination' },
  { value: 'service', label: 'Service with description', desc: 'Drop-off service with custom details' },
]

const MODES = [
  { value: 'meeting_point', label: 'Meeting Point', desc: 'Customers meet at a fixed location', icon: MapPin, color: 'emerald' },
  { value: 'pickup', label: 'Pickup', desc: 'Customers are picked up from locations', icon: Bus, color: 'amber' },
  { value: 'none', label: 'Self-Guided', desc: 'No meeting point — customers explore on their own', icon: Compass, color: 'slate' },
]

function ModeCard({ mode, selected, onSelect }) {
  const isSelected = selected === mode.value
  const colorMap = { emerald: 'emerald', amber: 'amber', slate: 'slate' }
  const c = colorMap[mode.color]
  const borderColor = isSelected ? `border-${c}-500 ring-2 ring-${c}-500/20` : 'border-slate-200 hover:border-slate-300'
  const bgColor = isSelected ? `bg-${c}-50` : 'bg-white'
  const iconColor = isSelected ? `text-${c}-600` : 'text-slate-400'
  const labelColor = isSelected ? `text-${c}-800` : 'text-slate-700'

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(mode.value)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`flex-1 min-w-0 rounded-xl border ${borderColor} ${bgColor} p-4 cursor-pointer transition-all text-left`}
    >
      <mode.icon size={22} className={`${iconColor} mb-2 transition-colors`} />
      <p className={`text-sm font-semibold ${labelColor} transition-colors`}>{mode.label}</p>
      <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{mode.desc}</p>
    </motion.button>
  )
}

function formatOffset(pickupTime, referenceTime) {
  if (!pickupTime || !referenceTime) return null
  const [ph, pm] = pickupTime.split(':').map(Number)
  const [rh, rm] = referenceTime.split(':').map(Number)
  const pickupMin = ph * 60 + pm
  const refMin = rh * 60 + rm
  const diff = refMin - pickupMin
  if (diff <= 0) return null
  if (diff < 60) return `${diff} min before start`
  const hrs = Math.floor(diff / 60)
  const mins = diff % 60
  return mins > 0 ? `${hrs} hr ${mins} min before start` : `${hrs} hr before start`
}

function DropoffSection() {
  const {
    dropoffOption,
    dropoffLocation,
    dropoffDescription,
    setField,
  } = useProductBuilderStore()

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Map size={14} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Drop-off</span>
        </div>
        <p className="text-[12px] text-slate-500 mt-0.5">Where do customers finish their experience?</p>
      </div>
      <div className="p-4 space-y-3">
        {DROPOFF_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              dropoffOption === opt.value
                ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-400/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="dropoffOption"
              value={opt.value}
              checked={dropoffOption === opt.value}
              onChange={(e) => setField('dropoffOption', e.target.value)}
              className="mt-0.5 w-[18px] h-[18px] cursor-pointer text-emerald-600 border-slate-300 focus:ring-emerald-500 shrink-0"
            />
            <div>
              <span className={`text-sm font-medium ${
                dropoffOption === opt.value ? 'text-emerald-800' : 'text-slate-700'
              }`}>
                {opt.label}
              </span>
              <p className="text-[12px] text-slate-500 mt-0.5">{opt.desc}</p>
            </div>
          </label>
        ))}

        <AnimatePresence>
          {dropoffOption === 'different_location' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pl-10 space-y-3">
                <div>
                  <label className="block text-[13px] font-semibold mb-1 text-slate-600">Location name</label>
                  <input
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-ring"
                    type="text"
                    value={dropoffLocation?.name ?? ''}
                    onChange={(e) => setField('dropoffLocation', { ...dropoffLocation, name: e.target.value, address: dropoffLocation?.address ?? '', lat: dropoffLocation?.lat ?? null, lng: dropoffLocation?.lng ?? null })}
                    placeholder="e.g. Main Entrance"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1 text-slate-600">Address</label>
                  <input
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-ring"
                    type="text"
                    value={dropoffLocation?.address ?? ''}
                    onChange={(e) => setField('dropoffLocation', { ...dropoffLocation, name: dropoffLocation?.name ?? '', address: e.target.value, lat: dropoffLocation?.lat ?? null, lng: dropoffLocation?.lng ?? null })}
                    placeholder="Type an address..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {dropoffOption === 'service' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 pl-10">
                <label className="block text-[13px] font-semibold mb-1 text-slate-600">Drop-off description</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus-ring resize-vertical"
                  rows={2}
                  value={dropoffDescription}
                  onChange={(e) => setField('dropoffDescription', e.target.value)}
                  placeholder="Describe the drop-off service..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function MeetingPointContent() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const fileInputRef = useRef(null)

  const {
    meetingPoint,
    meetingPointPicture,
    meetingPointDescription,
    arrivalTimeType,
    arrivalTimeCustom,
    setField,
  } = useProductBuilderStore()

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: meetingPoint?.lng ? [meetingPoint.lng, meetingPoint.lat] : DEFAULT_CENTER,
      zoom: 13,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      setField('meetingPoint', {
        name: meetingPoint?.name ?? '',
        address: meetingPoint?.address ?? '',
        lat,
        lng,
      })
    })
    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current) return
    if (meetingPoint?.lat && meetingPoint?.lng) {
      if (marker.current) marker.current.remove()
      marker.current = new maplibregl.Marker({ color: '#059669', draggable: true })
        .setLngLat([meetingPoint.lng, meetingPoint.lat])
        .addTo(map.current)
      marker.current.on('dragend', () => {
        const lngLat = marker.current.getLngLat()
        setField('meetingPoint', {
          name: meetingPoint?.name ?? '',
          address: meetingPoint?.address ?? '',
          lat: lngLat.lat,
          lng: lngLat.lng,
        })
      })
    } else {
      marker.current?.remove()
      marker.current = null
    }
  }, [meetingPoint?.lat, meetingPoint?.lng])

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setField('meetingPointPicture', ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Meeting point address</label>
          <input
            className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
            type="text"
            value={meetingPoint?.address ?? ''}
            onChange={(e) =>
              setField('meetingPoint', {
                name: meetingPoint?.name ?? '',
                address: e.target.value,
                lat: meetingPoint?.lat ?? null,
                lng: meetingPoint?.lng ?? null,
              })
            }
            placeholder="Type an address..."
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Pin on map</label>
          <p className="text-[12px] text-slate-500 mb-1.5">Click on the map to set the exact meeting point location. Drag the marker to adjust.</p>
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <div ref={mapContainer} style={{ height: '250px', width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Upload size={14} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Meeting point photo</span>
        </div>
        <p className="text-[12px] text-slate-500 -mt-1">Give customers a visual reference so they can easily spot the meeting point.</p>

        {meetingPointPicture ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200">
            <img src={meetingPointPicture} alt="Meeting point" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={() => setField('meetingPointPicture', '')}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white grid place-items-center hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 grid place-items-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
          >
            <div className="text-center">
              <Upload size={20} className="text-slate-400 group-hover:text-emerald-500 mx-auto mb-1 transition-colors" />
              <p className="text-xs text-slate-500 group-hover:text-emerald-600 transition-colors">Click to upload a photo</p>
            </div>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Meeting point description</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
            rows={2}
            value={meetingPointDescription}
            onChange={(e) => setField('meetingPointDescription', e.target.value)}
            placeholder="What should customers look for? Any specific landmark or signage?"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Arrival time</span>
        </div>
        <p className="text-[12px] text-slate-500 -mt-1">When do customers need to arrive before the activity starts?</p>

        <select
          value={arrivalTimeType}
          onChange={(e) => setField('arrivalTimeType', e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
        >
          {ARRIVAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <AnimatePresence>
          {arrivalTimeType === 'custom' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Custom arrival time</label>
              <input
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring max-w-[200px]"
                type="time"
                value={arrivalTimeCustom}
                onChange={(e) => setField('arrivalTimeCustom', e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PickupContent() {
  const areaInputRef = useRef(null)
  const [expandedCategories, setExpandedCategories] = useState([])

  const toggleCategory = (category) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const {
    pickupType,
    pickupDescription,
    pickupTiming,
    pickupFinalLocationTiming,
    referenceStartTime,
    pickupAreas,
    pickupLocations,
    setField,
    addPickupArea,
    updatePickupArea,
    removePickupArea,
    addPickupLocation,
    updatePickupLocation,
    removePickupLocation,
    pickupTransportTypes,
    addPickupTransportType,
    removePickupTransportType,
  } = useProductBuilderStore()

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-slate-500 leading-relaxed">
        Customers are picked up from designated areas or addresses before the activity.
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Type of transportation</label>
          <p className="text-[12px] text-slate-500 mb-2">Select the types of transportation used during the activity.</p>
          <div className="space-y-2">
            {Object.entries(GYG_PICKUP_TRANSPORT).map(([category, types]) => {
              const isExpanded = expandedCategories.includes(category)
              const selectedCount = types.filter((t) => pickupTransportTypes.includes(t)).length
              return (
                <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{category}</span>
                      {selectedCount > 0 && (
                        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{selectedCount}</span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2">
                          {types.map((type) => (
                            <label
                              key={type}
                              className={`flex items-center gap-2.5 cursor-pointer text-sm transition-all ${
                                pickupTransportTypes.includes(type) ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={pickupTransportTypes.includes(type)}
                                onChange={() =>
                                  pickupTransportTypes.includes(type)
                                    ? removePickupTransportType(pickupTransportTypes.indexOf(type))
                                    : addPickupTransportType(type)
                                }
                                className="w-[18px] h-[18px] cursor-pointer text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                              />
                              <span>{type}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Pickup method</label>
          <div className="flex gap-3">
            <label
              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                pickupType === 'area'
                  ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="pickupType"
                value="area"
                checked={pickupType === 'area'}
                onChange={() => setField('pickupType', 'area')}
                className="w-[18px] h-[18px] cursor-pointer text-amber-600 border-slate-300 focus:ring-amber-500 shrink-0"
              />
              <div>
                <span className={`text-sm font-medium ${pickupType === 'area' ? 'text-amber-800' : 'text-slate-700'}`}>Pickup areas</span>
                <p className="text-[12px] text-slate-500">Pick up from any address in specified areas</p>
              </div>
            </label>
            <label
              className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                pickupType === 'address'
                  ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="pickupType"
                value="address"
                checked={pickupType === 'address'}
                onChange={() => setField('pickupType', 'address')}
                className="w-[18px] h-[18px] cursor-pointer text-amber-600 border-slate-300 focus:ring-amber-500 shrink-0"
              />
              <div>
                <span className={`text-sm font-medium ${pickupType === 'address' ? 'text-amber-800' : 'text-slate-700'}`}>Specific places</span>
                <p className="text-[12px] text-slate-500">Pick up from specific addresses</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
            {pickupType === 'area' ? 'Pickup areas' : 'Pickup locations'}
          </label>
          <p className="text-[12px] text-slate-500 mb-2">
            {pickupType === 'area'
              ? 'Define areas where pickup is available. Each area includes a pickup time offset from the start time.'
              : 'Define specific pickup addresses with coordinates.'}
          </p>

          <div className="space-y-2 mb-3">
            {pickupType === 'area'
              ? pickupAreas.map((area, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex gap-2 items-center">
                        <input
                          className="flex-1 min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring"
                          type="text"
                          value={area.name}
                          onChange={(e) => updatePickupArea(i, { name: e.target.value })}
                          placeholder="Area name"
                        />
                        <input
                          className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[130px]"
                          type="time"
                          value={area.time}
                          onChange={(e) => updatePickupArea(i, { time: e.target.value })}
                        />
                      </div>
                      {area.time && referenceStartTime && formatOffset(area.time, referenceStartTime) && (
                        <p className="text-[12px] text-amber-600 font-medium ml-0.5">
                          Pickup: {formatOffset(area.time, referenceStartTime)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removePickupArea(i)}
                      className="shrink-0 mt-1 w-6 h-6 rounded-full bg-transparent text-slate-400 cursor-pointer grid place-items-center text-xs hover:text-red-500 hover:bg-red-50 transition-colors"
                      type="button"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              : pickupLocations.map((loc, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                    <GripVertical size={16} className="mt-2 shrink-0 text-slate-300 cursor-grab" />
                    <div className="flex-1 space-y-1.5">
                      <input
                        className="w-full min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring"
                        type="text"
                        value={loc.name}
                        onChange={(e) => updatePickupLocation(i, { name: e.target.value })}
                        placeholder="Location name"
                      />
                      <input
                        className="w-full min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring"
                        type="text"
                        value={loc.address}
                        onChange={(e) => updatePickupLocation(i, { address: e.target.value })}
                        placeholder="Address"
                      />
                    </div>
                    <button
                      onClick={() => removePickupLocation(i)}
                      className="shrink-0 mt-1 w-6 h-6 rounded-full bg-transparent text-slate-400 cursor-pointer grid place-items-center text-xs hover:text-red-500 hover:bg-red-50 transition-colors"
                      type="button"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
          </div>

          <div className="flex gap-2">
            <input
              ref={areaInputRef}
              className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
              type="text"
              placeholder={pickupType === 'area' ? 'Type an area name and press Enter' : 'Type a location name and press Enter'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const val = e.currentTarget.value.trim()
                  if (!val) return
                  if (pickupType === 'area') {
                    addPickupArea(val)
                  } else {
                    addPickupLocation({ name: val, address: '', lat: null, lng: null })
                  }
                  e.currentTarget.value = ''
                }
              }}
            />
            <button
              onClick={() => {
                const input = areaInputRef.current
                if (!input) return
                const val = input.value.trim()
                if (!val) return
                if (pickupType === 'area') {
                  addPickupArea(val)
                } else {
                  addPickupLocation({ name: val, address: '', lat: null, lng: null })
                }
                input.value = ''
                input.focus()
              }}
              className="shrink-0 h-[44px] px-4 rounded-xl bg-amber-600 text-white text-sm font-semibold border-0 cursor-pointer hover:bg-amber-700 transition-colors"
              type="button"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Pickup timing</label>
            <select
              value={pickupTiming}
              onChange={(e) => setField('pickupTiming', e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
            >
              <option value="at_start">At activity start time</option>
              <option value="before_start">Before activity start time</option>
            </select>
            <p className="text-[12px] text-slate-500 mt-1">When does pickup occur relative to the activity?</p>
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Final location timing</label>
            <select
              value={pickupFinalLocationTiming}
              onChange={(e) => setField('pickupFinalLocationTiming', e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
            >
              <option value="day_before">Day before activity</option>
              <option value="after_selection">After booking selection</option>
            </select>
            <p className="text-[12px] text-slate-500 mt-1">When do customers choose their pickup location?</p>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Reference start time</label>
          <p className="text-[12px] text-slate-500 mb-1.5">Pick a start time that matches an actual start time on your listing. The offset between start time and pickup time is what we store.</p>
          <input
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring max-w-[200px]"
            type="time"
            value={referenceStartTime}
            onChange={(e) => setField('referenceStartTime', e.target.value)}
          />
        </div>
      </div>

      {pickupType === 'area' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Map size={14} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Pickup area map</span>
          </div>
          <p className="text-[12px] text-slate-500">Draw a geofence area on the map to define the pickup zone.</p>
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-48 grid place-items-center">
            <div className="text-center">
              <Map size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Map geoshape drawing coming soon</p>
              <p className="text-[11px] text-slate-400 mt-0.5">You can define pickup areas by name for now</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div>
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Pickup description</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
            rows={2}
            value={pickupDescription}
            onChange={(e) => setField('pickupDescription', e.target.value)}
            placeholder="Type of vehicle, signage to look for, any special instructions..."
          />
        </div>
      </div>
    </div>
  )
}

function NoneContent() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 grid place-items-center shrink-0">
            <Compass size={20} className="text-slate-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">Self-Guided Activity</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              This is a self-guided experience. Customers explore at their own pace using the information and materials provided. No meeting point or pickup is needed.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-100/70 border border-slate-200">
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-700">How it works:</strong> Customers receive all necessary information (audio guide, map, app instructions, or printed materials) and begin the experience whenever they choose. This mode is ideal for walking tours, museum visits, and audio-guided explorations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Step12MeetingPoint() {
  const { meetingMode, setField } = useProductBuilderStore()

  return (
    <div className="max-w-[720px] space-y-6">
      <p className="text-[13px] text-slate-500 leading-relaxed -mt-2">
        Choose how customers will meet or begin your experience.
      </p>

      <div className="flex gap-3">
        {MODES.map((mode) => (
          <ModeCard key={mode.value} mode={mode} selected={meetingMode} onSelect={(v) => setField('meetingMode', v)} />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className={`px-4 py-3 border-b border-slate-100 ${
          meetingMode === 'meeting_point' ? 'bg-emerald-50/70' :
          meetingMode === 'pickup' ? 'bg-amber-50/70' : 'bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-2">
            {meetingMode === 'meeting_point' && <MapPin size={15} className="text-emerald-600" />}
            {meetingMode === 'pickup' && <Bus size={15} className="text-amber-600" />}
            {meetingMode === 'none' && <Compass size={15} className="text-slate-600" />}
            <span className={`text-sm font-semibold ${
              meetingMode === 'meeting_point' ? 'text-emerald-800' :
              meetingMode === 'pickup' ? 'text-amber-800' : 'text-slate-700'
            }`}>
              {meetingMode === 'meeting_point' ? 'Meeting Point' :
               meetingMode === 'pickup' ? 'Pickup' : 'Self-Guided'}
            </span>
          </div>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={meetingMode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {meetingMode === 'meeting_point' && <MeetingPointContent />}
              {meetingMode === 'pickup' && <PickupContent />}
              {meetingMode === 'none' && <NoneContent />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {meetingMode !== 'none' && (
        <DropoffSection />
      )}
    </div>
  )
}
