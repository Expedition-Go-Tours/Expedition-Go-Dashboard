import { useMemo, useRef, useState } from 'react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import { useGeocoding } from '@/hooks/useGeocoding'
import { GripVertical, Clock, MapPin, MoreVertical, Navigation, Info, Search, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

const CATEGORIES_WITH_ITINERARY = [
  'Day trip', 'Guided walking tour', 'Guided motorized tour',
  'Panoramic bus tour', 'City cruise', 'Boat tour', 'Multi-day tour',
]

export default function Step13Itinerary() {
  const category = useProductBuilderStore((s) => s.category)
  const itinerary = useProductBuilderStore((s) => s.itinerary)
  const meetingPoint = useProductBuilderStore((s) => s.meetingPoint)
  const pickupDescription = useProductBuilderStore((s) => s.pickupDescription)
  const dropoffDescription = useProductBuilderStore((s) => s.dropoffDescription)
  const addItineraryEntry = useProductBuilderStore((s) => s.addItineraryEntry)
  const addItinerarySegment = useProductBuilderStore((s) => s.addItinerarySegment)
  const updateItineraryEntry = useProductBuilderStore((s) => s.updateItineraryEntry)
  const removeItineraryEntry = useProductBuilderStore((s) => s.removeItineraryEntry)
  const reorderItineraryEntry = useProductBuilderStore((s) => s.reorderItineraryEntry)
  const insertItineraryEntry = useProductBuilderStore((s) => s.insertItineraryEntry)
  const errors = useStepErrors(14)

  const [activeLocSearch, setActiveLocSearch] = useState(null)
  const [locSearchQueries, setLocSearchQueries] = useState({})
  const searchRefs = useRef({})
  const { search: geoSearch, results: geoResults, loading: geoLoading, clear: geoClear } = useGeocoding()

  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const uniqueDays = useMemo(() => {
    const days = [...new Set(itinerary.map((e) => e.day))]
    return days.sort((a, b) => a - b)
  }, [itinerary])

  function getEntriesForDay(day) {
    return itinerary
      .map((entry, idx) => ({ ...entry, _index: idx }))
      .filter((e) => e.day === day)
  }

  function handleDragStart(index) {
    setDragIdx(index)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
    setDragOverIdx(index)
  }

  function handleDrop(index) {
    if (dragIdx === null || dragIdx === index) return
    reorderItineraryEntry(dragIdx, index)
    setDragIdx(null)
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    setDragIdx(null)
    setDragOverIdx(null)
  }

  function handleDuplicate(index) {
    const entry = itinerary[index]
    if (!entry) return
    const { _index, ...rest } = entry
    insertItineraryEntry(index + 1, rest)
  }

  function handleLocSearchChange(entryIdx, value) {
    setLocSearchQueries((prev) => ({ ...prev, [entryIdx]: value }))
    if (value.trim()) {
      geoSearch(value)
    } else {
      geoClear()
    }
  }

  function openLocSearch(entryIdx) {
    setActiveLocSearch(entryIdx)
    const query = locSearchQueries[entryIdx] || ''
    if (query.trim()) geoSearch(query)
    setTimeout(() => searchRefs.current[entryIdx]?.focus(), 50)
  }

  function selectLocResult(entryIdx, item) {
    const name = item.formatted || item.city || item.name || locSearchQueries[entryIdx] || ''
    updateItineraryEntry(entryIdx, {
      locationName: name,
      locationAddress: item.formatted || '',
      locationLat: item.latitude ?? null,
      locationLng: item.longitude ?? null,
      isCustomLocation: false,
    })
    setLocSearchQueries((prev) => ({ ...prev, [entryIdx]: '' }))
    setActiveLocSearch(null)
    geoClear()
  }

  function setCustomLocation(entryIdx) {
    const val = (locSearchQueries[entryIdx] || '').trim()
    if (!val) return
    updateItineraryEntry(entryIdx, {
      locationName: val,
      locationAddress: '',
      locationLat: null,
      locationLng: null,
      isCustomLocation: true,
    })
    setLocSearchQueries((prev) => ({ ...prev, [entryIdx]: '' }))
    setActiveLocSearch(null)
    geoClear()
  }

  function clearLocation(entryIdx) {
    updateItineraryEntry(entryIdx, {
      locationName: '',
      locationAddress: '',
      locationLat: null,
      locationLng: null,
      isCustomLocation: false,
    })
    setLocSearchQueries((prev) => ({ ...prev, [entryIdx]: '' }))
  }

  function handleLocKeyDown(e, entryIdx) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (geoResults.length > 0) {
        selectLocResult(entryIdx, geoResults[0])
      } else if ((locSearchQueries[entryIdx] || '').trim()) {
        setCustomLocation(entryIdx)
      }
    }
    if (e.key === 'Escape') {
      setActiveLocSearch(null)
      geoClear()
    }
  }

  if (!CATEGORIES_WITH_ITINERARY.includes(category)) {
    return (
      <div className="max-w-[720px]">
        <p className="text-[13px] text-slate-500 leading-relaxed">
          Itinerary builder is not available for {category.toLowerCase()} products.
          It is supported for: {CATEGORIES_WITH_ITINERARY.join(', ')}.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-[840px]">
      <label className="block text-sm font-semibold mb-2 text-slate-800">
        {category === 'Multi-day tour'
          ? 'Build your day-by-day itinerary'
          : 'Build your activity itinerary'}
      </label>
      <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
        Add segments with times, locations, and descriptions to show travelers what each day looks like.
      </p>

      {/* Info banner: start/end points */}
      {(meetingPoint?.name || pickupDescription || dropoffDescription) && (
        <div className="flex items-start gap-3 mb-6 p-4 rounded-xl border border-emerald-200/60 bg-emerald-50/60">
          <Info size={16} className="text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-[13px] text-slate-600 leading-relaxed space-y-1">
            {meetingPoint?.name && (
              <p><span className="font-medium text-slate-700">Start:</span> {meetingPoint.name}{meetingPoint.address ? `, ${meetingPoint.address}` : ''}</p>
            )}
            {dropoffDescription && (
              <p><span className="font-medium text-slate-700">End:</span> {dropoffDescription}</p>
            )}
            {pickupDescription && !meetingPoint?.name && (
              <p><span className="font-medium text-slate-700">Pickup:</span> {pickupDescription}</p>
            )}
          </div>
        </div>
      )}

      {itinerary.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm text-slate-400 mb-3">No itinerary entries yet</p>
          <button
            type="button"
            onClick={addItineraryEntry}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            + Add first day
          </button>
        </div>
      ) : (
        <div>
          {/* Days wrapper with timeline rail */}
          <div className="relative">
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-linear-to-b from-emerald-300 via-emerald-400 to-emerald-300 rounded-full opacity-60" />

            {uniqueDays.map((day) => {
              const entries = getEntriesForDay(day)

              return (
                <div key={day} className="mb-8 last:mb-0">
                  {/* Day header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-linear-to-r from-emerald-200/40 to-transparent" />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 shadow-sm">
                      Day {day}
                    </span>
                    <div className="h-px flex-1 bg-linear-to-l from-emerald-200/40 to-transparent" />
                  </div>

                  {/* Entries for this day */}
                  <div className="space-y-3">
                    {entries.map((entry) => {
                    const isDragging = dragIdx === entry._index
                    const isDragOver = dragOverIdx === entry._index
                    const isLocSearchOpen = activeLocSearch === entry._index
                    const locQuery = locSearchQueries[entry._index] || ''
                    const hasLocation = entry.locationName

                    return (
                      <div
                        key={entry._index}
                        className={`relative pl-[46px] transition-opacity ${isDragging ? 'opacity-40' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(entry._index)}
                        onDragOver={(e) => handleDragOver(e, entry._index)}
                        onDrop={() => handleDrop(entry._index)}
                        onDragEnd={handleDragEnd}
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-[17px] top-[22px] z-10">
                          <div className="w-[13px] h-[13px] rounded-full bg-emerald-500 ring-[3px] ring-emerald-100 shadow-sm" />
                        </div>

                        {/* Drag hint line */}
                        {isDragOver && (
                          <div className="absolute left-[46px] right-0 top-0 h-0.5 bg-emerald-400 rounded-full" />
                        )}

                        {/* Entry card */}
                        <div className={`rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 transition-shadow ${isDragOver ? 'shadow-md shadow-emerald-200/40 ring-1 ring-emerald-200' : ''}`}>
                          {/* Top row: drag handle + type toggle + time */}
                          <div className="flex items-center gap-2 p-4 pb-0">
                            <span className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 shrink-0" title="Drag to reorder">
                              <GripVertical size={16} />
                            </span>

                            {/* Type toggle */}
                            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateItineraryEntry(entry._index, { type: 'activity' })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors ${entry.type === 'activity' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                              >
                                <MapPin size={13} />
                                Activity
                              </button>
                              <button
                                type="button"
                                onClick={() => updateItineraryEntry(entry._index, { type: 'transfer' })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors ${entry.type === 'transfer' ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                              >
                                <Navigation size={13} />
                                Transfer
                              </button>
                            </div>

                            {/* Time input */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <Clock size={14} className="text-slate-400" />
                              <input
                                type="time"
                                className="min-h-[32px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm transition-all focus-ring w-[120px]"
                                value={entry.time || ''}
                                onChange={(e) => updateItineraryEntry(entry._index, { time: e.target.value })}
                              />
                            </div>

                            {/* 3-dot menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors bg-transparent cursor-pointer"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[180px]">
                                <DropdownMenuItem onClick={() => handleDuplicate(entry._index)}>
                                  Duplicate segment
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => removeItineraryEntry(entry._index)}
                                  className="!text-red-600 focus:!text-red-700 focus:!bg-red-50"
                                >
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Duration row */}
                          <div className="flex items-center gap-2 px-4 pt-3">
                            <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium w-[70px] shrink-0">
                              <Clock size={14} className="text-slate-400" />
                              Duration
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[70px] text-center"
                              value={entry.duration ?? ''}
                              placeholder="0"
                              onChange={(e) => updateItineraryEntry(entry._index, { duration: e.target.value ? Number(e.target.value) : null })}
                            />
                            <select
                              className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm transition-all focus-ring"
                              value={entry.durationUnit || 'hour'}
                              onChange={(e) => updateItineraryEntry(entry._index, { durationUnit: e.target.value })}
                            >
                              <option value="minute">min</option>
                              <option value="hour">hr</option>
                              <option value="day">day</option>
                            </select>
                          </div>

                          {/* Location row */}
                          <div className="flex items-start gap-2 px-4 pt-3">
                            <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium w-[70px] shrink-0 mt-1.5">
                              <MapPin size={14} className="text-slate-400" />
                              Location
                            </div>
                            <div className="flex-1 relative">
                              {hasLocation && !isLocSearchOpen ? (
                                <div className="flex items-center gap-2 min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                                  <span className="text-sm text-slate-700 flex-1 truncate">
                                    {entry.locationName}
                                    {entry.locationAddress && entry.locationAddress !== entry.locationName && (
                                      <span className="text-slate-400 ml-1">— {entry.locationAddress}</span>
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openLocSearch(entry._index)}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium bg-transparent border-0 cursor-pointer shrink-0"
                                  >
                                    Change
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => clearLocation(entry._index)}
                                    className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0.5"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  <input
                                    ref={(el) => { searchRefs.current[entry._index] = el }}
                                    type="text"
                                    className="w-full min-h-[36px] rounded-lg border border-slate-200 bg-white pl-[34px] pr-3 py-1.5 text-sm transition-all focus-ring"
                                    placeholder="Search location..."
                                    value={locQuery}
                                    onChange={(e) => handleLocSearchChange(entry._index, e.target.value)}
                                    onKeyDown={(e) => handleLocKeyDown(e, entry._index)}
                                  />
                                  {locQuery && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLocSearchQueries((prev) => ({ ...prev, [entry._index]: '' }))
                                        geoClear()
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0.5"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}

                                  {/* Autocomplete dropdown */}
                                  {locQuery.trim() && (
                                    <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 overflow-hidden">
                                      {geoLoading ? (
                                        <div className="px-4 py-3 text-[13px] text-slate-400">Searching...</div>
                                      ) : geoResults.length > 0 ? (
                                        <div>
                                          {geoResults.map((item, i) => {
                                            const label = item.formatted || item.city || item.name || ''
                                            return (
                                              <button
                                                key={i}
                                                type="button"
                                                onClick={() => selectLocResult(entry._index, item)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
                                              >
                                                <span className="font-medium">{label}</span>
                                                {item.country && <span className="text-slate-400 ml-1">· {item.country}</span>}
                                              </button>
                                            )
                                          })}
                                          <div className="border-t border-slate-100">
                                            <button
                                              type="button"
                                              onClick={() => setCustomLocation(entry._index)}
                                              className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
                                            >
                                              Use &ldquo;{locQuery.trim()}&rdquo; as custom location
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="px-4 py-3 text-[13px] text-slate-400">No results found</div>
                                          <div className="border-t border-slate-100">
                                            <button
                                              type="button"
                                              onClick={() => setCustomLocation(entry._index)}
                                              className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors border-0 bg-transparent cursor-pointer"
                                            >
                                              Use &ldquo;{locQuery.trim()}&rdquo; as custom location
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <div className="flex items-start gap-2 px-4 pt-3">
                            <div className="text-[13px] text-slate-500 font-medium w-[70px] shrink-0 mt-1.5">Description</div>
                            <textarea
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-ring resize-vertical"
                              rows={2}
                              value={entry.description}
                              onChange={(e) => updateItineraryEntry(entry._index, { description: e.target.value })}
                              placeholder="What happens at this point? Main sites, activities, meals..."
                            />
                          </div>

                          {/* Toggles + segment end padding */}
                          <div className="flex items-center justify-between px-4 pt-3 pb-4">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 cursor-pointer text-[13px] text-slate-500">
                                <input
                                  type="checkbox"
                                  checked={!!entry.isOptional}
                                  onChange={(e) => updateItineraryEntry(entry._index, { isOptional: e.target.checked })}
                                  className="w-[16px] h-[16px] cursor-pointer"
                                />
                                Optional
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[13px] text-slate-500">
                                <input
                                  type="checkbox"
                                  checked={!!entry.additionalFee}
                                  onChange={(e) => updateItineraryEntry(entry._index, { additionalFee: e.target.checked })}
                                  className="w-[16px] h-[16px] cursor-pointer"
                                />
                                Additional fee
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Add segment to this day */}
                <div className="pl-[46px] mt-3">
                  <button
                    type="button"
                    onClick={() => addItinerarySegment(day)}
                    className="px-3 py-1.5 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors bg-transparent cursor-pointer"
                  >
                    + Add segment
                  </button>
                </div>
              </div>
            )
          })}

          </div>

          {/* Add day button — outside the timeline rail */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={addItineraryEntry}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors bg-transparent cursor-pointer"
            >
              + Add day
            </button>
          </div>
        </div>
      )}

      {errors.itinerary && (
        <span className="text-[13px] text-red-600 font-medium mt-3 flex items-center gap-1">
          {errors.itinerary[0]}
        </span>
      )}
    </div>
  )
}
