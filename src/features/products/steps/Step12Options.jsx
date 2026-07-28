import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  ArrowLeft, Plus, Check, X, Globe,
  Headphones, Book, Copy, Trash2, Clock,
} from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import { GYG_LANGUAGES } from '@/constants/gygLists'

const MAX_OPTIONS = 8

const SKIP_THE_LINE_OPTIONS = [
  { value: 'skip_tickets', label: 'Skip the line to get tickets' },
  { value: 'separate_entrance', label: 'Separate entrance' },
  { value: 'express_security', label: 'Express security' },
  { value: 'express_elevators', label: 'Express elevators' },
]

const VALIDITY_TYPE_OPTIONS = [
  { value: 'date_picked', label: 'Valid on date picked' },
  { value: 'from_activation', label: 'Valid for a specific period of time from first activation' },
  { value: 'period', label: 'Valid for a period of time' },
]

function NoYesPill({ value, onChange }) {
  return (
    <div className="flex bg-slate-100 rounded-lg p-0.5 w-fit">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 ${
          !value
            ? 'bg-white text-slate-800 shadow-sm'
            : 'bg-transparent text-slate-400 hover:text-slate-600'
        }`}
      >
        No
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-0 ${
          value
            ? 'bg-white text-slate-800 shadow-sm'
            : 'bg-transparent text-slate-400 hover:text-slate-600'
        }`}
      >
        Yes
      </button>
    </div>
  )
}

