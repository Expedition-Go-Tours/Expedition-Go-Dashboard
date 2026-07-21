import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  List, SlidersHorizontal, Clock, Copy, Trash2,
  ChevronDown, GripVertical, Plus, Globe, Check, X,
  Users, Headphones, Book, Shield,
} from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import { GYG_LANGUAGES } from '@/constants/gygLists'

const MAX_OPTIONS = 8

const SKIP_THE_LINE_OPTIONS = [
  { value: 'none', label: 'None' },
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

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 group cursor-pointer"
    >
      <div className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 ${
        checked ? 'bg-emerald-500' : 'bg-slate-200'
      }`}>
        <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`} />
      </div>
      <span className="text-sm text-slate-600 group-hover:text-slate-800 select-none">{label}</span>
    </button>
  )
}

function SkipLinePills({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
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
      !languages.some((l) => l.toLowerCase() === lang.toLowerCase())
  )

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {languages.map((lang, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-[13px] font-medium text-slate-700"
          >
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
          placeholder="Search languages..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
          }}
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg mt-1">
          {filteredSuggestions.slice(0, 20).map((lang) => (
            <button
              key={lang}
              type="button"
              onMouseDown={() => {
                setInputValue(lang)
                setTimeout(handleAdd, 0)
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

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg bg-slate-100 grid place-items-center">
        <Icon size={14} className="text-slate-500" />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  )
}

function DurationValidityBlock({ option, index, updateOption }) {
  const hasDuration = option.duration !== null && option.duration !== undefined
  const hasValidity = option.validityEnabled

  function toggleDuration(enabled) {
    if (enabled) updateOption(index, { duration: 1, durationUnit: 'hours' })
    else updateOption(index, { duration: null, durationUnit: null })
  }

  function toggleValidity(enabled) {
    if (enabled) updateOption(index, { validityEnabled: true, validityType: 'date_picked' })
    else updateOption(index, { validityEnabled: false, validityType: 'date_picked', validity: null, validityUnit: null, validityStartDate: '', validityEndDate: '' })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-medium text-slate-600 mb-2">
          What best describes your activity?
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
                It lasts for a specific amount of time
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Use this for tours, guided walks, or any timed experience with a fixed length.
              </p>
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
                  <select
                    className="min-h-[34px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm transition-all focus-ring cursor-pointer"
                    value={option.durationUnit ?? 'hours'}
                    onChange={(e) => updateOption(index, { durationUnit: e.target.value })}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
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
                Customers can use their ticket anytime during a certain period
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Choose this for attraction tickets, open-dated passes, or flexible entries.
              </p>
              {hasValidity && (
                <div className="mt-2 space-y-3">
                  <select
                    className="w-full min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm transition-all focus-ring cursor-pointer"
                    value={option.validityType ?? 'date_picked'}
                    onChange={(e) => updateOption(index, { validityType: e.target.value })}
                  >
                    {VALIDITY_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

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
                      <select
                        className="min-h-[34px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm transition-all focus-ring cursor-pointer"
                        value={option.validityUnit ?? 'days'}
                        onChange={(e) => updateOption(index, { validityUnit: e.target.value })}
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
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
    </div>
  )
}

function OptionCardCollapsible({ option, index, isExpanded, onToggle, updateOption, removeOption, duplicateOption, dragHandlers, isDragging, dragOver }) {
  const featurePills = []
  if (option.isPrivate) featurePills.push({ label: 'Private', type: 'private' })
  if (option.wheelchairAccessible) featurePills.push({ label: 'Wheelchair', type: 'wc' })
  if (option.skipTheLine && option.skipTheLine !== 'none') featurePills.push({ label: 'Skip line', type: 'skip' })
  if (option.audioGuide) featurePills.push({ label: 'Audio guide', type: 'audio' })
  if (option.infoBooklet) featurePills.push({ label: 'Booklet', type: 'booklet' })
  if (option.maxGroupSize) featurePills.push({ label: `Max ${option.maxGroupSize}`, type: 'group' })
  const langCount = option.languages?.length || 0

  return (
    <div
      draggable
      onDragStart={dragHandlers.onStart}
      onDragOver={dragHandlers.onOver}
      onDrop={dragHandlers.onDrop}
      onDragEnd={dragHandlers.onEnd}
      className={`rounded-xl border-2 transition-all duration-200 ${
        isDragging ? 'border-emerald-400 bg-emerald-50/30 opacity-60 shadow-sm' :
        dragOver ? 'border-emerald-400 bg-emerald-50/30' :
        isExpanded ? 'border-slate-300 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        <span
          className="shrink-0 text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </span>

        <div className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center text-xs font-bold ${
          isExpanded ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
        }`}>
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="flex-1 min-w-0 ml-1">
          <span className={`text-sm font-medium truncate block ${
            option.title ? 'text-slate-800' : 'text-slate-400 italic'
          }`}>
            {option.title || 'Untitled'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {langCount > 0 && (
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full leading-none">
              {langCount} {langCount === 1 ? 'lang' : 'langs'}
            </span>
          )}
          {featurePills.map((p) => (
            <span key={p.type} className={`text-[11px] font-medium px-2 py-0.5 rounded-full leading-none ${
              p.type === 'private' ? 'bg-violet-100 text-violet-600' :
              p.type === 'wc' ? 'bg-blue-100 text-blue-600' :
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

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); duplicateOption(index) }}
          className="shrink-0 w-7 h-7 rounded-lg grid place-items-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all bg-transparent border-0 cursor-pointer"
          title="Duplicate"
        >
          <Copy size={14} />
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); removeOption(index) }}
          className="shrink-0 w-7 h-7 rounded-lg grid place-items-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all bg-transparent border-0 cursor-pointer"
          title="Remove"
        >
          <Trash2 size={14} />
        </button>

        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 border-t border-slate-100 space-y-5">
              <div>
                <SectionHeader icon={List} label="Basic information" />
                <div className="space-y-3">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 mb-1">Title</label>
                    <input
                      className="w-full min-h-[42px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm transition-all focus-ring"
                      type="text"
                      value={option.title}
                      onChange={(e) => updateOption(index, { title: e.target.value })}
                      placeholder="e.g. 2-Hour Morning Tour"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Required when multiple options exist. Use consistent naming so customers can easily compare.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[13px] font-medium text-slate-600 mb-1">
                        Reference code <span className="text-slate-400 font-normal">(internal)</span>
                      </label>
                      <input
                        className="w-full min-h-[38px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm transition-all focus-ring"
                        type="text"
                        value={option.refCode ?? ''}
                        onChange={(e) => updateOption(index, { refCode: e.target.value })}
                        placeholder="Optional"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        An internal code to help you identify this option in reports.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 mb-1">
                      Description <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm transition-all focus-ring resize-none"
                      rows={2}
                      value={option.description ?? ''}
                      onChange={(e) => updateOption(index, { description: e.target.value })}
                      placeholder="Only needed when the title alone cannot explain the difference"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Option descriptions are hidden unless the title alone cannot explain the difference between options.
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <SectionHeader icon={Shield} label="Group & privacy" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 mb-1.5">
                      Is this a private activity?
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Private means only one group or person can book this option per time slot.
                    </p>
                    <ToggleSwitch
                      checked={option.isPrivate}
                      onChange={(v) => updateOption(index, { isPrivate: v })}
                      label="Private activity"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 mb-1.5">
                      Max group size
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Set the maximum number of people allowed per booking. Leave as &quot;No limit&quot; if there&apos;s no restriction.
                    </p>
                    <div className="flex items-center gap-3">
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
                            <span className="text-[13px] text-slate-500">people</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <SectionHeader icon={SlidersHorizontal} label="Activity setup" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 mb-1.5">
                      What languages is the activity offered in?
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Select the languages available for this option. Start typing to search.
                    </p>
                    <LanguageInput
                      languages={option.languages}
                      onAdd={(lang) => updateOption(index, { languages: [...option.languages, lang] })}
                      onRemove={(idx) => updateOption(index, { languages: option.languages.filter((_, li) => li !== idx) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 mb-2">
                      Guide materials
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Select any supplementary materials provided to customers during the experience.
                    </p>
                    <div className="flex flex-col gap-2">
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
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <SectionHeader icon={Clock} label="Duration & availability" />
                <DurationValidityBlock option={option} index={index} updateOption={updateOption} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Step11Options() {
  const options = useProductBuilderStore((s) => s.options)
  const addOption = useProductBuilderStore((s) => s.addOption)
  const updateOption = useProductBuilderStore((s) => s.updateOption)
  const removeOption = useProductBuilderStore((s) => s.removeOption)
  const reorderOption = useProductBuilderStore((s) => s.reorderOption)
  const duplicateOption = useProductBuilderStore((s) => s.duplicateOption)
  const errors = useStepErrors(11)

  const [expandedIds, setExpandedIds] = useState(new Set())
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const count = options.length
  const nearLimit = count >= 6 && count < MAX_OPTIONS
  const atLimit = count >= MAX_OPTIONS

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setExpandedIds(new Set(options.map((o) => o.id)))
  }

  function collapseAll() {
    setExpandedIds(new Set())
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
    reorderOption(dragIdx, index)
    setDragIdx(null)
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    setDragIdx(null)
    setDragOverIdx(null)
  }

  const allExpanded = options.length > 0 && expandedIds.size === options.length
  const someExpanded = expandedIds.size > 0

  return (
    <div className="max-w-[720px]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Product options</h3>
          {count > 0 && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              atLimit ? 'bg-red-100 text-red-600' :
              nearLimit ? 'bg-amber-100 text-amber-600' :
              'bg-slate-100 text-slate-500'
            }`}>
              {count}/{MAX_OPTIONS}
            </span>
          )}
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-transparent border-0 cursor-pointer transition-colors"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        )}
      </div>

      <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
        Options are different versions of the same product — for example, a 2-Hour Tour vs a 4-Hour Tour, or a Private vs Shared experience.
        Each option can have its own duration, group size, languages, and pricing. You need at least one option for your product to be bookable.
      </p>

      {nearLimit && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-[13px] font-medium text-amber-700">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="7" stroke="#D97706" strokeWidth="1.5" />
            <path d="M8 5V9M8 11V11.01" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          You&apos;re approaching the recommended limit of {MAX_OPTIONS} options. Consider using add-ons for smaller variations.
        </div>
      )}

      {atLimit && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-[13px] font-medium text-red-700">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5" />
            <path d="M8 5V9M8 11V11.01" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Maximum {MAX_OPTIONS} options reached. Remove an option or create a separate product for additional variations.
        </div>
      )}

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
            Options let customers choose between different versions of your experience —
            such as tour length, private vs shared, or different meeting points.
            You need at least one option to make your product bookable.
          </p>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors border-0 cursor-pointer"
          >
            <Plus size={16} />
            Create your first option
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {count > 1 && !someExpanded && (
            <p className="text-[12px] text-slate-400 text-center">
              Cards are collapsed for easier scanning. Click a card to edit its details.
            </p>
          )}

          <div className="space-y-2">
            {options.map((opt, i) => (
              <OptionCardCollapsible
                key={opt.id}
                option={opt}
                index={i}
                isExpanded={expandedIds.has(opt.id)}
                onToggle={() => toggleExpanded(opt.id)}
                updateOption={updateOption}
                removeOption={removeOption}
                duplicateOption={duplicateOption}
                dragHandlers={{
                  onStart: () => handleDragStart(i),
                  onOver: (e) => handleDragOver(e, i),
                  onDrop: () => handleDrop(i),
                  onEnd: handleDragEnd,
                }}
                isDragging={dragIdx === i}
                dragOver={dragOverIdx === i && dragIdx !== i}
              />
            ))}
          </div>

          {!atLimit && (
            <button
              type="button"
              onClick={addOption}
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
