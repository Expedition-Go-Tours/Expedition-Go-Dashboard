import { useState, useRef } from 'react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { GYG_ACTIVITIES, GYG_PICKUP_TRANSPORT } from '@/constants/gygLists'

function TagList({ items, onAdd, onRemove, placeholder, suggestions = [] }) {
  const inputRef = useRef(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState('')

  function handleAdd() {
    const val = inputValue.trim()
    if (val) {
      onAdd(val)
      setInputValue('')
      if (inputRef.current) inputRef.current.focus()
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !items.some((item) => item.toLowerCase() === s.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 rounded-full text-[13px] font-semibold"
          >
            {item}
            <button
              onClick={() => onRemove(i)}
              type="button"
              className="bg-transparent border-0 cursor-pointer text-xs text-slate-500 p-0"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <button
          onClick={handleAdd}
          className="shrink-0 h-[46px] px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold border-0 cursor-pointer hover:bg-emerald-700 transition-colors"
          type="button"
          disabled={!inputValue.trim()}
        >
          Add
        </button>
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="mt-1.5 absolute z-10 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
          {filteredSuggestions.slice(0, 20).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setInputValue(suggestion)
                handleAdd()
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TransportTypeGroup({ items, onAdd, onRemove }) {
  const categories = Object.entries(GYG_PICKUP_TRANSPORT)

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full text-[13px] font-semibold text-emerald-700"
          >
            {item}
            <button
              onClick={() => onRemove(i)}
              type="button"
              className="bg-transparent border-0 cursor-pointer text-xs text-emerald-500 p-0"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {categories.map(([category, types]) => (
          <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {category}
              </span>
            </div>
            <div className="p-3 space-y-2">
              {types.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 cursor-pointer text-sm transition-all ${
                    items.includes(type)
                      ? 'text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={items.includes(type)}
                    onChange={() => onAdd(type)}
                    className="w-[18px] h-[18px] cursor-pointer text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ToggleGroup({ options, value, onChange, label }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold mb-2 text-slate-800">{label}</label>}
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
              value === opt.value
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Step07Inclusions() {
  const store = useProductBuilderStore()
  const {
    whatsIncluded,
    whatsNotIncluded,
    activitiesIncluded,
    pickupTransportTypes,
    guideType,
    foodProvided,
    mealType,
    drinksIncluded,
    dietaryOptions,
    transportationProvided,
    transportationType,
  } = store
  const setField = useProductBuilderStore((s) => s.setField)
  const addInclusionItem = useProductBuilderStore((s) => s.addInclusionItem)
  const removeInclusionItem = useProductBuilderStore((s) => s.removeInclusionItem)
  const addActivityIncluded = useProductBuilderStore((s) => s.addActivityIncluded)
  const removeActivityIncluded = useProductBuilderStore((s) => s.removeActivityIncluded)
  const addPickupTransportType = useProductBuilderStore((s) => s.addPickupTransportType)
  const removePickupTransportType = useProductBuilderStore((s) => s.removePickupTransportType)
  const addDietaryOption = useProductBuilderStore((s) => s.addDietaryOption)
  const removeDietaryOption = useProductBuilderStore((s) => s.removeDietaryOption)

  return (
    <div className="max-w-[720px] space-y-6">
      {/* What's Included */}
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-800">What's included?</label>
        <TagList
          items={whatsIncluded}
          onAdd={(v) => addInclusionItem('whatsIncluded', v)}
          onRemove={(i) => removeInclusionItem('whatsIncluded', i)}
          placeholder="e.g. Entrance fees, Guide, Equipment"
        />
      </div>

      {/* What's Not Included */}
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-800">What's not included?</label>
        <TagList
          items={whatsNotIncluded}
          onAdd={(v) => addInclusionItem('whatsNotIncluded', v)}
          onRemove={(i) => removeInclusionItem('whatsNotIncluded', i)}
          placeholder="e.g. Food, Drinks, Hotel pickup"
        />
      </div>

      <hr className="border-slate-100" />

      {/* Guide Information */}
      <ToggleGroup
        label="Who will customers interact with?"
        options={[
          { value: 'guide', label: 'Guide' },
          { value: 'driver', label: 'Driver' },
          { value: 'host', label: 'Host' },
          { value: 'nobody', label: 'Nobody' },
        ]}
        value={guideType}
        onChange={(v) => setField('guideType', v)}
      />

      <hr className="border-slate-100" />

      {/* Activities & Experiences */}
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-800">Activities & experiences</label>
        <p className="text-[13px] text-slate-500 mb-2 leading-relaxed">
          Select the main activities included in this experience. You can also type to add custom activities.
        </p>
        <TagList
          items={activitiesIncluded}
          onAdd={addActivityIncluded}
          onRemove={removeActivityIncluded}
          placeholder="Type an activity and press Enter..."
          suggestions={GYG_ACTIVITIES}
        />
      </div>

      <hr className="border-slate-100" />

      {/* Food */}
      <div>
        <ToggleGroup
          label="Is food provided?"
          options={[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ]}
          value={foodProvided}
          onChange={(v) => setField('foodProvided', v)}
        />

        {foodProvided && (
          <div className="mt-4 space-y-4 pl-0">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-800">Type of meal</label>
              <input
                className="w-full min-h-[40px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-ring"
                type="text"
                value={mealType}
                onChange={(e) => setField('mealType', e.target.value)}
                placeholder="e.g. Lunch, Dinner, Tasting menu"
              />
            </div>

            <ToggleGroup
              label="Are drinks included?"
              options={[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ]}
              value={drinksIncluded}
              onChange={(v) => setField('drinksIncluded', v)}
            />

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-800">Dietary options</label>
              <TagList
                items={dietaryOptions}
                onAdd={addDietaryOption}
                onRemove={removeDietaryOption}
                placeholder="e.g. Vegetarian, Vegan, Gluten-free"
              />
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Transportation Types */}
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-800">Transportation type</label>
        <p className="text-[13px] text-slate-500 mb-2 leading-relaxed">
          Select the types of transportation used during the activity. Categories are grouped for easy selection.
        </p>
        <TransportTypeGroup
          items={pickupTransportTypes}
          onAdd={addPickupTransportType}
          onRemove={removePickupTransportType}
        />
      </div>

      <hr className="border-slate-100" />

      {/* Transportation Provided */}
      <div>
        <ToggleGroup
          label="Is transportation provided during the activity?"
          options={[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ]}
          value={transportationProvided}
          onChange={(v) => setField('transportationProvided', v)}
        />

        {transportationProvided && (
          <div className="mt-4">
            <label className="block text-sm font-semibold mb-1.5 text-slate-800">Type of transportation</label>
            <input
              className="w-full min-h-[40px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus-ring"
              type="text"
              value={transportationType}
              onChange={(e) => setField('transportationType', e.target.value)}
              placeholder="e.g. Minibus, Boat, Bicycle"
            />
          </div>
        )}
      </div>
    </div>
  )
}