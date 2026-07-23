import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useGeocoding } from '@/hooks/useGeocoding'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { ChevronDown, GripVertical } from 'lucide-react'

const VISIT_TYPES = [
  { value: 'visit', label: 'Visit' },
  { value: 'pass_by', label: 'Pass by' },
  { value: 'guided_tour', label: 'Guided tour' },
  { value: 'free_time', label: 'Free time' },
  { value: 'photo_stop', label: 'Photo stop' },
]

const ADMISSION_OPTIONS = [
  { value: 'yes', label: 'Yes', desc: 'Admission is covered by the tour price.' },
  { value: 'no', label: 'No', desc: 'Travelers pay separately at the venue.' },
  { value: 'na', label: 'Free admission', desc: 'Entry to this attraction is complimentary.' },
]

const ADMISSION_LABELS = { yes: 'Admission included', no: 'Pay separately', na: 'Free admission' }

export default function Step05Locations() {
  const locations = useProductBuilderStore((s) => s.locations)
  const addLocation = useProductBuilderStore((s) => s.addLocation)
  const removeLocation = useProductBuilderStore((s) => s.removeLocation)
  const updateLocation = useProductBuilderStore((s) => s.updateLocation)
  const reorderLocations = useProductBuilderStore((s) => s.reorderLocations)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVT, setSelectedVT] = useState('visit')
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [expandedIdx, setExpandedIdx] = useState(null)

  const inputRef = useRef(null)

  const { search, results, loading, clear } = useGeocoding()

  useEffect(() => {
    if (!searchQuery.trim()) { clear(); return }
    search(searchQuery)
  }, [searchQuery, search, clear])

  function selectResult(item) {
    setExpandedIdx(locations.length)
    addLocation({
      name: item.name || item.city || searchQuery.trim(),
      visitType: selectedVT,
      address: item.formatted || '',
      lat: item.latitude ?? null,
      lng: item.longitude ?? null,
      description: '',
      timeSpent: null,
      timeSpentUnit: 'minutes',
      admissionIncluded: 'yes',
    })
    setSearchQuery('')
    inputRef.current?.focus()
  }

  function addFallback() {
    const val = searchQuery.trim()
    if (!val) return
    setExpandedIdx(locations.length)
    addLocation({
      name: val,
      visitType: selectedVT,
      address: '',
      lat: null,
      lng: null,
      description: '',
      timeSpent: null,
      timeSpentUnit: 'minutes',
      admissionIncluded: 'yes',
    })
    setSearchQuery('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (results.length > 0) {
        selectResult(results[0])
      } else if (searchQuery.trim()) {
        addFallback()
      }
    }
    if (e.key === 'Escape') {
      clear()
      setSearchQuery('')
    }
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
    reorderLocations(dragIdx, index)
    setDragIdx(null)
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    setDragIdx(null)
    setDragOverIdx(null)
  }

  function toggleExpand(index) {
    setExpandedIdx(expandedIdx === index ? null : index)
  }

  function hasDetails(loc) {
    return loc.description || loc.timeSpent != null || loc.admissionIncluded
  }

  function detailSummary(loc) {
    const parts = []
    if (loc.timeSpent != null) {
      parts.push(`${loc.timeSpent} ${loc.timeSpentUnit}`)
    }
    if (loc.admissionIncluded) {
      parts.push(ADMISSION_LABELS[loc.admissionIncluded] || '')
    }
    if (loc.description) {
      parts.push(loc.description.length > 40 ? loc.description.slice(0, 40) + '...' : loc.description)
    }
    return parts.join(' · ')
  }

  const showDropdown = searchQuery.trim().length > 0 && (results.length > 0 || loading)

  return (
    <div className="max-w-[720px] space-y-5">
      <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
        Which cities, sites, and attractions will your customers visit? Add all the locations your experience covers, it helps travelers find your tour and sets clear expectations.
      </p>

      <div className="relative">
        <div className="flex gap-2.5 items-end">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm transition-all focus-ring"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a location or point of interest..."
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); clear() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0.5"
              >
                ✕
              </button>
            )}
            {loading && (
              <div className="absolute right-9 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
          <Select value={selectedVT} onValueChange={setSelectedVT}>
            <SelectTrigger className="w-[140px] shrink-0">
              <SelectValue placeholder="Visit type" />
            </SelectTrigger>
            <SelectContent>
              {VISIT_TYPES.map((vt) => (
                <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            className="shrink-0 h-[46px] px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold border-0 cursor-pointer hover:bg-emerald-700 transition-colors"
            onClick={() => {
              if (results.length > 0) selectResult(results[0])
              else if (searchQuery.trim()) addFallback()
            }}
            type="button"
          >
            Add
          </button>
        </div>

        {showDropdown && (
          <div className="absolute z-20 left-0 right-[232px] top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-[280px] overflow-y-auto">
            {loading && results.length === 0 && (
              <div className="px-3.5 py-3 text-sm text-slate-400">Searching...</div>
            )}
            {results.map((item, i) => (
              <button
                key={i}
                type="button"
                className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 cursor-pointer border-0 bg-transparent border-b border-slate-100 last:border-b-0 transition-colors"
                onClick={() => selectResult(item)}
              >
                <svg className="shrink-0 mt-0.5 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div className="min-w-0 flex-1">
                  <span className="block font-medium text-slate-800 truncate">
                    {item.formatted || item.name || item.city || searchQuery}
                  </span>
                  <span className="block text-[12px] text-slate-400 truncate">
                    {[item.city, item.country].filter(Boolean).join(', ')}
                    {item.source && (
                      <span className={`ml-1.5 inline-block px-1 py-[1px] rounded text-[10px] font-medium ${
                        item.source === 'geoapify' ? 'bg-emerald-50 text-emerald-600' :
                        item.source === 'nominatim' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {item.source}
                      </span>
                    )}
                  </span>
                </div>
              </button>
            ))}
            {!loading && results.length === 0 && (
              <div className="px-3.5 py-3 text-sm text-slate-500 space-y-2">
                <p>No results found.</p>
                <button
                  type="button"
                  onClick={addFallback}
                  className="text-emerald-600 font-medium hover:text-emerald-700 bg-transparent border-0 cursor-pointer p-0"
                >
                  Add &ldquo;{searchQuery.trim()}&rdquo; as a custom location
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {locations.length > 0 && (
        <div data-field="locations">
          <p className="text-[13px] font-semibold text-slate-600 mb-2">
            Added locations ({locations.length}) — drag to reorder
          </p>
          <ul className="list-none p-0 m-0 space-y-2">
            {locations.map((loc, i) => {
              const isExpanded = expandedIdx === i
              return (
                <li
                  key={i}
                  className={`rounded-xl border text-sm transition-all overflow-hidden ${
                    dragOverIdx === i && dragIdx !== i
                      ? 'border-emerald-400 bg-emerald-50'
                      : dragIdx === i
                      ? 'border-slate-300 bg-slate-50 opacity-60'
                      : isExpanded
                      ? 'border-slate-300 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 px-3 py-2 ${
                      !isExpanded ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => { if (!isExpanded) toggleExpand(i) }}
                  >
                    <span
                      className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0 flex items-center"
                      title="Drag to reorder"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <GripVertical size={16} />
                    </span>
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => toggleExpand(i)}
                    >
                      <span className="font-medium text-slate-800">{loc.address || loc.name}</span>
                      {loc.address && loc.name && loc.name !== loc.address && (
                        <span className="block text-[12px] text-slate-400 mt-0.5 truncate">{loc.name}</span>
                      )}
                      {!isExpanded && hasDetails(loc) && (
                        <span className="block text-[12px] text-slate-400 mt-0.5 truncate">
                          {detailSummary(loc)}
                        </span>
                      )}
                      {!isExpanded && !hasDetails(loc) && (
                        <span className="block text-[12px] text-slate-300 mt-0.5 italic">
                          Add details &rarr;
                        </span>
                      )}
                    </div>
                    <Select
                      value={loc.visitType}
                      onValueChange={(v) => updateLocation(i, { visitType: v })}
                    >
                      <SelectTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-[30px] h-[30px] text-[13px] px-2 py-0 border-slate-200 rounded-lg w-[110px] shrink-0"
                      >
                        <SelectValue placeholder="Visit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIT_TYPES.map((vt) => (
                          <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isExpanded && (
                      <button
                        className="shrink-0 w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-pointer grid place-items-center text-xs hover:border-slate-300 hover:text-slate-600 transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(i) }}
                        type="button"
                        title="Edit details"
                      >
                        <ChevronDown size={16} />
                      </button>
                    )}
                    <button
                      className="shrink-0 w-7 h-7 rounded-lg border-0 bg-transparent text-slate-400 cursor-pointer grid place-items-center text-xs hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeLocation(i)
                        if (isExpanded) setExpandedIdx(null)
                      }}
                      type="button"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 px-4 py-4 space-y-4 bg-white"
                    >
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          className="w-full h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 transition-colors"
                          type="text"
                          value={loc.name}
                          onChange={(e) => updateLocation(i, { name: e.target.value })}
                          placeholder="e.g. Komfo Anokye Teaching Hospital"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Description
                        </label>
                        <textarea
                          className="w-full h-20 border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors resize-vertical"
                          value={loc.description || ''}
                          onChange={(e) => updateLocation(i, { description: e.target.value })}
                          placeholder="Describe what travelers will experience at this location, including any notable features or activities."
                          maxLength={500}
                        />
                        <p className="text-[12px] text-slate-400 mt-1 text-right">{(loc.description || '').length}/500</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Typical time spent at this location
                        </label>
                        <div className="flex gap-2">
                          <input
                            className="w-24 h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 transition-colors"
                            type="number"
                            min="0"
                            value={loc.timeSpent ?? ''}
                            onChange={(e) => updateLocation(i, { timeSpent: e.target.value ? Number(e.target.value) : null })}
                            placeholder="0"
                          />
                          <Select
                            value={loc.timeSpentUnit || 'minutes'}
                            onValueChange={(v) => updateLocation(i, { timeSpentUnit: v })}
                          >
                            <SelectTrigger className="h-11 w-[120px] border-slate-300 px-3 text-sm">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-[12px] text-slate-400 mt-1">
                          Approximate duration your group stays at this location.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Does the tour price include admission to this attraction?
                        </label>
                        <div className="space-y-1.5">
                          {ADMISSION_OPTIONS.map((opt) => (
                            <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer group">
                              <input
                                type="radio"
                                name={`admission-${i}`}
                                checked={(loc.admissionIncluded || 'yes') === opt.value}
                                onChange={() => updateLocation(i, { admissionIncluded: opt.value })}
                                className="mt-0.5 shrink-0"
                              />
                              <div>
                                <span className="text-sm text-slate-700 group-hover:text-slate-900">{opt.label}</span>
                                <p className="text-[12px] text-slate-400">{opt.desc}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                          className="px-4 py-2 text-sm font-medium text-slate-600 bg-transparent border-0 cursor-pointer hover:text-slate-800 transition-colors"
                          onClick={() => toggleExpand(i)}
                          type="button"
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="text-[13px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
        Locations cannot be edited after the product is published. Add details for each location to give travelers a clear picture of what to expect.
      </p>
    </div>
  )
}