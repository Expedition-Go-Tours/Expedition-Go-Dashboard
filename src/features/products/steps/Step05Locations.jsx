import { useState, useEffect, useRef, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useGeocoding } from '@/hooks/useGeocoding'
const VISIT_TYPES = [
  { value: 'visit', label: 'Visit' },
  { value: 'pass_by', label: 'Pass by' },
  { value: 'guided_tour', label: 'Guided tour' },
  { value: 'free_time', label: 'Free time' },
  { value: 'photo_stop', label: 'Photo stop' },
]

const DEFAULT_CENTER = [2.3522, 48.8566]

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

  const inputRef = useRef(null)
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markers = useRef([])

  const { search, results, loading, clear } = useGeocoding()

  const hasCoords = useMemo(
    () => locations.some((l) => l.lat != null && l.lng != null),
    [locations],
  )

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: DEFAULT_CENTER,
      zoom: 2,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current) return
    markers.current.forEach((m) => m.remove())
    markers.current = []
    const coords = locations.filter((l) => l.lat != null && l.lng != null)
    if (coords.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    coords.forEach((l) => {
      const el = document.createElement('div')
      el.className = 'w-[18px] h-[18px] rounded-full bg-emerald-600 border-2 border-white shadow-md cursor-pointer'
      el.title = l.name
      const mkr = new maplibregl.Marker({ element: el })
        .setLngLat([l.lng, l.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText(l.name))
        .addTo(map.current)
      markers.current.push(mkr)
      bounds.extend([l.lng, l.lat])
    })
    if (coords.length === 1) {
      map.current.setCenter([coords[0].lng, coords[0].lat])
      map.current.setZoom(13)
    } else {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 })
    }
  }, [locations])

  useEffect(() => {
    if (!searchQuery.trim()) { clear(); return }
    search(searchQuery)
  }, [searchQuery])

  function selectResult(item) {
    addLocation({
      name: item.formatted || item.city || item.name || searchQuery.trim(),
      visitType: selectedVT,
      address: item.formatted || '',
      lat: item.latitude ?? null,
      lng: item.longitude ?? null,
    })
    setSearchQuery('')
    inputRef.current?.focus()
  }

  function addFallback() {
    const val = searchQuery.trim()
    if (!val) return
    addLocation({ name: val, visitType: selectedVT, address: '', lat: null, lng: null })
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

  const showDropdown = searchQuery.trim().length > 0 && (results.length > 0 || loading)

  return (
    <div className="max-w-[720px] space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Locations</h2>
        <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
          Add major sites or points of interest visited during the activity.
        </p>
      </div>

      {/* Search + visit type + add */}
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
          <select
            className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[140px] shrink-0"
            value={selectedVT}
            onChange={(e) => setSelectedVT(e.target.value)}
          >
            {VISIT_TYPES.map((vt) => (
              <option key={vt.value} value={vt.value}>{vt.label}</option>
            ))}
          </select>
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

        {/* Autocomplete dropdown */}
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
                        item.source === 'geoapify' ? 'bg-blue-50 text-blue-600' :
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

      {/* Map preview */}
      {locations.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <div ref={mapContainer} style={{ height: hasCoords ? '200px' : '0', width: '100%' }} />
          {!hasCoords && (
            <div className="px-4 py-3 text-[13px] text-slate-400 bg-slate-50 italic">
              Map preview will appear when locations with coordinates are added.
            </div>
          )}
        </div>
      )}

      {/* Location list (drag-to-reorder) */}
      {locations.length > 0 && (
        <div>
          <p className="text-[13px] font-semibold text-slate-600 mb-2">
            Added locations ({locations.length}) — drag to reorder
          </p>
          <ul className="list-none p-0 m-0 space-y-1">
            {locations.map((loc, i) => (
              <li
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                  dragOverIdx === i && dragIdx !== i
                    ? 'border-emerald-400 bg-emerald-50'
                    : dragIdx === i
                    ? 'border-slate-300 bg-slate-50 opacity-60'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <span className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0" title="Drag to reorder">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-slate-800">{loc.name}</span>
                  {loc.address && loc.address !== loc.name && (
                    <span className="text-slate-400 ml-1">— {loc.address}</span>
                  )}
                </div>
                <select
                  className="min-h-[30px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-[13px] transition-all focus-ring"
                  value={loc.visitType}
                  onChange={(e) => updateLocation(i, { visitType: e.target.value })}
                >
                  {VISIT_TYPES.map((vt) => (
                    <option key={vt.value} value={vt.value}>{vt.label}</option>
                  ))}
                </select>
                <button
                  className="shrink-0 w-7 h-7 rounded-lg border-0 bg-transparent text-slate-400 cursor-pointer grid place-items-center text-xs hover:text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => removeLocation(i)}
                  type="button"
                  title="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[13px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
        Locations cannot be edited after the product is published. Select the visit type for each location.
      </p>
    </div>
  )
}
