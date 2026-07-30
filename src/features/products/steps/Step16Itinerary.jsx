import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import { createProduct, updateProduct } from '@/features/products/api'
import { buildPayload } from '@/features/products/useAutoSave'
import { useGeocoding } from '@/hooks/useGeocoding'
import { ITINERARY_ACTIVITY_CATEGORIES } from '@/constants/gygLists'
import {
  HelpCircle, Info, Search, X, Plus, ArrowLeft, MoreHorizontal, Calendar, MapPin,
} from 'lucide-react'

async function saveCurrentProduct() {
  const s = useProductBuilderStore.getState()
  const payload = buildPayload(s)
  s.setSaving(true)
  try {
    if (s.savedProductId) {
      await updateProduct(s.savedProductId, payload, { skipGlobalErrorHandler: true })
    } else {
      const res = await createProduct(payload, { skipGlobalErrorHandler: true })
      const newId = res.data?.data?.tour?.id
      if (newId) s.setSavedProductId(newId)
    }
    s.markSaved()
    return true
  } catch {
    return false
  } finally {
    s.setSaving(false)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive number of days from store duration/durationUnit */
function getNumDays(duration, durationUnit) {
  if (!duration) return 1
  if (durationUnit === 'days') return Math.max(1, Math.round(duration))
  if (durationUnit === 'hours' && duration >= 24) return Math.max(1, Math.floor(duration / 24))
  return 1
}

/** Compute a human-readable duration label from minutes */
function durationLabel(totalMin) {
  if (!totalMin) return ''
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0 && m > 0) return `(${h}h${m}min)`
  if (h > 0) return `(${h}h)`
  return `(${m}min)`
}

// ─── Brand icons ──────────────────────────────────────────────────────────────

function GIcon({ size = 40 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative z-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0"
    >
      <MapPin size={size * 0.45} strokeWidth={2} />
    </div>
  )
}

function OrangeCircle({ size = 40 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative z-10 rounded-full bg-emerald-600 shrink-0"
    />
  )
}

function ActivityNode({ isOptional = false }) {
  if (isOptional) {
    return (
      <div className="relative z-10 w-10 h-10 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center shrink-0" />
    )
  }
  return (
    <div className="relative z-10 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
      <Plus size={18} strokeWidth={2.5} />
    </div>
  )
}

function CalendarNode({ size = 40 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative z-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0"
    >
      <Calendar size={size * 0.45} strokeWidth={2} />
    </div>
  )
}

// ─── Activity Select Modal ────────────────────────────────────────────────────
function ActivitySelectModal({ currentValue, onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState('General tourism')
  const tabs = Object.keys(ITINERARY_ACTIVITY_CATEGORIES)

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[660px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Select Activity</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-0 px-6 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {Object.entries(ITINERARY_ACTIVITY_CATEGORIES[activeTab] || {}).map(([section, items]) => (
            <div key={section} className="mb-5">
              <h4 className="text-sm font-bold text-slate-800 mb-2">{section}</h4>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                {items.map((item) => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={currentValue === item}
                      onChange={() => { onSelect(item); onClose() }}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 shrink-0"
                    />
                    <span className="text-sm text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-emerald-50 border-t border-slate-100">
          <p className="text-xs text-emerald-700 flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            If you can't find an activity that describes this part of your experience please{' '}
            <span className="font-bold underline cursor-pointer">request a new activity</span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── Location Search Dropdown ─────────────────────────────────────────────────
function LocationSearch({ selected, onSelect, taggedLocations = [] }) {
  const [search, setSearch] = useState(selected?.name || '')
  const [open, setOpen] = useState(false)
  const { search: geoSearch, results, loading } = useGeocoding()
  const ref = useRef(null)

  useEffect(() => {
    if (search.length > 1) geoSearch(search)
  }, [search, geoSearch])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allResults = useMemo(() => {
    const q = search.toLowerCase()
    const tagged = taggedLocations.filter(
      (l) => l.name?.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q)
    )
    const geo = results.map((r) => ({
      name: r.formatted?.split(',').slice(0, 2).join(',') || '',
      address: r.formatted || '',
      lat: r.latitude,
      lng: r.longitude,
    }))
    return [...tagged, ...geo]
  }, [search, results, taggedLocations])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); if (!e.target.value) onSelect(null) }}
          onFocus={() => setOpen(true)}
          placeholder="Search for locations"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* selected chip */}
      {selected && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
            {selected.name || selected.address}
            <button type="button" onClick={() => { onSelect(null); setSearch('') }} className="p-0.5 hover:bg-slate-200 rounded">
              <X size={12} />
            </button>
          </span>
          <span className="text-xs text-slate-400 self-center">1 / 1</span>
        </div>
      )}

      {open && !selected && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="text-right px-3 py-1.5 text-xs text-slate-400 border-b border-slate-100">
            0 / 1 locations selected
          </div>
          <div className="max-h-52 overflow-y-auto">
            {allResults.map((loc, i) => (
              <label key={i} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-emerald-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => { onSelect(loc); setSearch(loc.name || loc.address); setOpen(false) }}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 shrink-0"
                />
                <span className="text-sm text-slate-700">{loc.name || loc.address}</span>
              </label>
            ))}
            {allResults.length === 0 && !loading && search.length > 1 && (
              <p className="px-3.5 py-3 text-sm text-slate-400">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Transport Mode Icon ─────────────────────────────────────────────────────
function TransportIcon({ mode, size = 18 }) {
  const icons = {
    car: 'M5 11l1.5-4.5h11L19 11M5 11v5h2v-2h10v2h2v-5M7 15a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm10 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
    minivan: 'M3 12l2-5h14l2 5M3 12v4h2v-2h14v2h2v-4M5 16a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0z',
    bus: 'M4 16V6a2 2 0 012-2h12a2 2 0 012 2v10M4 16h16M4 16v2a1 1 0 001 1h2a1 1 0 001-1v-2m10 0v2a1 1 0 001 1h2a1 1 0 001-1v-2M7 10h10M7 13h10',
    boat: 'M2 20l10-4 10 4M12 4v12M8 8l4-4 4 4',
    plane: 'M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
    train: 'M5 4h14M5 4v12a2 2 0 002 2h10a2 2 0 002-2V4M5 4h14M8 20h8M8 20l-1 2M16 20l1 2M8 10h8M8 13h8',
    bicycle: 'M12 4a1 1 0 100-2 1 1 0 000 2zM5 17a3 3 0 100-6 3 3 0 000 6zM19 17a3 3 0 100-6 3 3 0 000 6zM12 5l-3 5 4 1 2 4',
    on_foot: 'M12 2a2 2 0 100 4 2 2 0 000-4zM10 20v-6l-3-2 1-4 4 2 4-2 1 4-3 2v6',
  }
  const d = icons[mode] || icons.car
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const TRANSPORT_MODES = [
  { id: 'car', label: 'Car' },
  { id: 'minivan', label: 'Minivan' },
  { id: 'bus', label: 'Bus' },
  { id: 'boat', label: 'Boat' },
  { id: 'plane', label: 'Plane' },
  { id: 'train', label: 'Train' },
  { id: 'bicycle', label: 'Bicycle' },
  { id: 'on_foot', label: 'On foot' },
]

// ─── Segment Wizard (dynamic steps by type) ─────────────────────────────────
function SegmentWizard({ onComplete, onCancel, initialData, taggedLocations }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    activityType: 'activity',
    activityName: '',
    location: null,
    fromLocation: null,
    toLocation: null,
    transportMode: 'car',
    durationHours: '',
    durationMinutes: '',
    importance: 'major',
    isOptional: false,
    additionalFee: false,
    description: '',
    ...(initialData || {}),
  })
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const isTransfer = data.activityType === 'transfer'
  const maxStep = isTransfer ? 5 : 7

  const allActivities = useMemo(() =>
    Object.values(ITINERARY_ACTIVITY_CATEGORIES)
      .flatMap((cat) => Object.values(cat))
      .flat()
      .sort(),
  [])

  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const update = useCallback((overrides) => setData((p) => ({ ...p, ...overrides })), [])

  function next() {
    if (step === 2 && isTransfer && !data.transportMode) return
    if (step === 2 && !isTransfer && !data.activityName.trim()) return
    if (step < maxStep) setStep(step + 1); else onComplete(data)
  }
  function back() { if (step > 1) setStep(step - 1); else onCancel() }

  return (
    <div className="border border-slate-200 rounded-xl bg-white">
      <div className="px-6 py-6 min-h-[200px]">

        {step === 1 && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-5">What happens next?</h3>
            <div className="space-y-3">
              {[
                { val: 'activity', label: 'An activity (the reason someone would purchase this experience)' },
                { val: 'transfer', label: 'A transfer (transportation to the important parts of your experience)' },
              ].map(({ val, label }) => (
                <label key={val} className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="wz_type" checked={data.activityType === val} onChange={() => update({ activityType: val })}
                    className="mt-0.5 w-4 h-4 accent-emerald-600" />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 2 && !isTransfer && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-1">What happens during this part of the experience?</h3>
            <p className="text-sm text-slate-500 mb-4">Enter what happens during this part of your experience into the search bar below.</p>
            <div className="flex items-center gap-3">
              <div ref={dropdownRef} className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <input
                  type="text" value={data.activityName}
                  onChange={(e) => { update({ activityName: e.target.value }); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Enter activity here"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {showDropdown && data.activityName.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto py-1">
                      {allActivities
                        .filter((a) => a.toLowerCase().includes(data.activityName.toLowerCase()))
                        .sort((a, b) => {
                          const iA = a.toLowerCase().indexOf(data.activityName.toLowerCase())
                          const iB = b.toLowerCase().indexOf(data.activityName.toLowerCase())
                          return iA - iB
                        })
                        .map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => { update({ activityName: item }); setShowDropdown(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                          >
                            {item}
                          </button>
                        ))}
                      {allActivities.filter((a) => a.toLowerCase().includes(data.activityName.toLowerCase())).length === 0 && (
                        <p className="px-4 py-3 text-sm text-slate-400">No matching activities found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowActivityModal(true)} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 whitespace-nowrap shrink-0">
                or <span className="underline">Select from list</span>
              </button>
            </div>
            {showActivityModal && (
              <ActivitySelectModal
                currentValue={data.activityName}
                onSelect={(name) => update({ activityName: name })}
                onClose={() => setShowActivityModal(false)}
              />
            )}
          </>
        )}

        {step === 2 && isTransfer && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-1">How are travellers getting there?</h3>
            <p className="text-sm text-slate-500 mb-4">Select the mode of transport for this transfer.</p>
            <div className="grid grid-cols-4 gap-3">
              {TRANSPORT_MODES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ transportMode: id })}
                  className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-sm font-medium transition-colors cursor-pointer ${
                    data.transportMode === id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <TransportIcon mode={id} size={24} />
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && !isTransfer && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Where does this part of your experience take place?</h3>
            <p className="text-sm text-slate-500 mb-4">Select one of the locations tagged to your experience from the list below or use a non-specific location.</p>
            <LocationSearch selected={data.location} onSelect={(l) => update({ location: l })} taggedLocations={taggedLocations} />
            <p className="mt-3 text-sm text-slate-400">
              or <button className="text-emerald-600 hover:underline font-medium">use non-specific location</button>
            </p>
          </>
        )}

        {step === 3 && isTransfer && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Where does this transfer start and end?</h3>
            <p className="text-sm text-slate-500 mb-4">Select the pickup and drop-off locations for this transfer.</p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">From</p>
                <LocationSearch selected={data.fromLocation} onSelect={(l) => update({ fromLocation: l })} taggedLocations={taggedLocations} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1.5">To</p>
                <LocationSearch selected={data.toLocation} onSelect={(l) => update({ toLocation: l })} taggedLocations={taggedLocations} />
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-1">How long does this part of your experience last?</h3>
            <p className="text-sm text-slate-500 mb-5">
              {isTransfer
                ? 'Add the estimated duration of this transfer.'
                : 'Add a duration for this specific part of the experience. You may also skip adding a duration if you don\'t wish to display one for this segment (e.g. attractions you\'re passing by from a moving vehicle, etc).'}
            </p>
            <p className="text-sm font-bold text-slate-800 mb-3">Duration</p>
            <div className="flex items-center gap-3">
              <input type="number" min="0" value={data.durationHours} onChange={(e) => update({ durationHours: e.target.value })}
                className="w-28 h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="text-sm text-slate-600">Hours</span>
              <input type="number" min="0" max="59" value={data.durationMinutes} onChange={(e) => update({ durationMinutes: e.target.value })}
                className="w-28 h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="text-sm text-slate-600">Minutes</span>
            </div>
          </>
        )}

        {step === 5 && !isTransfer && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-5">How important is this activity to the overall experience?</h3>
            <div className="space-y-3">
              {[
                { val: 'major', label: "It's a major activity or attraction visit (e.g. Colosseum visit, 4x4 dune bashing, camel ride, etc)." },
                { val: 'minor', label: "It's a minor part of the experience (e.g. rest stop break, souvenir shop visit, local snacks break, etc)." },
              ].map(({ val, label }) => (
                <label key={val} className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="wz_imp" checked={data.importance === val} onChange={() => update({ importance: val })}
                    className="mt-0.5 w-4 h-4 accent-emerald-600" />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 5 && isTransfer && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Additional notes about this transfer</h3>
            <p className="text-sm text-slate-500 mb-4">Describe what travellers can expect during this transfer (optional, but recommended).</p>
            <textarea
              value={data.description}
              onChange={(e) => update({ description: e.target.value.slice(0, 500) })}
              placeholder="e.g. Scenic drive along the coast, approx. 1 hour with a rest stop"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="text-right text-xs text-slate-400 mt-1">{data.description.length} / 500</div>
          </>
        )}

        {(step === 6 && !isTransfer) && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-5">Is this part of your experience optional?</h3>
            <div className="space-y-3">
              {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(({ val, label }) => (
                <label key={String(val)} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="wz_opt" checked={data.isOptional === val} onChange={() => update({ isOptional: val })}
                    className="w-4 h-4 accent-emerald-600" />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {(step === 7 && !isTransfer) && (
          <>
            <h3 className="text-xl font-bold text-slate-900 mb-5">Does this part of your experience require an additional fee?</h3>
            <div className="space-y-3">
              {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(({ val, label }) => (
                <label key={String(val)} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="wz_fee" checked={data.additionalFee === val} onChange={() => update({ additionalFee: val })}
                    className="w-4 h-4 accent-emerald-600" />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
        <button onClick={back} className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          {step === 4 && (
            <button onClick={() => { update({ durationHours: '0', durationMinutes: '0' }); next() }} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Skip</button>
          )}
          <button onClick={next} className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-600 transition-colors">
            {step < maxStep ? 'Next' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Segment Card ─────────────────────────────────────────────────────────────
function SegmentCard({ segment, onEdit, onRemove, onAddAfter }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const totalMin = segment.durationUnit === 'minute'
    ? segment.duration
    : segment.durationUnit === 'hour'
      ? (segment.duration || 0) * 60
      : (segment.duration || 0) * 1440
  const durLabel = durationLabel(totalMin)
  const isTransfer = segment.type === 'transfer'
  const transportLabel = TRANSPORT_MODES.find((m) => m.id === segment.title)?.label || segment.title

  return (
    <div className="flex items-center gap-4 py-3 relative z-10">
      {isTransfer ? (
        <div className="relative z-10 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0">
          <TransportIcon mode={segment.title || 'car'} size={18} />
        </div>
      ) : (
        <ActivityNode isOptional={segment.isOptional} />
      )}
      <div className="flex-1 border-b border-slate-100 pb-3 min-w-0 self-stretch flex flex-col justify-center">
        {isTransfer ? (
          <>
            <p className="text-sm font-bold text-slate-900">
              {segment.locationName && segment.locationAddress
                ? `${segment.locationName} \u2192 ${segment.locationAddress}`
                : segment.locationName || segment.locationAddress || 'Transfer'}
            </p>
            <p className="text-sm text-slate-600">{transportLabel}{durLabel ? ` ${durLabel}` : ''}</p>
            {segment.description && segment.description !== ' ' && (
              <p className="text-xs text-slate-400 mt-0.5">{segment.description}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-900">{segment.locationName || segment.location?.name || 'Location'}</p>
            <p className="text-sm text-slate-600">{[segment.activityName || segment.title, durLabel].filter(Boolean).join(' ')}</p>
            {segment.isOptional && <p className="text-xs text-emerald-600 mt-0.5">Optional</p>}
          </>
        )}
      </div>
      <button
        onClick={() => onEdit()}
        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0"
        title="Edit segment"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <div className="relative shrink-0" ref={ref}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
            <button onClick={(e) => { e.stopPropagation(); onAddAfter(); setMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer">
              <Plus size={14} className="text-emerald-600" /> Add itinerary segment
            </button>

            <button onClick={(e) => { e.stopPropagation(); onRemove(); setMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              Remove itinerary segment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────
function WelcomeScreen({ isMultiDay, onStart, errors }) {
  const STOPS = [
    { type: 'bus', title: 'Bus ride', sub: '(1h30min)' },
    { type: 'activity', title: 'Glencoe', sub: 'Photo stop' },
    { type: 'activity', title: 'Loch Ness', sub: 'Free time (3h)' },
    { type: 'optional', title: 'Urquhart Castle', sub: 'Guided visit (3h)', extra: 'Optional, Extra fee' },
    { type: 'activity', title: 'Pitlochry', sub: 'Free time (3h)' },
  ]

  // Node size in preview = 32px → half = 16px. Row uses items-center py-2.5.
  // py-2.5 = 10px. Center of first node from top of rows-wrapper = 10 + 16 = 26px.
  // In Tailwind: top-[26px] bottom-[26px], left-4 (16px = center of 32px node).

  return (
    <div className="flex gap-10 items-start">
      {/* Preview panel */}
      <div className="w-72 shrink-0">
        <div className="border border-slate-200 rounded-2xl p-5 bg-white">

          {isMultiDay ? (
            <div className="relative">
              <div className="absolute left-4 top-[26px] bottom-[26px] w-0.5 bg-emerald-600" />
              <div className="flex items-center gap-3 py-2.5 border-b border-slate-100">
                <GIcon size={32} />
                <div>
                  <p className="text-xs font-semibold text-slate-500">Day 1</p>
                  <p className="text-sm font-bold text-slate-900">The Golden Circle</p>
                </div>
              </div>
              {[
                { title: '8:00 AM Depart', sub: 'Pick up from your hotel' },
                { title: 'Morning Activity', sub: 'Snorkelling at the national park' },
                { title: 'Afternoon Stop', sub: 'Explore the waterfall route' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100">
                  <div className="relative z-10 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
                    <Plus size={13} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{s.title}</p>
                    <p className="text-xs text-slate-500">{s.sub}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 py-2.5">
                <CalendarNode size={32} />
                <p className="text-sm font-bold text-slate-900">End of Day 1</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-[26px] bottom-[26px] w-0.5 bg-emerald-600" />
              <div className="flex items-center gap-3 py-2.5 border-b border-slate-100">
                <GIcon size={32} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Pickup location:</p>
                  <p className="text-sm text-slate-500">Edinburgh</p>
                </div>
              </div>
              {STOPS.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                  {s.type === 'optional'
                    ? <div className="relative z-10 w-8 h-8 rounded-full border-2 border-slate-300 bg-white shrink-0" />
                    : <div className="relative z-10 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
                        {s.type === 'bus'
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                          : <Plus size={13} strokeWidth={2.5} />
                        }
                      </div>
                  }
                  <div>
                    <p className="text-sm font-bold text-slate-900">{s.title}</p>
                    <p className="text-sm text-slate-500">{s.sub}</p>
                    {s.extra && <p className="text-xs text-slate-400">{s.extra}</p>}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 py-2.5">
                <OrangeCircle size={32} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Arrive back at:</p>
                  <p className="text-sm text-slate-500">Edinburgh</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-4 text-center">See how your schedule appears to travellers.</p>
        </div>
      </div>

      {/* Description */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-snug">
          {isMultiDay ? 'Plan your multi-day tour, day by day' : 'Build your tour schedule'}
        </h2>
        {isMultiDay ? (
          <>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">Show travellers exactly what each day looks like — where they'll go, what they'll do, and how their time is structured.</p>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">A well-built schedule builds trust and helps travellers commit to booking with confidence. The more detail you add, the better your listing performs.</p>
            <p className="text-sm font-semibold text-slate-800 mb-6">Ready to map it out? Let's go.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">Give travellers a clear picture of what your experience involves — the stops, the highlights, and how the time unfolds.</p>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">Tours with a detailed schedule tend to convert better. Travellers book with more confidence when they know exactly what to expect.</p>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">Pro tip: include details that aren't covered elsewhere — transport type between stops, how long you spend at each location, and any notable things to look out for.</p>
          </>
        )}
        <button data-field="itinerary" onClick={onStart} className="px-7 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors">
          {isMultiDay ? 'Get started' : 'Build schedule'}
        </button>
        {errors?.itinerary && <span className="text-[13px] text-red-600 font-medium mt-3 block">{errors.itinerary[0]}</span>}
      </div>
    </div>
  )
}

// ─── Single-Day Timeline Builder ─────────────────────────────────────────────
function SingleDayBuilder({ pickupInfo, dropoffInfo, taggedLocations, onShowDiagram }) {
  const itinerary = useProductBuilderStore((s) => s.itinerary)
  const pushItineraryEntry = useProductBuilderStore((s) => s.pushItineraryEntry)
  const updateItineraryEntry = useProductBuilderStore((s) => s.updateItineraryEntry)
  const removeItineraryEntry = useProductBuilderStore((s) => s.removeItineraryEntry)

  const [editingIndex, setEditingIndex] = useState(null)
  const [showWizard, setShowWizard] = useState(false)
  const [saving, setSaving] = useState(false)

  // Only day=1 segments
  const segments = itinerary.filter((e) => e.day === 1)
  const globalIndexOf = (daySegIdx) => {
    const daySegs = itinerary.filter((x) => x.day === 1)
    return itinerary.indexOf(daySegs[daySegIdx])
  }

  function handleComplete(data) {
    const isTransfer = data.activityType === 'transfer'
    const totalMin = (parseInt(data.durationHours) || 0) * 60 + (parseInt(data.durationMinutes) || 0)
    const entry = isTransfer ? {
      day: 1, time: '09:00',
      duration: totalMin || 1, durationUnit: 'minute',
      title: data.transportMode || 'car',
      description: data.description || `Transfer by ${TRANSPORT_MODES.find((m) => m.id === data.transportMode)?.label || 'car'}`,
      type: 'transfer',
      visitType: 'visit',
      locationName: data.fromLocation?.name || '',
      locationAddress: data.toLocation?.name || '',
      locationLat: data.fromLocation?.lat || null,
      locationLng: data.fromLocation?.lng || null,
      isCustomLocation: false,
      isOptional: false,
      additionalFee: false,
      activityName: '',
      importance: 'minor',
    } : {
      day: 1, time: '09:00',
      duration: totalMin || 1, durationUnit: 'minute',
      title: data.activityName || '',
      description: data.activityName,
      type: 'activity',
      visitType: 'visit',
      locationName: data.location?.name || '',
      locationAddress: data.location?.address || '',
      locationLat: data.location?.lat || null,
      locationLng: data.location?.lng || null,
      isCustomLocation: false,
      isOptional: !!data.isOptional,
      additionalFee: !!data.additionalFee,
      activityName: data.activityName || '',
      importance: data.importance || 'major',
    }
    if (editingIndex !== null) {
      updateItineraryEntry(globalIndexOf(editingIndex), entry)
    } else {
      pushItineraryEntry(entry)
    }
    setShowWizard(false)
    setEditingIndex(null)
  }

  return (
    <div>
      {/* Timeline
          Layout contract:
          - Every row is: flex items-center gap-4 py-3
          - Node is always w-10 h-10 (40px), so its center is at 20px from left
          - Orange line: left-5 (20px), top-5 (20px = half first node), bottom-5 (20px = half last node)
          - Row content right of the node has a bottom border to create the separator lines
      */}
      <div className="relative">
        {/* Green spine — left-5 = 20px = center of 40px node
             top-8 = 32px = py-3(12px top) + half-node(20px)
             bottom-8 = 32px = py-3(12px bottom) + half-node(20px) */}
        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-emerald-600 z-0" />

        {/* Pickup row */}
        <div className="flex items-center gap-4 py-3 relative z-10">
          <GIcon size={40} />
          <div className="flex-1 flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{pickupInfo.label}</p>
              {typeof pickupInfo.sub === 'string' && <p className="text-sm text-slate-500">{pickupInfo.sub}</p>}
            </div>
            <button className="text-slate-400 hover:text-slate-600 shrink-0 ml-4" type="button">
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* Segments */}
        {segments.map((seg, i) => (
          <div key={i}>
            <SegmentCard
              segment={seg}
              onEdit={() => { setEditingIndex(i); setShowWizard(true) }}
              onRemove={() => removeItineraryEntry(globalIndexOf(i))}
              onAddAfter={() => { setEditingIndex(null); setShowWizard(true) }}
            />
            {showWizard && editingIndex === i && (
              <div className="ml-14 mb-2">
                <SegmentWizard
                  onComplete={handleComplete}
                  onCancel={() => { setShowWizard(false); setEditingIndex(null) }}
                  initialData={(() => {
                    const s = segments[editingIndex]
                    if (!s) return null
                    if (s.type === 'transfer') {
                      return {
                        activityType: 'transfer',
                        transportMode: s.title || 'car',
                        fromLocation: s.locationName ? { name: s.locationName } : null,
                        toLocation: s.locationAddress ? { name: s.locationAddress } : null,
                        durationHours: String(Math.floor((s.duration || 0) / 60)),
                        durationMinutes: String((s.duration || 0) % 60),
                        description: s.description && s.description !== ' ' ? s.description : '',
                      }
                    }
                    return {
                      activityType: 'activity',
                      activityName: s.activityName || s.title,
                      location: s.locationName ? { name: s.locationName, address: s.locationAddress } : null,
                      durationHours: String(Math.floor((s.duration || 0) / 60)),
                      durationMinutes: String((s.duration || 0) % 60),
                      importance: s.importance || 'major',
                      isOptional: !!s.isOptional,
                      additionalFee: !!s.additionalFee,
                    }
                  })()}
                  taggedLocations={taggedLocations}
                />
              </div>
            )}
          </div>
        ))}

        {/* Add-new wizard (inside timeline, above dropoff) */}
        {showWizard && editingIndex === null && (
          <div className="mb-2 ml-14">
            <SegmentWizard
              onComplete={handleComplete}
              onCancel={() => { setShowWizard(false) }}
              initialData={null}
              taggedLocations={taggedLocations}
            />
          </div>
        )}

        {/* Dropoff row */}
        <div className="flex items-center gap-4 py-3 relative z-10">
          <OrangeCircle size={40} />
          <div className="flex-1 flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{dropoffInfo.label}</p>
              {typeof dropoffInfo.sub === 'string' && <p className="text-sm text-slate-500">{dropoffInfo.sub}</p>}
            </div>
            <button className="text-slate-400 hover:text-slate-600 shrink-0 ml-4" type="button">
              <Info size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end mt-5">
        <button
          data-field="itinerary"
          onClick={() => { setEditingIndex(null); setShowWizard(true) }}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Add itinerary segment
        </button>
      </div>
      <div className="flex justify-end mt-3">
        <button
          onClick={async () => {
            setSaving(true)
            const ok = await saveCurrentProduct()
            setSaving(false)
            if (ok) {
              useProductBuilderStore.getState().completeStep('itinerary')
              onShowDiagram?.()
            }
          }}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save itinerary'}
        </button>
      </div>
    </div>
  )
}

// ─── Multi-Day Segment Card (shows time, title, description, location) ─────────
function DaySegmentCard({ segment, onEdit, onRemove, onAddAfter }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Format time: stored as "HH:MM" 24h → display as "H:MM AM/PM"
  function formatTime(t) {
    if (!t) return ''
    const [hStr, mStr] = t.split(':')
    const h = parseInt(hStr)
    const m = parseInt(mStr)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  const timeDisplay = formatTime(segment.time)
  const isTransfer = segment.type === 'transfer'
  const transportLabel = TRANSPORT_MODES.find((m) => m.id === segment.title)?.label || segment.title
  const titleDisplay = isTransfer
    ? transportLabel
    : (segment.activityName || segment.title || '')
  const headline = [timeDisplay, titleDisplay].filter(Boolean).join(' – ')

  return (
    <div className="flex items-start gap-4 py-3 relative z-10">
      {isTransfer ? (
        <div className="relative z-10 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0">
          <TransportIcon mode={segment.title || 'car'} size={18} />
        </div>
      ) : (
        <div className="relative z-10 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
          <Plus size={18} strokeWidth={2.5} />
        </div>
      )}
      <div className="flex-1 border-b border-slate-100 pb-3 min-w-0">
        {headline && <p className="text-sm font-semibold text-slate-900">{headline}</p>}
        {isTransfer ? (
          <>
            {(segment.locationName || segment.locationAddress) && (
              <p className="text-xs text-slate-500 mt-0.5">
                {segment.locationName && segment.locationAddress
                  ? `${segment.locationName} \u2192 ${segment.locationAddress}`
                  : segment.locationName || segment.locationAddress}
              </p>
            )}
            {segment.description && segment.description !== ' ' && (
              <p className="text-sm text-slate-600 mt-0.5 break-words">{segment.description}</p>
            )}
          </>
        ) : (
          <>
            {segment.description && segment.description !== ' ' && (
              <p className="text-sm text-slate-600 mt-0.5 break-words">{segment.description}</p>
            )}
            {segment.locationName && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin size={11} /> {segment.locationName}
              </p>
            )}
          </>
        )}
      </div>
      <button
        onClick={() => onEdit()}
        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 mt-1"
        title="Edit segment"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <div className="relative shrink-0 mt-1 z-10" ref={ref}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1">
            <button onClick={(e) => { e.stopPropagation(); onAddAfter(); setMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer">
              <Plus size={14} className="text-emerald-600" /> Add segment after
            </button>

            <button onClick={(e) => { e.stopPropagation(); onRemove(); setMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              Remove segment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Time Picker Dropdown ─────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Parse stored "HH:MM"
  const [hours, setHours] = useState(() => value ? parseInt(value.split(':')[0]) : 9)
  const [minutes, setMinutes] = useState(() => value ? parseInt(value.split(':')[1]) : 0)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function commit(h, m) {
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  function changeHours(delta) {
    const next = (hours + delta + 24) % 24
    setHours(next)
    commit(next, minutes)
  }

  function changeMinutes(delta) {
    const next = (minutes + delta + 60) % 60
    setMinutes(next)
    commit(hours, next)
  }

  // Display as 12h
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  const displayVal = value
    ? `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`
    : ''

  return (
    <div ref={ref} className="relative flex-1">
      <div className="relative">
        <input
          readOnly
          value={displayVal}
          onClick={() => setOpen(!open)}
          placeholder="Start time (optional)"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
        />
        <button type="button" onClick={() => setOpen(!open)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-40">
          <div className="flex items-center justify-center gap-4">
            {/* Hours */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => changeHours(1)} className="p-1 hover:text-emerald-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <span className="text-lg font-bold text-slate-900 w-8 text-center">{String(h12).padStart(2, '0')}</span>
              <button type="button" onClick={() => changeHours(-1)} className="p-1 hover:text-emerald-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>
            <span className="text-lg font-bold text-slate-400">:</span>
            {/* Minutes */}
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => changeMinutes(5)} className="p-1 hover:text-emerald-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <span className="text-lg font-bold text-slate-900 w-8 text-center">{String(minutes).padStart(2, '0')}</span>
              <button type="button" onClick={() => changeMinutes(-5)} className="p-1 hover:text-emerald-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">{ampm}</p>
        </div>
      )}
    </div>
  )
}

// ─── Day Segment Form (single inline card matching screenshot) ────────────────
function DaySegmentForm({ initialData, taggedLocations, photos = [], onSave, onCancel }) {
  const [title, setTitle] = useState(initialData?.activityName || initialData?.title || '')
  const [description, setDescription] = useState(
    initialData?.description && initialData.description !== ' ' ? initialData.description : ''
  )
  const [location, setLocation] = useState(
    initialData?.locationName ? { name: initialData.locationName, address: initialData.locationAddress } : null
  )
  const [time, setTime] = useState(initialData?.time || '')
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(initialData?.photo || '')

  function handleSave() {
    if (!description.trim()) {
      alert('Please enter a description for this segment')
      return
    }
    onSave({
      activityName: title,
      description,
      location,
      time,
      photo: selectedPhoto,
      activityType: initialData?.activityType || 'activity',
      durationHours: initialData?.durationHours || '0',
      durationMinutes: initialData?.durationMinutes || '0',
      importance: initialData?.importance || 'major',
      isOptional: initialData?.isOptional || false,
      additionalFee: initialData?.additionalFee || false,
    })
  }

  return (
      <div className="ml-14 my-3 border border-slate-200 rounded-xl bg-white">
      <div className="px-6 py-5 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">What's next on this day?</h3>

        {/* Segment title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder="Segment title"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="text-right text-xs text-slate-400 mt-1">{title.length} / 60</div>
        </div>

        {/* Description + photo upload side by side */}
        <div className="flex gap-3 items-stretch">
          <div className="flex-1">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="What can travellers expect to do?"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <div className="text-right text-xs text-slate-400 mt-1">{description.length} / 500</div>
          </div>
          {/* Photo upload */}
          <button
            type="button"
            onClick={() => setShowPhotoModal(true)}
            className="w-20 shrink-0 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors overflow-hidden"
          >
            {selectedPhoto
              ? <img src={selectedPhoto} alt="" className="w-full h-full object-cover" />
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                  <path d="M12 12l2-2 1 1"/>
                </svg>
            }
          </button>
        </div>

        {/* Location search + time picker */}
        <div className="flex gap-3">
          <div className="flex-1">
            <LocationSearch
              selected={location}
              onSelect={setLocation}
              taggedLocations={taggedLocations}
            />
            <div className="text-xs text-slate-400 mt-1">{location ? '1' : '0'} / 1</div>
          </div>
          <TimePicker value={time} onChange={setTime} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-full hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors"
        >
          {initialData ? 'Update' : 'Add'}
        </button>
      </div>

      {/* Photo modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Choose a photo</h3>
              <button onClick={() => setShowPhotoModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Pick one photo from your gallery to represent this segment. Each photo can only be used once.</p>
              <div className="grid grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedPhoto(''); setShowPhotoModal(false) }}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center text-xs text-slate-400 transition-colors ${!selectedPhoto ? 'border-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  None
                </button>
                {photos.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setSelectedPhoto(p.url); setShowPhotoModal(false) }}
                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-colors ${selectedPhoto === p.url ? 'border-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              {photos.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No photos uploaded yet. Add photos in the Photos step first.</p>
              )}
            </div>
            <div className="flex justify-end px-6 pb-5">
              <button onClick={() => setShowPhotoModal(false)} className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Multi-Day Builder ─────────────────────────────────────────────────────────
function MultiDayBuilder({ numDays, pickupInfo, taggedLocations, onShowDiagram }) {
  const navigate = useNavigate()
  const itinerary = useProductBuilderStore((s) => s.itinerary)
  const itineraryOverview = useProductBuilderStore((s) => s.itineraryOverview)
  const additionalItineraryInfo = useProductBuilderStore((s) => s.additionalItineraryInfo)
  const dayTitles = useProductBuilderStore((s) => s.dayTitles)
  const photos = useProductBuilderStore((s) => s.photos)
  const pushItineraryEntry = useProductBuilderStore((s) => s.pushItineraryEntry)
  const updateItineraryEntry = useProductBuilderStore((s) => s.updateItineraryEntry)
  const removeItineraryEntry = useProductBuilderStore((s) => s.removeItineraryEntry)
  const setField = useProductBuilderStore((s) => s.setField)

  const tabs = ['Overview', ...Array.from({ length: numDays }, (_, i) => `Day ${i + 1}`), 'Additional info']
  const [activeTab, setActiveTab] = useState('Overview')
  const [tabDirection, setTabDirection] = useState(1)
  const [editingIndex, setEditingIndex] = useState(null)
  const [showWizard, setShowWizard] = useState(false)
  const [saving, setSaving] = useState(false)

  const tabVariants = {
    initial: (d) => ({ opacity: 0, x: d * 24 }),
    animate: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d * -24 }),
  }

  function handleTabChange(tab) {
    if (showWizard && !window.confirm('Discard unsaved changes to the current segment?')) return
    const currentIdx = tabs.indexOf(activeTab)
    const nextIdx = tabs.indexOf(tab)
    setTabDirection(nextIdx >= currentIdx ? 1 : -1)
    setActiveTab(tab)
    setShowWizard(false)
    setEditingIndex(null)
  }

  const activeDay = activeTab.startsWith('Day ') ? parseInt(activeTab.replace('Day ', '')) : null

  const daySegments = useMemo(() => {
    if (!activeDay) return []
    return itinerary
      .map((e, globalIdx) => ({ ...e, globalIdx }))
      .filter((e) => e.day === activeDay)
  }, [itinerary, activeDay])

  function handleComplete(data) {
    const isTransfer = data.activityType === 'transfer'
    const totalMin = (parseInt(data.durationHours) || 0) * 60 + (parseInt(data.durationMinutes) || 0)
    const entry = isTransfer ? {
      day: activeDay,
      time: data.time || '09:00',
      duration: totalMin || 0,
      durationUnit: 'minute',
      title: data.transportMode || 'car',
      description: data.description || `Transfer by ${TRANSPORT_MODES.find((m) => m.id === data.transportMode)?.label || 'car'}`,
      type: 'transfer',
      visitType: 'visit',
      locationName: data.fromLocation?.name || '',
      locationAddress: data.toLocation?.name || '',
      locationLat: data.fromLocation?.lat || null,
      locationLng: data.fromLocation?.lng || null,
      isCustomLocation: false,
      isOptional: false,
      additionalFee: false,
      activityName: '',
      importance: 'minor',
      photo: data.photo || '',
    } : {
      day: activeDay,
      time: data.time || '09:00',
      duration: totalMin || 0,
      durationUnit: 'minute',
      title: data.activityName || '',
      description: data.description || data.activityName,
      type: 'activity',
      visitType: 'visit',
      locationName: data.location?.name || '',
      locationAddress: data.location?.address || '',
      locationLat: data.location?.lat || null,
      locationLng: data.location?.lng || null,
      isCustomLocation: false,
      isOptional: !!data.isOptional,
      additionalFee: !!data.additionalFee,
      activityName: data.activityName || '',
      importance: data.importance || 'major',
      photo: data.photo || '',
    }
    if (editingIndex !== null) {
      updateItineraryEntry(daySegments[editingIndex].globalIdx, entry)
    } else {
      pushItineraryEntry(entry)
    }
    setShowWizard(false)
    setEditingIndex(null)
  }

  // Get initial data for edit
  function getEditInitial(i) {
    const seg = daySegments[i]
    if (!seg) return null
    if (seg.type === 'transfer') {
      return {
        activityType: 'transfer',
        transportMode: seg.title || 'car',
        fromLocation: seg.locationName ? { name: seg.locationName } : null,
        toLocation: seg.locationAddress ? { name: seg.locationAddress } : null,
        durationHours: String(Math.floor((seg.duration || 0) / 60)),
        durationMinutes: String((seg.duration || 0) % 60),
        description: seg.description && seg.description !== ' ' ? seg.description : '',
      }
    }
    return {
      activityType: 'activity',
      activityName: seg.activityName || seg.title,
      location: seg.locationName ? { name: seg.locationName, address: seg.locationAddress } : null,
      durationHours: String(Math.floor((seg.duration || 0) / 60)),
      durationMinutes: String((seg.duration || 0) % 60),
      importance: seg.importance || 'major',
      isOptional: !!seg.isOptional,
      additionalFee: !!seg.additionalFee,
    }
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-end gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const isDay = tab.startsWith('Day ')
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {isDay && <Calendar size={14} />}
              {tab}
            </button>
          )
        })}
      </div>

      {/* Tab content with animated transitions */}
      <AnimatePresence mode="wait" custom={tabDirection}>
        {activeTab === 'Overview' && (
          <motion.div
            key="overview"
            custom={tabDirection}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <h3 className="text-sm font-bold text-slate-900 mb-1">Overview <span className="font-normal text-slate-400">(optional)</span></h3>
            <p className="text-sm text-slate-500 mb-3">Write an introductory overview to summarize your itinerary. Highlight the must-see sights, memorable activities, and the general atmosphere travelers can expect.</p>
            <textarea
              value={itineraryOverview}
              onChange={(e) => setField('itineraryOverview', e.target.value.slice(0, 400))}
              rows={8}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              placeholder=""
            />
            <div className="text-right text-xs text-slate-400 mt-1">{itineraryOverview.length} / 400</div>
          </motion.div>
        )}

        {activeDay && (
          <motion.div
            key={`day-${activeDay}`}
            custom={tabDirection}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {/* Day title */}
            <div className="mb-5">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Day title</h4>
              <div className="relative">
                <input
                  type="text"
                  value={dayTitles?.[activeDay] || ''}
                  onChange={(e) => setField('dayTitles', { ...dayTitles, [activeDay]: e.target.value.slice(0, 60) })}
                  placeholder="Summarize where you're going or what you're doing on this day"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="text-right text-xs text-slate-400 mt-1">{(dayTitles?.[activeDay] || '').length} / 60</div>
              </div>
            </div>

            {/* Itinerary section */}
            <h4 className="text-sm font-bold text-slate-900 mb-1">Itinerary</h4>
            <p className="text-sm text-slate-500 mb-4">Create a timeline of what customers can expect on this day. Add each key activity as a separate segment.</p>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-emerald-600 z-0" />

              {/* Starting location */}
              <div className="flex items-center gap-4 py-3 relative z-10">
                <GIcon size={40} />
                <div className="flex-1 flex items-center justify-between border-b border-slate-200 pb-3 self-stretch">
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-900">Starting location:</p>
                    {typeof pickupInfo.sub === 'string' && <p className="text-sm text-slate-500">{pickupInfo.sub}</p>}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 shrink-0 ml-4" type="button">
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* Inline segment form — single card matching screenshot */}
              <AnimatePresence>
                {showWizard && (
                  <motion.div
                    key="multi-day-wizard"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <DaySegmentForm
                      initialData={editingIndex !== null ? getEditInitial(editingIndex) : null}
                      taggedLocations={taggedLocations}
                      photos={photos}
                      onSave={handleComplete}
                      onCancel={() => { setShowWizard(false); setEditingIndex(null) }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Segments */}
              {daySegments.map((seg, i) => (
                <DaySegmentCard
                  key={seg.globalIdx}
                  segment={seg}
                  onEdit={() => { setEditingIndex(i); setShowWizard(true) }}
                  onRemove={() => removeItineraryEntry(seg.globalIdx)}
                  onAddAfter={() => { setEditingIndex(null); setShowWizard(true) }}
                />
              ))}

              {/* Add segment inline button */}
              {!showWizard && (
                <div className="flex items-center gap-4 py-2 relative z-10">
                  <div className="w-10 shrink-0" />
                  <button
                    data-field="itinerary"
                    onClick={() => { setEditingIndex(null); setShowWizard(true) }}
                    className="px-5 py-2 border border-emerald-600 text-emerald-600 text-sm font-semibold rounded-full hover:bg-emerald-50 transition-colors"
                  >
                    Add itinerary segment
                  </button>
                </div>
              )}

              {/* End of day */}
              <div className="flex items-center gap-4 py-3 relative z-10">
                <CalendarNode size={40} />
                <p className="text-sm font-bold text-slate-900">End of day {activeDay}</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Additional info' && (
          <motion.div
            key="additional"
            custom={tabDirection}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <h3 className="text-sm font-bold text-slate-900 mb-1">Additional itinerary info <span className="font-normal text-slate-400">(optional)</span></h3>
            <p className="text-sm text-slate-500 mb-3">Share information about anything that may change in the itinerary (e.g. seasonal changes) or additional information that wasn't covered in the itinerary.</p>
            <textarea
              value={additionalItineraryInfo}
              onChange={(e) => setField('additionalItineraryInfo', e.target.value.slice(0, 400))}
              rows={8}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              placeholder=""
            />
            <div className="text-right text-xs text-slate-400 mt-1">{additionalItineraryInfo.length} / 400</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
        <button
          onClick={async () => {
            setSaving(true)
            const ok = await saveCurrentProduct()
            setSaving(false)
            if (ok) {
              useProductBuilderStore.getState().completeStep('itinerary')
              navigate('/products')
            }
          }}
          disabled={saving}
          className="px-5 py-2.5 border border-slate-300 text-sm font-medium text-slate-700 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save and exit'}
        </button>
        {activeTab === tabs[tabs.length - 1] ? (
          <button
            onClick={async () => {
              setSaving(true)
              const ok = await saveCurrentProduct()
              setSaving(false)
              if (ok) {
                useProductBuilderStore.getState().completeStep('itinerary')
                onShowDiagram?.()
              }
            }}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Done'}
          </button>
        ) : (
          <button
            onClick={() => {
              const nextIdx = tabs.indexOf(activeTab) + 1
              handleTabChange(tabs[nextIdx])
            }}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Itinerary Diagram helpers ─────────────────────────────────────────────────
function formatTime(t) {
  if (!t) return ''
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr); const m = parseInt(mStr)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function TimelineNode({ children, className = '' }) {
  return (
    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${className}`}>
      {children}
    </div>
  )
}

function TimelineRow({ node, children, className = '' }) {
  return (
    <div className={`flex items-start gap-4 py-3 ${className}`}>
      {node}
      <div className="flex-1 min-w-0 border-b border-slate-100 pb-3">
        {children}
      </div>
    </div>
  )
}

function SegmentContent({ seg }) {
  const isTransfer = seg.type === 'transfer'
  const label = isTransfer
    ? (TRANSPORT_MODES.find((m) => m.id === seg.title)?.label || seg.title)
    : (seg.activityName || seg.title || '')
  const dur = durationLabel(seg.duration && seg.durationUnit === 'minute' ? seg.duration : null)
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">
          {formatTime(seg.time)}{label ? ` \u2013 ${label}` : ''}
        </span>
        {dur && <span className="text-xs text-slate-400 font-medium">{dur}</span>}
      </div>
      {isTransfer ? (
        <>
          {(seg.locationName || seg.locationAddress) && (
            <p className="text-sm text-slate-500 mt-0.5">
              {seg.locationName && seg.locationAddress
                ? `${seg.locationName} \u2192 ${seg.locationAddress}`
                : seg.locationName || seg.locationAddress}
            </p>
          )}
        </>
      ) : (
        <>
          {seg.description && seg.description !== ' ' && (
            <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{seg.description}</p>
          )}
          {seg.locationName && (
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin size={11} /> {seg.locationName}
            </p>
          )}
        </>
      )}
      {seg.isOptional && (
        <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          Optional
        </span>
      )}
    </>
  )
}

function ActivityIcon({ segment }) {
  if (segment.type === 'transfer') {
    return (
      <TimelineNode className="bg-amber-500">
        <TransportIcon mode={segment.title || 'car'} size={16} />
      </TimelineNode>
    )
  }
  if (segment.isOptional) {
    return (
      <TimelineNode className="border-2 border-slate-300 bg-white">
        <div className="w-2 h-2 rounded-full bg-slate-300" />
      </TimelineNode>
    )
  }
  return (
    <TimelineNode className="bg-emerald-600">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    </TimelineNode>
  )
}

function TimelineCard({ children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function DayTimeline({ segments, day, pickupInfo, dropoffInfo, isFirstDay, isLastDay }) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-emerald-200 z-0" />
      {isFirstDay && (
        <TimelineRow node={<TimelineNode className="bg-emerald-600"><MapPin size={16} /></TimelineNode>}>
          <p className="text-sm font-bold text-slate-900">{pickupInfo?.label || 'Starting location:'}</p>
          {typeof pickupInfo?.sub === 'string' && <p className="text-sm text-slate-500 mt-0.5">{pickupInfo.sub}</p>}
        </TimelineRow>
      )}
      {segments.length === 0 ? (
        <div className="flex items-center gap-4 py-3">
          <TimelineNode className="bg-slate-100">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
          </TimelineNode>
          <p className="text-sm text-slate-400">No activities for this day</p>
        </div>
      ) : (
        segments.map((seg, i) => (
          <TimelineRow key={i} node={<ActivityIcon segment={seg} />}>
            <SegmentContent seg={seg} />
          </TimelineRow>
        ))
      )}
      {isLastDay && (
        <TimelineRow node={<TimelineNode className="bg-emerald-50 border-2 border-emerald-200"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /></TimelineNode>}>
          <p className="text-sm font-bold text-slate-700">{dropoffInfo?.label || 'Drop-off location:'}</p>
          {typeof dropoffInfo?.sub === 'string' && <p className="text-sm text-slate-500 mt-0.5">{dropoffInfo.sub}</p>}
        </TimelineRow>
      )}
      <div className="flex items-center gap-4 py-3">
        <div className="relative z-10 w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-500 shrink-0">
          <Calendar size={16} />
        </div>
        <p className="text-sm font-bold text-slate-700">End of day {day}</p>
      </div>
    </div>
  )
}

// ─── Itinerary Diagram (read-only preview) ────────────────────────────────────
function ItineraryDiagram({
  isMultiDay, numDays, pickupInfo, dropoffInfo,
  onBack,
}) {
  const itinerary = useProductBuilderStore((s) => s.itinerary)
  const itineraryOverview = useProductBuilderStore((s) => s.itineraryOverview)
  const additionalItineraryInfo = useProductBuilderStore((s) => s.additionalItineraryInfo)
  const dayTitles = useProductBuilderStore((s) => s.dayTitles)
  const daySegments = (day) => itinerary.filter((e) => e.day === day)

  return (
    <div className="max-w-[860px]">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-semibold text-slate-500">Itinerary preview</span>
        <HelpCircle size={15} className="text-slate-400" />
      </div>

      {isMultiDay ? (
        <TimelineCard className="space-y-0">
          {itineraryOverview && (
            <div className="pb-5 mb-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Overview</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{itineraryOverview}</p>
            </div>
          )}

          {Array.from({ length: numDays }, (_, i) => i + 1).map((day) => {
            const segments = daySegments(day)
            return (
              <div key={day} className={day > 1 ? 'pt-6 mt-6 border-t border-slate-100' : ''}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {day}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Day {day}</p>
                    {dayTitles?.[day] && (
                      <p className="text-xs text-slate-500">{dayTitles[day]}</p>
                    )}
                  </div>
                </div>
                <DayTimeline
                  segments={segments}
                  day={day}
                  pickupInfo={pickupInfo}
                  dropoffInfo={dropoffInfo}
                  isFirstDay={day === 1}
                  isLastDay={day === numDays}
                />
              </div>
            )
          })}

          {additionalItineraryInfo && (
            <div className="pt-6 mt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Additional info</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{additionalItineraryInfo}</p>
            </div>
          )}
        </TimelineCard>
      ) : (
        <TimelineCard>
          <div className="relative">
            <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-emerald-200 z-0" />

            <TimelineRow node={<TimelineNode className="bg-emerald-600"><MapPin size={16} /></TimelineNode>}>
              <p className="text-sm font-bold text-slate-900">{pickupInfo.label}</p>
              {typeof pickupInfo.sub === 'string' && <p className="text-sm text-slate-500 mt-0.5">{pickupInfo.sub}</p>}
            </TimelineRow>

            {itinerary.filter((e) => e.day === 1).length === 0 ? (
              <TimelineRow node={<TimelineNode className="bg-slate-100"><div className="w-2 h-2 rounded-full bg-slate-300" /></TimelineNode>}>
                <p className="text-sm text-slate-400">No segments added yet</p>
              </TimelineRow>
            ) : (
              itinerary.filter((e) => e.day === 1).map((seg, i) => (
                <TimelineRow key={i} node={<ActivityIcon segment={seg} />}>
                  <SegmentContent seg={seg} />
                </TimelineRow>
              ))
            )}

            <TimelineRow node={<TimelineNode className="bg-emerald-50 border-2 border-emerald-200"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /></TimelineNode>}>
              <p className="text-sm font-bold text-slate-700">{dropoffInfo.label}</p>
              {typeof dropoffInfo.sub === 'string' && <p className="text-sm text-slate-500 mt-0.5">{dropoffInfo.sub}</p>}
            </TimelineRow>
          </div>
        </TimelineCard>
      )}

      <div className="flex items-center justify-end mt-8 pt-4 border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          Back to editor
        </button>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Step16Itinerary() {
  // ── Store reads ──
  const itinerary      = useProductBuilderStore((s) => s.itinerary)
  const duration       = useProductBuilderStore((s) => s.duration)
  const durationUnit   = useProductBuilderStore((s) => s.durationUnit)
  const locations      = useProductBuilderStore((s) => s.locations)
  const errors = useStepErrors(16)
  // Meeting/pickup fields (from Step 13)
  const meetingMode         = useProductBuilderStore((s) => s.meetingMode)
  const meetingPoint        = useProductBuilderStore((s) => s.meetingPoint)
  const pickupType          = useProductBuilderStore((s) => s.pickupType)
  const pickupLocations     = useProductBuilderStore((s) => s.pickupLocations)
  const pickupAreas         = useProductBuilderStore((s) => s.pickupAreas)
  // Dropoff fields
  const dropoffOption       = useProductBuilderStore((s) => s.dropoffOption)
  const dropoffLocation     = useProductBuilderStore((s) => s.dropoffLocation)

  // ── Derived state ──
  const numDays = getNumDays(duration, durationUnit)
  const isMultiDay = numDays > 1

  const [started, setStarted] = useState(() => itinerary?.length > 0)
  const [showDiagram, setShowDiagram] = useState(() => itinerary?.length > 0)

  // All tagged locations (product locations + pickup locations) for segment location search
  const taggedLocations = useMemo(() => {
    const locs = (locations || []).map((l) => ({ name: l.name, address: l.address, lat: l.lat, lng: l.lng, city: l.city, country: l.country }))
    const picks = (pickupLocations || []).map((l) => ({ name: l.name, address: l.address, lat: l.lat, lng: l.lng, city: l.city, country: l.country }))
    return [...locs, ...picks]
  }, [locations, pickupLocations])

  // ── Build pickup info label from Step 13 data ──
  const pickupInfo = useMemo(() => {
    if (meetingMode === 'pickup') {
      if (pickupType === 'address' && pickupLocations?.length > 0) {
        const count = pickupLocations.length
        const names = pickupLocations.map((l) => l.name || l.address).filter(Boolean).join(', ')
        return {
          label: `${count} pickup location option${count > 1 ? 's' : ''}:`,
          sub: names || '',
        }
      }
      if (pickupType === 'area' && pickupAreas?.length > 0) {
        const count = pickupAreas.length
        const names = pickupAreas.map((a) => a.name).filter(Boolean).join(', ')
        return {
          label: `${count} pickup area${count > 1 ? 's' : ''}:`,
          sub: names || '',
        }
      }
      return { label: 'Pickup location:', sub: '' }
    }
    if (meetingMode === 'meeting_point' && meetingPoint) {
      return {
        label: 'Starting location:',
        sub: meetingPoint.name || meetingPoint.address || '',
      }
    }
    // Fallback: derive from tagged locations
    if (locations?.length > 0) {
      return { label: 'Starting location:', sub: locations[0].name || '' }
    }
    return { label: 'Pickup location:', sub: '' }
  }, [meetingMode, meetingPoint, pickupType, pickupLocations, pickupAreas, locations])

  // ── Build dropoff info ──
  const dropoffInfo = useMemo(() => {
    if (dropoffOption === 'same_location') {
      return { label: 'Returns to starting point:', sub: pickupInfo.sub }
    }
    if (dropoffOption === 'different_location' && dropoffLocation) {
      return { label: 'Drop-off location:', sub: dropoffLocation.name || dropoffLocation.address || '' }
    }
    if (dropoffOption === 'service') {
      return { label: 'Drop-off service:', sub: '' }
    }
    // Mirror pickup
    if (meetingMode === 'pickup') {
      const count = pickupType === 'address' ? (pickupLocations?.length || 0) : (pickupAreas?.length || 0)
      const names = pickupType === 'address'
        ? (pickupLocations || []).map((l) => l.name || l.address).filter(Boolean).join(', ')
        : (pickupAreas || []).map((a) => a.name).filter(Boolean).join(', ')
      return {
        label: count > 0 ? `${count} drop-off location${count > 1 ? 's' : ''}:` : 'Drop-off location:',
        sub: names,
      }
    }
    if (meetingMode === 'meeting_point' && meetingPoint) {
      return { label: 'Drop-off location:', sub: meetingPoint.name || meetingPoint.address || '' }
    }
    return { label: 'Drop-off location:', sub: '' }
  }, [dropoffOption, dropoffLocation, pickupInfo, meetingMode, meetingPoint, pickupType, pickupLocations, pickupAreas])

  // ── Header (subtitle line only — page already renders the "Itinerary" h2) ──
  const header = (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-sm font-semibold text-slate-500">Itinerary builder</span>
      <HelpCircle size={15} className="text-slate-400" />
    </div>
  )

  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  }

  return (
    <div className="max-w-[860px]">
      {showDiagram ? (
        <ItineraryDiagram
          isMultiDay={isMultiDay}
          numDays={numDays}
          pickupInfo={pickupInfo}
          dropoffInfo={dropoffInfo}
          taggedLocations={taggedLocations}
          onBack={() => setShowDiagram(false)}
        />
      ) : (
        <>
          {header}
          <AnimatePresence mode="wait">
            {!started ? (
              <motion.div
                key="welcome"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <WelcomeScreen
                  isMultiDay={isMultiDay}
                  onStart={() => setStarted(true)}
                  errors={errors}
                />
              </motion.div>
            ) : isMultiDay ? (
              <motion.div
                key="multi"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <MultiDayBuilder
                  numDays={numDays}
                  pickupInfo={pickupInfo}
                  taggedLocations={taggedLocations}
                  onShowDiagram={() => setShowDiagram(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="single"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <SingleDayBuilder
                  pickupInfo={pickupInfo}
                  dropoffInfo={dropoffInfo}
                  taggedLocations={taggedLocations}
                  onShowDiagram={() => setShowDiagram(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}