function LanguageInput({ languages, onAdd, onRemove }) {
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
      !languages.some((l) => l.toLowerCase() === lang.toLowerCase()),
  )

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {languages.map((lang, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-[13px] font-medium text-slate-700"
          >
            <Globe size={12} className="shrink-0 text-slate-400" />
            {lang}
            <button
              onClick={() => onRemove(i)}
              type="button"
              className="bg-transparent border-0 cursor-pointer text-slate-400 hover:text-red-500 p-0 leading-none transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          className="w-full min-h-[40px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm transition-all focus-ring"
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search for language"
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
          }}
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg mt-1">
          {filteredSuggestions.slice(0, 30).map((lang) => (
            <button
              key={lang}
              type="button"
              onMouseDown={() => {
                if (lang && !languages.some((l) => l.toLowerCase() === lang.toLowerCase())) {
                  onAdd(lang)
                }
                setInputValue('')
                inputRef.current?.focus()
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-2 cursor-pointer bg-transparent"
            >
              <Globe size={14} className="shrink-0 text-slate-400" />
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SkipLinePills({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {SKIP_THE_LINE_OPTIONS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              selected
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {selected && <Check size={12} className="shrink-0" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function DurationValidityBlock({ option, index, updateOption }) {
  const hasDuration = option.duration !== null && option.duration !== undefined
  const hasValidity = option.validityEnabled

  function toggleDuration(enabled) {
    if (enabled) updateOption(index, { duration: 1, durationUnit: 'hours', validityEnabled: false, validityType: 'date_picked', validity: null, validityUnit: null, validityStartDate: '', validityEndDate: '' })
    else updateOption(index, { duration: null, durationUnit: null })
  }

  function toggleValidity(enabled) {
    if (enabled) updateOption(index, { validityEnabled: true, validityType: 'date_picked', duration: null, durationUnit: null })
    else updateOption(index, { validityEnabled: false, validityType: 'date_picked', validity: null, validityUnit: null, validityStartDate: '', validityEndDate: '' })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 leading-relaxed">
        Some activities start and stop at specific times, like a tour. Others allow customers to use their ticket anytime within a certain amount of time, like a 2-day city pass.
      </p>
      <p className="text-[13px] font-medium text-slate-700">
        Which best describes your activity?
      </p>
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={hasDuration}
              onChange={(e) => toggleDuration(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 transition-all duration-150 grid place-items-center shrink-0">
              {hasDuration && <Check size={12} strokeWidth={3} className="text-white" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-slate-700 group-hover:text-slate-900">
              It lasts for a specific amount of time <span className="text-slate-400 font-normal">(duration). Includes transfer time.</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Example: 3-hour guided tour</p>
            {hasDuration && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[13px] text-slate-500">Lasts</span>
                <input
                  className="w-20 min-h-[34px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm transition-all focus-ring text-right"
                  type="number"
                  min={0}
                  value={option.duration ?? 1}
                  onChange={(e) => updateOption(index, { duration: e.target.value ? Number(e.target.value) : null })}
                />
                <Select value={option.durationUnit ?? 'hours'} onValueChange={(v) => updateOption(index, { durationUnit: v })}>
                  <SelectTrigger className="min-h-[34px] h-9 text-sm px-2 border-slate-200 rounded-lg">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minute(s)</SelectItem>
                    <SelectItem value="hours">Hour(s)</SelectItem>
                    <SelectItem value="days">Day(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={hasValidity}
              onChange={(e) => toggleValidity(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 transition-all duration-150 grid place-items-center shrink-0">
              {hasValidity && <Check size={12} strokeWidth={3} className="text-white" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-slate-700 group-hover:text-slate-900">
              Customers can use their ticket anytime during a certain period <span className="text-slate-400 font-normal">(validity)</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Example: museum tickets that can be used anytime during opening hours</p>
            {hasValidity && (
              <div className="mt-2 space-y-3">
                <Select value={option.validityType ?? 'date_picked'} onValueChange={(v) => updateOption(index, { validityType: v })}>
                  <SelectTrigger className="min-h-[38px] h-10 text-sm">
                    <SelectValue placeholder="Select validity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALIDITY_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {option.validityType === 'from_activation' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-slate-500">Valid for</span>
                    <input
                      className="w-20 min-h-[34px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm transition-all focus-ring text-right"
                      type="number"
                      min={0}
                      value={option.validity ?? 1}
                      onChange={(e) => updateOption(index, { validity: e.target.value ? Number(e.target.value) : null })}
                    />
                    <Select value={option.validityUnit ?? 'days'} onValueChange={(v) => updateOption(index, { validityUnit: v })}>
                      <SelectTrigger className="min-h-[34px] h-9 text-sm px-2 border-slate-200 rounded-lg">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Day(s)</SelectItem>
                        <SelectItem value="weeks">Week(s)</SelectItem>
                        <SelectItem value="months">Month(s)</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-[13px] text-slate-500">from first activation</span>
                  </div>
                )}

                {option.validityType === 'period' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-slate-500">From</span>
                    <input
                      className="flex-1 min-h-[34px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm transition-all focus-ring"
                      type="date"
                      value={option.validityStartDate ?? ''}
                      onChange={(e) => updateOption(index, { validityStartDate: e.target.value })}
                    />
                    <span className="text-[13px] text-slate-500">To</span>
                    <input
                      className="flex-1 min-h-[34px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm transition-all focus-ring"
                      type="date"
                      value={option.validityEndDate ?? ''}
                      onChange={(e) => updateOption(index, { validityEndDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </label>
      </div>
    </div>
  )
}

function OptionSummaryCard({ option, index, onEdit, onDuplicate, onRemove }) {
  const featurePills = []
  if (option.isPrivate) featurePills.push({ label: 'Private', type: 'private' })
  if (option.wheelchairAccessible) featurePills.push({ label: 'Wheelchair accessible', type: 'wc' })
  if (option.skipTheLine && option.skipTheLine !== 'none') featurePills.push({ label: 'Skip line', type: 'skip' })
  if (option.audioGuide) featurePills.push({ label: 'Audio guide', type: 'audio' })
  if (option.infoBooklet) featurePills.push({ label: 'Booklet', type: 'booklet' })
  if (option.maxGroupSize) featurePills.push({ label: `Max ${option.maxGroupSize} ppl`, type: 'group' })
  const langCount = option.languages?.length || 0

  let durationSummary = ''
  if (option.duration) {
    durationSummary = `${option.duration} ${option.durationUnit}`
  } else if (option.validityEnabled) {
    durationSummary = 'Valid for a period'
  } else {
    durationSummary = 'No duration set'
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-sm font-semibold text-slate-800 truncate">
              {option.title || 'Untitled'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            {langCount > 0 && (
              <span>{langCount} {langCount === 1 ? 'language' : 'languages'}</span>
            )}
            <span className="text-slate-300">|</span>
            <span>{durationSummary}</span>
            {option.refCode && option.refCode !== 'default' && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-slate-400">Ref: {option.refCode}</span>
              </>
            )}
          </div>

          {featurePills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {featurePills.map((p) => (
                <span key={p.type} className={`text-[11px] font-medium px-2 py-0.5 rounded-full leading-none ${
                  p.type === 'private' ? 'bg-violet-100 text-violet-600' :
                  p.type === 'wc' ? 'bg-emerald-100 text-emerald-600' :
                  p.type === 'skip' ? 'bg-amber-100 text-amber-600' :
                  p.type === 'audio' ? 'bg-emerald-100 text-emerald-600' :
                  p.type === 'booklet' ? 'bg-teal-100 text-teal-600' :
                  p.type === 'group' ? 'bg-orange-100 text-orange-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {p.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all bg-transparent border-0 cursor-pointer"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all bg-transparent border-0 cursor-pointer"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(index)}
            className="px-3 h-8 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all border-0 cursor-pointer"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

function OptionEditorScreen({ option, index, updateOption, onBack, onRemove, errors }) {
  const titleError = errors[`options.${index}.title`]
  const languagesError = errors[`options.${index}.languages`]

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 bg-transparent border-0 cursor-pointer transition-colors"
      >
        <ArrowLeft size={16} />
        Back to options
      </button>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="text-sm font-semibold text-slate-800">{option.title || 'Untitled'}</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="ml-auto w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all bg-transparent border-0 cursor-pointer"
          title="Remove option"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mx-auto" style={{ maxWidth: '600px' }}>
        <div className="mb-6" data-field={`options.${index}.title`}>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Option title <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full min-h-[42px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm transition-all focus-ring"
            type="text"
            value={option.title}
            onChange={(e) => updateOption(index, { title: e.target.value })}
            placeholder="e.g. Standard tour, Private experience, etc."
          />
          {titleError && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{titleError[0]}</span>}
        </div>

        <hr className="border-slate-100 mb-6" />

        <div className="mb-6" data-field={`options.${index}.refCode`}>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Option reference code <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <p className="text-xs text-slate-500 mb-2 leading-relaxed">
            Provide a reference code to help you keep track of which option the customer has booked. This is for your own records and won&apos;t be seen by the customer.
          </p>
          <div className="relative">
            <input
              className="w-full min-h-[42px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm transition-all focus-ring pr-16"
              type="text"
              value={option.refCode ?? ''}
              onChange={(e) => updateOption(index, { refCode: e.target.value })}
              maxLength={20}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              {(option.refCode ?? '').length} / 20
            </span>
          </div>
        </div>

        <hr className="border-slate-100 mb-6" />

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Maximum group size
          </label>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            What&apos;s the maximum total of people in your activity for each time slot? This includes those who don&apos;t book on GetYourGuide.
          </p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`maxGroupSize-${option.id}`}
                checked={option.maxGroupSize === null}
                onChange={() => updateOption(index, { maxGroupSize: null })}
                className="accent-emerald-600"
              />
              <span className="text-sm text-slate-600">No limit</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`maxGroupSize-${option.id}`}
                  checked={option.maxGroupSize !== null}
                  onChange={() => updateOption(index, { maxGroupSize: 10 })}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-slate-600">Max</span>
              </label>
              {option.maxGroupSize !== null && (
                <div className="flex items-center gap-1.5">
                  <input
                    className="w-20 min-h-[34px] rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm transition-all focus-ring text-right"
                    type="number"
                    min={1}
                    max={100}
                    value={option.maxGroupSize ?? ''}
                    onChange={(e) => updateOption(index, { maxGroupSize: e.target.value ? Number(e.target.value) : null })}
                  />
                  <span className="text-xs text-slate-400">people</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <hr className="border-slate-100 mb-6" />

        <div className="mb-6" data-field={`options.${index}.languages`}>
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            What languages is the activity offered in? <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">
            List all available languages to attract more customers.
          </p>
          <LanguageInput
            languages={option.languages}
            onAdd={(lang) => updateOption(index, { languages: [...option.languages, lang] })}
            onRemove={(idx) => updateOption(index, { languages: option.languages.filter((_, li) => li !== idx) })}
          />
          {languagesError && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{languagesError[0]}</span>}
        </div>

        <hr className="border-slate-100 mb-6" />

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Add guide materials <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            What guide materials do you provide in which languages? Choose all that apply.
          </p>
          <div className="flex flex-col gap-2.5 pl-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={option.audioGuide ?? false}
                  onChange={(e) => updateOption(index, { audioGuide: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 transition-all duration-150 grid place-items-center shrink-0">
                  {(option.audioGuide) && <Check size={12} strokeWidth={3} className="text-white" />}
                </div>
              </div>
              <Headphones size={14} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">Audio guides and headphones</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={option.infoBooklet ?? false}
                  onChange={(e) => updateOption(index, { infoBooklet: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 transition-all duration-150 grid place-items-center shrink-0">
                  {(option.infoBooklet) && <Check size={12} strokeWidth={3} className="text-white" />}
                </div>
              </div>
              <Book size={14} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">Information booklets</span>
            </label>
          </div>
        </div>

        <hr className="border-slate-100 mb-6" />

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            Is this a private activity?
          </label>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            This means that only one group or person can participate. There won&apos;t be other customers in the same activity.
          </p>
          <NoYesPill
            value={option.isPrivate}
            onChange={(v) => updateOption(index, { isPrivate: v })}
          />
        </div>

        <hr className="border-slate-100 mb-6" />

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Will the customer skip the line to get in? If so, which line?
          </label>
          <NoYesPill
            value={option.skipTheLine !== 'none'}
            onChange={(v) => updateOption(index, { skipTheLine: v ? 'skip_tickets' : 'none' })}
          />
          {option.skipTheLine !== 'none' && (
            <SkipLinePills
              value={option.skipTheLine}
              onChange={(v) => updateOption(index, { skipTheLine: v })}
            />
          )}
        </div>

        <hr className="border-slate-100 mb-6" />

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Is the activity wheelchair accessible?
          </label>
          <NoYesPill
            value={option.wheelchairAccessible}
            onChange={(v) => updateOption(index, { wheelchairAccessible: v })}
          />
        </div>

        <hr className="border-slate-100 mb-6" />

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-800 mb-3">
            Duration or validity
          </label>
          <DurationValidityBlock option={option} index={index} updateOption={updateOption} />
        </div>
      </div>
    </motion.div>
  )
}

export default function Step12Options() {
  const options = useProductBuilderStore((s) => s.options)
  const addOption = useProductBuilderStore((s) => s.addOption)
  const updateOption = useProductBuilderStore((s) => s.updateOption)
  const removeOption = useProductBuilderStore((s) => s.removeOption)
  const duplicateOption = useProductBuilderStore((s) => s.duplicateOption)
  const errors = useStepErrors(11)

  const [editingIndex, setEditingIndex] = useState(null)
  const [showIntro, setShowIntro] = useState(true)
  const creatingRef = useRef(false)
  const prevCountRef = useRef(options.length)

  useEffect(() => {
    if (creatingRef.current && options.length > prevCountRef.current) {
      setEditingIndex(options.length - 1)
      setShowIntro(false)
      creatingRef.current = false
    }
    prevCountRef.current = options.length
  }, [options.length])

  function handleCreate() {
    creatingRef.current = true
    addOption()
  }

  function handleEdit(index) {
    setEditingIndex(index)
  }

  function handleBack() {
    setEditingIndex(null)
  }

  const count = options.length
  const atLimit = count >= MAX_OPTIONS
  const nearLimit = count >= 6 && count < MAX_OPTIONS

  if (editingIndex !== null && options[editingIndex]) {
    return (
      <div className="max-w-[720px]" data-field="options">
        {errors.options && (
          <div className="flex items-center gap-1.5 text-[13px] text-red-600 font-medium mb-4">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#DC2626" strokeWidth="1.5" />
              <path d="M7 4V8M7 9.5V9.51" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {errors.options[0]}
          </div>
        )}
        <OptionEditorScreen
          option={options[editingIndex]}
          index={editingIndex}
          updateOption={updateOption}
          onBack={handleBack}
          onRemove={removeOption}
          errors={errors}
        />
      </div>
    )
  }

  if (showIntro && count === 0) {
    return (
      <div className="max-w-[720px]" data-field="options">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Add booking option(s) to your product</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            Options allow you to customize your activity and attract more customers. For example, your options can have different:
          </p>
          <ul className="text-sm text-slate-500 space-y-1 mb-4 list-disc pl-5">
            <li>durations (1 or 2 hours)</li>
            <li>group sizes (10 or 20 people) or set-ups (private or public)</li>
            <li>languages (English or Spanish)</li>
            <li>inclusions (with or without lunch)</li>
            <li>ways to start the activity (meeting point or hotel pickup)</li>
          </ul>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            The option is where the pricing/availability are stored, and where bookings are made. So you need at least one option per product to start receiving bookings.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all border-0 cursor-pointer"
          >
            <Plus size={16} />
            Create new option
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[720px]" data-field="options">
      {errors.options && (
        <div className="flex items-center gap-1.5 text-[13px] text-red-600 font-medium mb-4">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#DC2626" strokeWidth="1.5" />
            <path d="M7 4V8M7 9.5V9.51" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {errors.options[0]}
        </div>
      )}

      {count === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 grid place-items-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">No options yet</h4>
          <p className="text-[13px] text-slate-500 max-w-sm mx-auto leading-relaxed mb-5">
            You need at least one option to make your product bookable. Create one now.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all border-0 cursor-pointer"
          >
            <Plus size={16} />
            Create new option
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Product options</h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                atLimit ? 'bg-red-100 text-red-600' :
                nearLimit ? 'bg-amber-100 text-amber-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {count}/{MAX_OPTIONS}
              </span>
            </div>
            {!showIntro && count > 0 && (
              <button
                type="button"
                onClick={() => setShowIntro(true)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-transparent border-0 cursor-pointer transition-colors"
              >
                Show info
              </button>
            )}
          </div>

          {showIntro && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 mb-4">
              <p className="text-sm text-slate-500 leading-relaxed mb-3">
                Options allow you to customize your activity and attract more customers. For example, your options can have different:
              </p>
              <ul className="text-sm text-slate-500 space-y-0.5 mb-3 list-disc pl-5">
                <li>durations (1 or 2 hours)</li>
                <li>group sizes (10 or 20 people) or set-ups (private or public)</li>
                <li>languages (English or Spanish)</li>
                <li>inclusions (with or without lunch)</li>
                <li>ways to start the activity (meeting point or hotel pickup)</li>
              </ul>
              <p className="text-sm text-slate-500 leading-relaxed">
                The option is where the pricing/availability are stored, and where bookings are made. So you need at least one option per product to start receiving bookings.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowIntro(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer transition-colors"
                >
                  Hide info
                </button>
              </div>
            </div>
          )}

          {nearLimit && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[13px] font-medium text-amber-700">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <circle cx="8" cy="8" r="7" stroke="#D97706" strokeWidth="1.5" />
                <path d="M8 5V9M8 11V11.01" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              You&apos;re approaching the recommended limit of {MAX_OPTIONS} options. Consider using add-ons for smaller variations.
            </div>
          )}

          {atLimit && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-[13px] font-medium text-red-700">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5" />
                <path d="M8 5V9M8 11V11.01" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Maximum {MAX_OPTIONS} options reached. Remove an option or create a separate product for additional variations.
            </div>
          )}

          <div className="space-y-2">
            {options.map((opt, i) => (
              <OptionSummaryCard
                key={opt.id}
                option={opt}
                index={i}
                onEdit={handleEdit}
                onDuplicate={duplicateOption}
                onRemove={removeOption}
              />
            ))}
          </div>

          {!atLimit && (
            <button
              type="button"
              onClick={handleCreate}
              className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-slate-200 bg-transparent text-sm font-semibold text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all cursor-pointer"
            >
              <Plus size={16} className="group-hover:scale-110 transition-transform" />
              Add another option
            </button>
          )}
        </div>
      )}
    </div>
  )
}
