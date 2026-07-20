import { useRef, useState } from 'react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import { GYG_LANGUAGES } from '@/constants/gygLists'

function LanguageSelector({ languages, onAdd, onRemove, placeholder = 'Search languages...' }) {
  const inputRef = useRef(null)
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  function handleAdd() {
    const val = inputValue.trim()
    if (val && !languages.some((l) => l.toLowerCase() === val.toLowerCase())) {
      onAdd(val)
      setInputValue('')
      if (inputRef.current) inputRef.current.focus()
    }
  }

  const filteredSuggestions = GYG_LANGUAGES.filter(
    (lang) =>
      lang.toLowerCase().includes(inputValue.toLowerCase()) &&
      !languages.some((l) => l.toLowerCase() === lang.toLowerCase())
  )

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {languages.map((lang, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 rounded-full text-[13px] font-semibold"
          >
            {lang}
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
      <input
        ref={inputRef}
        className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
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
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg mt-1">
          {filteredSuggestions.slice(0, 20).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                setInputValue(lang)
                handleAdd()
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Step10Options() {
  const options = useProductBuilderStore((s) => s.options)
  const addOption = useProductBuilderStore((s) => s.addOption)
  const updateOption = useProductBuilderStore((s) => s.updateOption)
  const removeOption = useProductBuilderStore((s) => s.removeOption)
  const errors = useStepErrors(10)

  return (
    <div className="max-w-[720px]">
      <label className="block text-sm font-semibold mb-2 text-slate-800">Product options</label>
      <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
        Create different variations of your product (e.g. different durations, inclusions, or languages).
      </p>

      {options.map((opt, i) => (
        <div key={opt.id} className="p-5 mb-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <strong className="text-sm">Option {i + 1}</strong>
            <button
              className="bg-transparent border-0 text-red-500 cursor-pointer text-sm p-1 rounded-lg hover:bg-red-50"
              onClick={() => removeOption(i)}
              type="button"
            >
              ✕ Remove
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-semibold mb-1 text-slate-500">Title</label>
            <input
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
              type="text"
              value={opt.title}
              onChange={(e) => updateOption(i, { title: e.target.value })}
              placeholder="e.g. 2-Hour Morning Tour"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-semibold mb-1 text-slate-500">Reference code</label>
            <input
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
              type="text"
              value={opt.refCode ?? ''}
              onChange={(e) => updateOption(i, { refCode: e.target.value })}
              placeholder="Internal code (optional)"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-semibold mb-1 text-slate-500">Description</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
              rows={2}
              value={opt.description ?? ''}
              onChange={(e) => updateOption(i, { description: e.target.value })}
              placeholder="Only if title cannot explain the difference (optional)"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-semibold mb-1 text-slate-500">Languages</label>
            <LanguageSelector
              languages={opt.languages}
              onAdd={(lang) => updateOption(i, { languages: [...opt.languages, lang] })}
              onRemove={(idx) =>
                updateOption(i, { languages: opt.languages.filter((_, li) => li !== idx) })
              }
            />
          </div>

          <div className="flex gap-5 flex-wrap my-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={opt.isPrivate}
                onChange={(e) => updateOption(i, { isPrivate: e.target.checked })}
                className="w-[18px] h-[18px] cursor-pointer"
              />
              <span>Private activity</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={opt.wheelchairAccessible}
                onChange={(e) => updateOption(i, { wheelchairAccessible: e.target.checked })}
                className="w-[18px] h-[18px] cursor-pointer"
              />
              <span>Wheelchair accessible</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-semibold mb-1 text-slate-500">Skip the line</label>
            <select
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
              value={opt.skipTheLine}
              onChange={(e) => updateOption(i, { skipTheLine: e.target.value })}
            >
              <option value="none">None</option>
              <option value="skip_tickets">Skip the line to get tickets</option>
              <option value="separate_entrance">Skip through a separate entrance</option>
              <option value="express_security">Express security check</option>
              <option value="express_elevators">Express elevators</option>
            </select>
          </div>

          <div className="flex gap-2.5 items-end">
            <div className="flex-1">
              <label className="block text-[13px] font-semibold mb-1 text-slate-500">Duration</label>
              <input
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                type="number"
                value={opt.duration ?? ''}
                onChange={(e) =>
                  updateOption(i, {
                    duration: e.target.value ? Number(e.target.value) : null,
                    durationUnit: e.target.value ? opt.durationUnit ?? 'hours' : null,
                  })
                }
                placeholder="Leave blank if not applicable"
              />
            </div>
            {opt.duration !== null && (
              <div className="w-[120px]">
                <label className="block text-[13px] font-semibold mb-1 text-slate-500">Unit</label>
                <select
                  className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                  value={opt.durationUnit ?? 'hours'}
                  onChange={(e) => updateOption(i, { durationUnit: e.target.value })}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2.5 items-end mt-4">
            <div className="flex-1">
              <label className="block text-[13px] font-semibold mb-1 text-slate-500">Validity period</label>
              <input
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                type="number"
                value={opt.validity ?? ''}
                onChange={(e) =>
                  updateOption(i, {
                    validity: e.target.value ? Number(e.target.value) : null,
                    validityUnit: e.target.value ? opt.validityUnit ?? 'days' : null,
                  })
                }
                placeholder="Leave blank if not applicable"
              />
            </div>
            {opt.validity !== null && (
              <div className="w-[120px]">
                <label className="block text-[13px] font-semibold mb-1 text-slate-500">Unit</label>
                <select
                  className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                  value={opt.validityUnit ?? 'days'}
                  onChange={(e) => updateOption(i, { validityUnit: e.target.value })}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
            )}
          </div>
        </div>
      ))}

      {errors.options && (
        <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">
          {errors.options[0]}
        </span>
      )}
      <button
        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors mt-3"
        onClick={addOption}
        type="button"
      >
        + Add option
      </button>
    </div>
  )
}