import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import { useGeocoding } from '@/hooks/useGeocoding'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Pencil, GripVertical } from 'lucide-react'

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
  const errors = useStepErrors(5)
  const previewFocus = useProductBuilderStore((s) => s.previewFocus)
  const clearPreviewFocus = useProductBuilderStore((s) => s.clearPreviewFocus)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalIndex, setModalIndex] = useState(null)

  const inputRef = useRef(null)
  const dragIndex = useRef(null)

  const { search, results, loading, clear } = useGeocoding()

  useEffect(() => {
    if (previewFocus?.step === 'locations' && typeof previewFocus.index === 'number') {
      const t = setTimeout(() => {
        setModalIndex(previewFocus.index)
        clearPreviewFocus()
      }, 250)
      return () => clearTimeout(t)
    }
  }, [previewFocus, clearPreviewFocus])

  useEffect(() => {
    if (!searchQuery.trim()) { clear(); return }
    search(searchQuery)
  }, [searchQuery, search, clear])

  function selectResult(item) {
    const nextIndex = locations.length
    addLocation({
      name: '',
      address: item.formatted || '',
      lat: item.latitude != null ? Number(item.latitude) : undefined,
      lng: item.longitude != null ? Number(item.longitude) : undefined,
      city: item.city || '',
      country: item.country || '',
      region: item.region || '',
      description: '',
      timeSpent: null,
      timeSpentUnit: 'minutes',
      admissionIncluded: 'yes',
    })
    setModalIndex(nextIndex)
    setSearchQuery('')
    inputRef.current?.focus()
  }

  function addFallback() {
    const val = searchQuery.trim()
    if (!val) return
    const nextIndex = locations.length
    addLocation({
      name: '',
      address: val,
      description: '',
      timeSpent: null,
      timeSpentUnit: 'minutes',
      admissionIncluded: 'yes',
    })
    setModalIndex(nextIndex)
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
      e.stopPropagation()
    }
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
  const editingLoc = modalIndex != null ? locations[modalIndex] : null

  return (
    <div className="max-w-[720px] space-y-5">
      <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
        Which cities, sites, and attractions will your customers visit? Add all the locations your experience covers, it helps travelers find your tour and sets clear expectations.
      </p>

      <div className="relative max-w-[420px]">
        <div className="relative">
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

        {showDropdown && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-[280px] overflow-y-auto">
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
          <p className="text-[13px] font-semibold text-slate-600">
            Itinerary order ({locations.length})
          </p>
          <p className="text-[12px] text-slate-400 mb-2">
            Stops appear in this order on your itinerary, so arrange them to match the sequence travelers visit them. Drag the grip to reorder; your first stop is position 1.
          </p>
          <ul className="list-none p-0 m-0 space-y-2">
            {locations.map((loc, i) => (
              <li
                key={i}
                draggable
                onDragStart={() => { dragIndex.current = i }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null && dragIndex.current !== i) {
                    reorderLocations(dragIndex.current, i)
                    dragIndex.current = null
                  }
                }}
                className="rounded-xl border border-slate-100 bg-white text-sm transition-all hover:border-slate-200 hover:shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="shrink-0 flex w-7 h-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs select-none">
                    {i + 1}
                  </span>
                  <span
                    className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0 flex items-center"
                    title="Drag to reorder"
                  >
                    <GripVertical size={16} />
                  </span>
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => setModalIndex(i)}
                  >
                    <span className="font-medium text-slate-800">
                      {loc.address || loc.name}
                    </span>
                    {loc.address && loc.name && loc.name !== loc.address && (
                      <span className="block text-[12px] text-slate-400 mt-0.5 truncate">{loc.name}</span>
                    )}
                    {loc.city && (
                      <span className="block text-[12px] text-slate-400 mt-0.5 truncate">
                        📍 {loc.city}{loc.country ? `, ${loc.country}` : ''}
                      </span>
                    )}
                    {hasDetails(loc) ? (
                      <span className="block text-[12px] text-slate-400 mt-0.5 truncate">
                        {detailSummary(loc)}
                      </span>
                    ) : (
                      <span className="block text-[12px] text-slate-300 mt-0.5 italic">
                        Add details &rarr;
                      </span>
                    )}
                  </div>
                  <button
                    className="shrink-0 w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-400 cursor-pointer grid place-items-center hover:border-slate-300 hover:text-slate-600 transition-colors"
                    onClick={() => setModalIndex(i)}
                    type="button"
                    title="Edit details"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="shrink-0 w-7 h-7 rounded-lg border-0 bg-transparent text-slate-400 cursor-pointer grid place-items-center text-xs hover:text-red-600 hover:bg-red-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeLocation(i)
                    }}
                    type="button"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {locations.length >= 2 && (
            <p className="text-[12px] text-slate-400 mt-2">
              Stops display in order
            </p>
          )}
          {errors.locations && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.locations[0]}</span>}
        </div>
      )}

      <p className="text-[13px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
        You can edit these locations and their order anytime, even after the product is published. Confirm the sequence now so travelers see the experience in the right order.
      </p>

      <AnimatePresence>
        {editingLoc && (
          <LocationModal
            index={modalIndex}
            loc={editingLoc}
            onClose={() => setModalIndex(null)}
            onUpdate={updateLocation}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function LocationModal({ index, loc, onClose, onUpdate }) {
  const [errors, setErrors] = useState({})

  function update(field, value) {
    onUpdate(index, { [field]: value })
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate() {
    const next = {}
    if (!loc.name || !loc.name.trim()) next.name = 'Name is required'
    if (!loc.description || !loc.description.trim()) next.description = 'Description is required'
    if (loc.timeSpent == null || Number(loc.timeSpent) <= 0) next.timeSpent = 'Estimated time spent is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleDone() {
    if (validate()) onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {loc.name ? 'Edit location' : 'Add location details'}
            </h3>
            <p className="text-[13px] text-slate-500 mt-0.5">
              All fields are required to save this stop.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors bg-transparent border-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-slate-400 mb-1.5">
              Use a clear, recognizable name so travelers can identify this stop at a glance.
            </p>
            <input
              className={`w-full h-11 border bg-white px-3 text-sm outline-none focus:border-emerald-500 transition-colors ${
                errors.name ? 'border-red-400' : 'border-slate-300'
              }`}
              type="text"
              value={loc.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Komfo Anokye Teaching Hospital"
            />
            {errors.name && <span className="block text-[13px] text-red-600 font-medium mt-1">{errors.name}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-slate-400 mb-1.5">
              Describe what travelers will experience here, including standout features and why this stop is worth visiting.
            </p>
            <textarea
              className={`w-full h-20 border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors resize-vertical ${
                errors.description || (loc.description || '').length >= 500
                  ? 'border-red-300'
                  : 'border-slate-300'
              } ${errors.description ? 'text-red-600' : ''}`}
              value={loc.description || ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe what travelers will experience at this location, including any notable features or activities."
              maxLength={500}
            />
            {errors.description && <span className="block text-[13px] text-red-600 font-medium mt-1">{errors.description}</span>}
            <p className={`text-[12px] mt-1 text-right font-medium ${(loc.description || '').length >= 500 ? 'text-red-600' : 'text-slate-400'}`}>{(loc.description || '').length}/500</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Estimated time spent at this location <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-slate-400 mb-1.5">
              Estimate how long the group typically stays here so travelers can plan their day and understand the pace.
            </p>
            <div className="flex gap-2">
              <input
                className={`h-11 w-24 border bg-white px-3 text-sm outline-none focus:border-emerald-500 transition-colors ${
                  errors.timeSpent ? 'border-red-400' : 'border-slate-300'
                }`}
                type="number"
                min="0"
                value={loc.timeSpent ?? ''}
                onChange={(e) => update('timeSpent', e.target.value ? Number(e.target.value) : null)}
                placeholder="0"
              />
              <Select
                value={loc.timeSpentUnit || 'minutes'}
                onValueChange={(v) => onUpdate(index, { timeSpentUnit: v })}
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
            {errors.timeSpent && <span className="block text-[13px] text-red-600 font-medium mt-1">{errors.timeSpent}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Does the tour price include admission to this attraction? <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-slate-400 mb-2">
              Let travelers know whether entry is included in the tour price, paid separately, or free to enter.
            </p>
            <div className="space-y-1.5">
              {ADMISSION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name={`admission-${index}`}
                    checked={(loc.admissionIncluded || 'yes') === opt.value}
                    onChange={() => update('admissionIncluded', opt.value)}
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
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-transparent border-0 cursor-pointer hover:text-slate-800 transition-colors"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors border-0 cursor-pointer"
            onClick={handleDone}
            type="button"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}