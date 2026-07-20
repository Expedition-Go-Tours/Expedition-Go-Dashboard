import { useRef, useState } from 'react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { GYG_MANDATORY_ITEMS, GYG_NOT_ALLOWED, GYG_NOT_SUITABLE_FOR } from '@/constants/gygLists'

function TagList({ items, onAdd, onRemove, placeholder, suggestions = [] }) {
  const inputRef = useRef(null)
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

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
    <div className="relative">
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
        <div className="absolute z-10 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg mt-1">
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

export default function Step09ExtraInfo() {
  const notSuitableFor = useProductBuilderStore((s) => s.notSuitableFor)
  const notAllowed = useProductBuilderStore((s) => s.notAllowed)
  const petFriendly = useProductBuilderStore((s) => s.petFriendly)
  const mandatoryItems = useProductBuilderStore((s) => s.mandatoryItems)
  const knowBeforeYouGo = useProductBuilderStore((s) => s.knowBeforeYouGo)
  const emergencyCountryCode = useProductBuilderStore((s) => s.emergencyCountryCode)
  const emergencyPhone = useProductBuilderStore((s) => s.emergencyPhone)
  const voucherInfo = useProductBuilderStore((s) => s.voucherInfo)
  const setField = useProductBuilderStore((s) => s.setField)
  const addNotSuitable = useProductBuilderStore((s) => s.addNotSuitable)
  const removeNotSuitable = useProductBuilderStore((s) => s.removeNotSuitable)
  const addNotAllowed = useProductBuilderStore((s) => s.addNotAllowed)
  const removeNotAllowed = useProductBuilderStore((s) => s.removeNotAllowed)
  const addMandatoryItem = useProductBuilderStore((s) => s.addMandatoryItem)
  const removeMandatoryItem = useProductBuilderStore((s) => s.removeMandatoryItem)

  return (
    <div className="max-w-[720px]">
      <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
        All fields on this page are optional.
      </p>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          Who is this activity not suitable for?
        </label>
        <TagList
          items={notSuitableFor}
          onAdd={addNotSuitable}
          onRemove={removeNotSuitable}
          placeholder="e.g. Pregnant women, People with back problems"
          suggestions={GYG_NOT_SUITABLE_FOR}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          What's not allowed?
        </label>
        <TagList
          items={notAllowed}
          onAdd={addNotAllowed}
          onRemove={removeNotAllowed}
          placeholder="e.g. Pets, Smoking, Large bags"
          suggestions={GYG_NOT_ALLOWED}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Pet policy</label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={petFriendly}
            onChange={(e) => setField('petFriendly', e.target.checked)}
            className="w-[18px] h-[18px] cursor-pointer"
          />
          <span>Pets are allowed</span>
        </label>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          What mandatory items must the customer bring?
        </label>
        <TagList
          items={mandatoryItems}
          onAdd={addMandatoryItem}
          onRemove={removeMandatoryItem}
          placeholder="e.g. Passport, Comfortable shoes, Swimsuit"
          suggestions={GYG_MANDATORY_ITEMS}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Know before you go</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
          rows={4}
          value={knowBeforeYouGo}
          onChange={(e) => setField('knowBeforeYouGo', e.target.value)}
          placeholder="Insurance requirements, appropriate clothing, necessary documents..."
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Emergency contact number</label>
        <div className="flex gap-2.5 items-end">
          <input
            className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[140px]"
            type="text"
            value={emergencyCountryCode}
            onChange={(e) => setField('emergencyCountryCode', e.target.value)}
            placeholder="Country code"
          />
          <input
            className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring flex-1"
            type="text"
            value={emergencyPhone}
            onChange={(e) => setField('emergencyPhone', e.target.value)}
            placeholder="Phone number"
          />
        </div>
        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
          This number will appear on the customer voucher.
        </p>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Information on the voucher</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
          rows={4}
          value={voucherInfo}
          onChange={(e) => setField('voucherInfo', e.target.value)}
          placeholder="Any additional information customers need after booking..."
        />
      </div>
    </div>
  )
}