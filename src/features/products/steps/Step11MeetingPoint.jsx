import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { GYG_PICKUP_TRANSPORT } from '@/constants/gygLists'
import { ChevronDown, ChevronUp } from 'lucide-react'

const DEFAULT_CENTER = [2.3522, 48.8566]

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

export default function Step11MeetingPoint() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const areaInputRef = useRef(null)
  const [expandedCategories, setExpandedCategories] = useState([])
  
  const toggleCategory = (category) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const {
    meetingPoint,
    meetingPointDescription,
    arrivalTime,
    pickupProvided,
    pickupType,
    pickupDescription,
    referenceStartTime,
    pickupAreas,
    dropoffProvided,
    dropoffDescription,
    setField,
    addPickupArea,
    updatePickupArea,
    removePickupArea,
    pickupTransportTypes,
    addPickupTransportType,
    removePickupTransportType,
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
      marker.current = new maplibregl.Marker({ color: '#044b3b', draggable: true })
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

  return (
    <div className="max-w-[720px] space-y-7">
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Meeting point</h2>
        <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
          A specific place where you meet customers before an activity.
        </p>

        <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Meeting point address</label>
        <input
          className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring mb-3"
          type="text"
          value={meetingPoint?.address ?? ''}
          onChange={(e) =>
            setField('meetingPoint', {
              name: meetingPoint?.name ?? '',
              address: e.target.value,
              lat: meetingPoint?.lat ?? 0,
              lng: meetingPoint?.lng ?? 0,
            })
          }
          placeholder="Type an address..."
        />

        <div className="rounded-xl overflow-hidden border border-slate-200 mb-3">
          <div ref={mapContainer} style={{ height: '260px', width: '100%' }} />
        </div>

        <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Meeting point description</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
          rows={2}
          value={meetingPointDescription}
          onChange={(e) => setField('meetingPointDescription', e.target.value)}
          placeholder="What should customers look for? Any specific landmark?"
        />

        <label className="block text-[13px] font-semibold mb-1.5 mt-4 text-slate-600">
          When do customers need to arrive?
        </label>
        <input
          className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring max-w-[200px]"
          type="time"
          value={arrivalTime}
          onChange={(e) => setField('arrivalTime', e.target.value)}
        />
        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
          This information will appear on the customer voucher.
        </p>
      </div>

      <hr className="border-slate-200" />

      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Pickup</h2>
        <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
          Pickup can be by vehicle or on foot.
        </p>

        <div className="flex gap-4 flex-wrap mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="pickup"
              checked={pickupProvided}
              onChange={() => setField('pickupProvided', true)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="pickup"
              checked={!pickupProvided}
              onChange={() => setField('pickupProvided', false)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <span>No</span>
          </label>
        </div>

        {pickupProvided && (
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                Type of transportation
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="pickupType"
                    checked={pickupType === 'area'}
                    onChange={() => setField('pickupType', 'area')}
                    className="w-[18px] h-[18px] cursor-pointer"
                  />
                  <span>You&apos;ll pick them up at any address in areas you specify</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="pickupType"
                    checked={pickupType === 'address'}
                    onChange={() => setField('pickupType', 'address')}
                    className="w-[18px] h-[18px] cursor-pointer"
                  />
                  <span>You&apos;ll pick them up at specific places</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                Transportation type
              </label>
              <p className="text-[13px] text-slate-500 mb-2 leading-relaxed">
                Select the types of transportation used during the activity. Categories are grouped for easy selection.
              </p>
              <div className="space-y-3">
                {Object.entries(GYG_PICKUP_TRANSPORT).map(([category, types]) => {
                  const isExpanded = expandedCategories.includes(category)
                  return (
                    <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {category}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="p-3 space-y-2">
                          {types.map((type) => (
                            <label
                              key={type}
                              className={`flex items-center gap-2 cursor-pointer text-sm transition-all ${
                                pickupTransportTypes.includes(type)
                                  ? 'text-emerald-700'
                                  : 'text-slate-600 hover:text-slate-900'
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
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                Pickup description
              </label>
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
                rows={2}
                value={pickupDescription}
                onChange={(e) => setField('pickupDescription', e.target.value)}
                placeholder="Type of vehicle, signage to look for..."
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                Reference start time
              </label>
              <p className="text-[13px] text-slate-500 mb-1.5 leading-relaxed">
                Pick a start time that matches an actual start time on your listing. The offset between start time and pickup time is what we store.
              </p>
              <input
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring max-w-[200px]"
                type="time"
                value={referenceStartTime}
                onChange={(e) => setField('referenceStartTime', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                {pickupType === 'area' ? 'Pickup areas' : 'Pickup addresses'}
              </label>
              <div className="space-y-2 mb-2">
                {pickupAreas.map((area, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex gap-2 items-center">
                        <input
                          className="flex-1 min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring"
                          type="text"
                          value={area.name}
                          onChange={(e) => updatePickupArea(i, { name: e.target.value })}
                          placeholder={pickupType === 'area' ? 'Area name' : 'Address'}
                        />
                        <input
                          className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[130px]"
                          type="time"
                          value={area.time}
                          onChange={(e) => updatePickupArea(i, { time: e.target.value })}
                        />
                      </div>
                      {area.time && referenceStartTime && formatOffset(area.time, referenceStartTime) && (
                        <p className="text-[12px] text-emerald-600 font-medium ml-0.5">
                          Pickup: {formatOffset(area.time, referenceStartTime)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removePickupArea(i)}
                      className="shrink-0 mt-1 w-6 h-6 rounded-full border-0 bg-transparent text-slate-400 cursor-pointer grid place-items-center text-xs hover:text-red-500 hover:bg-red-50"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={areaInputRef}
                  className="flex-1 min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                  type="text"
                  placeholder={pickupType === 'area' ? 'Type an area and press Enter or click Add' : 'Type an address and press Enter or click Add'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = e.currentTarget.value.trim()
                      if (val) { addPickupArea(val); e.currentTarget.value = '' }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = areaInputRef.current
                    if (!input) return
                    const val = input.value.trim()
                    if (val) { addPickupArea(val); input.value = ''; input.focus() }
                  }}
                  className="shrink-0 h-[46px] px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold border-0 cursor-pointer hover:bg-emerald-700 transition-colors"
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Drop-off</h2>
        <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
          If you don&apos;t offer a drop-off service, select &quot;No drop-off service, the customer stays at the site or destination&quot;.
        </p>

        <div className="flex gap-4 flex-wrap mb-4">
<label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="dropoff"
                checked={dropoffProvided}
                onChange={() => setField('dropoffProvided', true)}
                className="w-[18px] h-[18px] cursor-pointer"
              />
              <span>Yes we drop off to same destination where picked up</span>
            </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="dropoff"
              checked={!dropoffProvided}
              onChange={() => setField('dropoffProvided', false)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <span>No drop-off service, the customer stays at the site or destination</span>
          </label>
        </div>

        {dropoffProvided && (
          <div>
            <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
              Drop-off description
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
              rows={2}
              value={dropoffDescription}
              onChange={(e) => setField('dropoffDescription', e.target.value)}
              placeholder="Describe the drop-off service..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
