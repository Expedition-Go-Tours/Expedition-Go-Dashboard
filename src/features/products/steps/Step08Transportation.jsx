import { useState, useMemo } from 'react'
import { Search, X, HelpCircle } from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { GYG_PICKUP_TRANSPORT } from '@/constants/gygLists'

function TransportChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-slate-200 transition-colors"
      >
        <X size={14} />
      </button>
    </span>
  )
}

function TransportTypeSelector({ items, onAdd, onRemove }) {
  const [search, setSearch] = useState('')
  const categories = Object.entries(GYG_PICKUP_TRANSPORT)

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase()
    return categories
      .map(([category, types]) => [
        category,
        types.filter((t) => t.toLowerCase().includes(q)),
      ])
      .filter(([, types]) => types.length > 0)
  }, [search, categories])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for items"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <TransportChip
              key={item}
              label={item}
              onRemove={() => onRemove(items.indexOf(item))}
            />
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {filteredCategories.map(([category, types]) => (
          <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{category}</span>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {types.map((type) => {
                const selected = items.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (selected) onRemove(items.indexOf(type))
                      else onAdd(type)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Step08Transportation() {
  const transportationProvided = useProductBuilderStore((s) => s.transportationProvided)
  const pickupTransportTypes = useProductBuilderStore((s) => s.pickupTransportTypes)
  const crossCityTravel = useProductBuilderStore((s) => s.crossCityTravel)
  const setField = useProductBuilderStore((s) => s.setField)
  const addPickupTransportType = useProductBuilderStore((s) => s.addPickupTransportType)
  const removePickupTransportType = useProductBuilderStore((s) => s.removePickupTransportType)

  return (
    <div className="max-w-[720px] space-y-6">
      {/* Is transportation used during this activity? */}
      <div data-field="transportationProvided">
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-semibold text-slate-800">
            Is transportation used during this activity?
          </label>
          <HelpCircle size={16} className="text-blue-500" />
        </div>
        <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
          Provide the main transportation type(s) that customers use during the experience,
          like a Segway or bike. Transportation used for pickup and drop-off will be added
          later.
        </p>

        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="transportationProvided"
              checked={transportationProvided === false}
              onChange={() => setField('transportationProvided', false)}
              className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900">No</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="transportationProvided"
              checked={transportationProvided === true}
              onChange={() => setField('transportationProvided', true)}
              className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900">Yes</span>
          </label>
        </div>
      </div>

      {/* Transportation type selector — only when Yes */}
      {transportationProvided && (
        <div data-field="transportationType">
          <label className="block text-sm font-semibold mb-1.5 text-slate-800">Transportation type</label>
          <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
            Select the types of transportation used during the activity. Categories are grouped for easy selection.
          </p>
          <TransportTypeSelector
            items={pickupTransportTypes}
            onAdd={addPickupTransportType}
            onRemove={removePickupTransportType}
          />
        </div>
      )}

      {/* Different city/town question — only when Yes */}
      {transportationProvided && (
        <div data-field="crossCityTravel">
          <label className="block text-sm font-semibold text-slate-800 mb-4">
            Do customers travel to a different city/town during the activity?
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="crossCityTravel"
                checked={crossCityTravel === true}
                onChange={() => setField('crossCityTravel', true)}
                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 mt-0.5"
              />
              <div>
                <span className="text-sm text-slate-700 group-hover:text-slate-900">Yes</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Example: going from Paris to Versailles
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="crossCityTravel"
                checked={crossCityTravel === false}
                onChange={() => setField('crossCityTravel', false)}
                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 mt-0.5"
              />
              <div>
                <span className="text-sm text-slate-700 group-hover:text-slate-900">No</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Example: going from one part of Paris to another part of Paris
                </p>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
