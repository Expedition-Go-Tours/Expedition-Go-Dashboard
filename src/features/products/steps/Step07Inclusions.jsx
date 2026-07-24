import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Info, HelpCircle, Plus, X, Check } from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { GYG_ACTIVITIES } from '@/constants/gygLists'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Brunch', 'Lunch or dinner, depending on starting time']
const MEAL_FORMATS = ['Full meal', 'Food tasting', 'Cooking class', 'Buffet', 'Snack', 'Picnic', 'Packed meal', 'BBQ']

function TagList({ items, onAdd, onRemove, placeholder, suggestions = [] }) {
  const inputRef = useRef(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState('')

  function handleAdd(val) {
    const value = (val ?? inputValue).trim()
    if (value) {
      onAdd(value)
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
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full text-[13px] font-semibold"
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
                const value = suggestion.trim()
                if (value) {
                  onAdd(value)
                  setInputValue('')
                  setShowSuggestions(false)
                }
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

function InclusionList({ items, field, placeholder, accent }) {
  const addInclusionItem = useProductBuilderStore((s) => s.addInclusionItem)
  const removeInclusionItem = useProductBuilderStore((s) => s.removeInclusionItem)
  const updateInclusionItem = useProductBuilderStore((s) => s.updateInclusionItem)
  const inputRefs = useRef([])
  const isEmerald = accent === 'emerald'

  function handleAdd() {
    addInclusionItem(field, '')
    setTimeout(() => {
      inputRefs.current[items.length]?.focus()
    }, 0)
  }

  const label = isEmerald ? 'inclusion' : 'exclusion'

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2.5"
          >
            <span className={`shrink-0 w-6 h-6 rounded-full grid place-items-center ${
              isEmerald ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
            }`}>
              {isEmerald ? <Check size={13} /> : <X size={13} />}
            </span>
            <input
              ref={(el) => { inputRefs.current[i] = el }}
              className="flex-1 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-all focus-ring"
              type="text"
              value={item}
              onChange={(e) => updateInclusionItem(field, i, e.target.value)}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeInclusionItem(field, i)}
              className="shrink-0 w-7 h-7 rounded-lg border-0 bg-transparent text-slate-400 cursor-pointer grid place-items-center hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </div>
      {items.length === 0 ? (
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="underline">
            Add {label}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="underline">
            Add another {label}
          </span>
        </button>
      )}
    </div>
  )
}

function ActivityList() {
  const items = useProductBuilderStore((s) => s.activitiesIncluded)
  const onAdd = useProductBuilderStore((s) => s.addActivityIncluded)
  const onRemove = useProductBuilderStore((s) => s.removeActivityIncluded)
  const inputRef = useRef(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const filtered = inputValue.trim()
    ? GYG_ACTIVITIES.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !items.some((item) => item.toLowerCase() === s.toLowerCase()),
      )
    : GYG_ACTIVITIES.filter(
        (s) => !items.some((item) => item.toLowerCase() === s.toLowerCase()),
      )

  function handleAdd() {
    const val = inputValue.trim()
    if (!val) return
    onAdd(val)
    setInputValue('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  function handleBlur() {
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full text-[13px] font-semibold"
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
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          placeholder="Type an activity and press Enter..."
          onKeyDown={handleKeyDown}
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
      {showDropdown && filtered.length > 0 && (
        <div className="mt-1.5 absolute z-10 w-full max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
          {filtered.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                setInputValue(suggestion)
                setShowDropdown(false)
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

export default function Step07Inclusions() {
  const store = useProductBuilderStore()
  const {
    whatsIncluded,
    whatsNotIncluded,
    foodProvided,
    meals,
    drinksIncluded,
    showDietaryRestrictions,
    dietaryOptions,
  } = store
  const setField = useProductBuilderStore((s) => s.setField)
  const addMeal = useProductBuilderStore((s) => s.addMeal)
  const updateMeal = useProductBuilderStore((s) => s.updateMeal)
  const removeMeal = useProductBuilderStore((s) => s.removeMeal)
  const addDietaryOption = useProductBuilderStore((s) => s.addDietaryOption)
  const removeDietaryOption = useProductBuilderStore((s) => s.removeDietaryOption)

  return (
    <div className="max-w-[720px] space-y-6">
      {/* What's Included */}
      <div data-field="whatsIncluded">
        <label className="block text-sm font-semibold mb-1.5 text-slate-800">What's included?</label>
        <InclusionList
          items={whatsIncluded}
          field="whatsIncluded"
          placeholder="e.g. Entrance fees, Guide, Equipment"
          accent="emerald"
        />
      </div>

      {/* What's Not Included */}
      <div data-field="whatsNotIncluded">
        <label className="block text-sm font-semibold mb-1.5 text-slate-800">What's not included?</label>
        <InclusionList
          items={whatsNotIncluded}
          field="whatsNotIncluded"
          placeholder="e.g. Food, Drinks, Hotel pickup"
          accent="rose"
        />
      </div>

      {/* Activities & Experiences */}
      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-800">Activities & experiences</label>
        <p className="text-[13px] text-slate-500 mb-2 leading-relaxed">
          Select the main activities included in this experience. You can also type to add custom activities.
        </p>
        <ActivityList />
      </div>

      <hr className="border-slate-100" />

      {/* Food & Drinks */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <h3 className="text-base font-semibold text-slate-900">Food & drinks</h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
            <Info className="w-3.5 h-3.5" />
            Customizable
          </span>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm font-semibold text-slate-800">Is food included in your activity?</label>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="foodProvided"
                data-field="foodProvided"
                checked={foodProvided === false}
                onChange={() => setField('foodProvided', false)}
                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="foodProvided"
                data-field="foodProvided"
                checked={foodProvided === true}
                onChange={() => {
                  setField('foodProvided', true)
                  if (meals.length === 0) addMeal()
                }}
                className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Yes</span>
            </label>
          </div>
        </div>

        {foodProvided && (
          <div className="space-y-4">
            {/* Meal rows */}
            <div className="space-y-3" data-field="meals">
              {meals.map((meal, i) => (
                <div key={i} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Type of meal</label>
                    <Select value={meal.type} onValueChange={(v) => updateMeal(i, 'type', v)}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Format</label>
                    <Select value={meal.format} onValueChange={(v) => updateMeal(i, 'format', v)}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_FORMATS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {meals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMeal(i)}
                      className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMeal}
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="underline">Meal</span>
            </button>

            {/* Drinks checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-2">
              <input
                type="checkbox"
                data-field="drinksIncluded"
                checked={drinksIncluded}
                onChange={(e) => setField('drinksIncluded', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700">Drinks are included</span>
            </label>

            {/* Dietary restrictions toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-slate-700">
                Show dietary restrictions ({dietaryOptions.length})
              </span>
              <button
                type="button"
                onClick={() => setField('showDietaryRestrictions', !showDietaryRestrictions)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showDietaryRestrictions ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showDietaryRestrictions ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {showDietaryRestrictions && (
              <div className="mt-2">
                <TagList
                  items={dietaryOptions}
                  onAdd={addDietaryOption}
                  onRemove={removeDietaryOption}
                  placeholder="e.g. Vegetarian, Vegan, Gluten-free"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}