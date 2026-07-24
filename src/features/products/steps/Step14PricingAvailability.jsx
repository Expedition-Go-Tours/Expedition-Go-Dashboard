import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { HelpCircle, Info, Plus, X, ChevronDown, ChevronUp, Check, Copy } from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { safeId } from '@/lib/utils'

const CATEGORY_TEMPLATES = [
  { name: 'Child', minAge: 0, maxAge: 17 },
  { name: 'Adult', minAge: 18, maxAge: 99 },
  { name: 'Senior', minAge: 60, maxAge: 99 },
  { name: 'Student', minAge: 18, maxAge: 25, idRequired: true },
  { name: 'EU', minAge: 18, maxAge: 99, idRequired: true },
  { name: 'Military', minAge: 18, maxAge: 99, idRequired: true },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

const WIZARD_STEPS = ['Schedule', 'Pricing Categories', 'Capacity', 'Price', 'Add-ons (optional)']

function TimeSelect({ value, onChange }) {
  const [hour, minute] = (value || '08:00').split(':')
  return (
    <div className="flex items-center gap-0.5">
      <Select value={hour} onValueChange={(h) => onChange(`${h}:${minute}`)}>
        <SelectTrigger className="h-9 w-14 px-1.5 text-sm border-slate-200 rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
        </SelectContent>
      </Select>
      <span className="text-slate-400">:</span>
      <Select value={minute} onValueChange={(m) => onChange(`${hour}:${m}`)}>
        <SelectTrigger className="h-9 w-14 px-1.5 text-sm border-slate-200 rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function WizardStepper({ currentStep }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {WIZARD_STEPS.map((step, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isCompleted ? 'bg-emerald-600 text-white' : isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap ${
                isActive ? 'text-emerald-600 underline underline-offset-4' : isCompleted ? 'text-slate-700' : 'text-slate-400'
              }`}>
                {step}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`w-8 h-px mx-3 ${isCompleted ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ScheduleStep() {
  const {
    scheduleName, scheduleStartDate, scheduleHasEndDate, scheduleEndDate,
    weeklySchedule, dateExceptions,
    setField, addWeeklyHours, updateWeeklyHours, removeWeeklyHours,
    copyDayToRemaining, removeAllWeeklyHours,
    addDateException, updateDateException, removeDateException,
  } = useProductBuilderStore()

  const hasAnyHours = Object.values(weeklySchedule).some((hours) => hours.length > 0)
  const firstDayWithHours = DAYS.find((d) => weeklySchedule[d]?.length > 0)

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">Name your schedule</label>
        <input
          type="text"
          value={scheduleName}
          onChange={(e) => setField('scheduleName', e.target.value)}
          data-field="scheduleName"
          placeholder="E.g. Summer, Weekends price..."
          className="w-full h-11 rounded-lg border border-slate-200 px-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">What's the starting date of your activity?</label>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={scheduleStartDate}
            onChange={(e) => setField('scheduleStartDate', e.target.value)}
            data-field="scheduleStartDate"
            className="h-11 rounded-lg border border-slate-200 px-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {scheduleHasEndDate && (
            <>
              <span className="text-sm text-slate-500">to</span>
              <input
                type="date"
                value={scheduleEndDate}
                onChange={(e) => setField('scheduleEndDate', e.target.value)}
                data-field="scheduleEndDate"
                className="h-11 rounded-lg border border-slate-200 px-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </>
          )}
        </div>
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={scheduleHasEndDate}
            onChange={(e) => setField('scheduleHasEndDate', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700">My activity has an end date</span>
        </label>
        {scheduleHasEndDate && !scheduleEndDate && (
          <p className="text-xs text-red-500 mt-1">No end date</p>
        )}
      </div>

      {/* Standard weekly schedule */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Standard weekly schedule</h3>
          {hasAnyHours && (
            <div className="flex items-center gap-3">
              {firstDayWithHours && (
                <button
                  type="button"
                  onClick={() => copyDayToRemaining(firstDayWithHours)}
                  className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy to remaining days
                </button>
              )}
              <button
                type="button"
                onClick={removeAllWeeklyHours}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Remove all
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          {DAYS.map((day) => (
            <div key={day}>
              <div className="flex items-center justify-between py-3">
                <h4 className="text-sm font-bold text-slate-900">{day}</h4>
                <div className="flex items-center gap-3">
                  {(weeklySchedule[day] || []).map((hours, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <TimeSelect
                        value={hours.startTime}
                        onChange={(v) => updateWeeklyHours(day, i, { startTime: v })}
                      />
                      <span className="text-slate-400">-</span>
                      <TimeSelect
                        value={hours.endTime}
                        onChange={(v) => updateWeeklyHours(day, i, { endTime: v })}
                      />
                      <button
                        type="button"
                        onClick={() => removeWeeklyHours(day, i)}
                        className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addWeeklyHours(day)}
                    className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add opening hours
                  </button>
                </div>
              </div>
              <hr className="border-slate-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Exceptions */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Exceptions <span className="font-normal text-slate-500">(Optional)</span>
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Do you have alternative operating hours?</p>
          <p className="text-sm text-slate-500">Use this if you want different operating hours on a special day, like Easter or Christmas</p>
        </div>

        <div className="space-y-4">
          {dateExceptions.map((exception, i) => (
            <div key={exception.id || i} className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={exception.date}
                  onChange={(e) => updateDateException(i, { date: e.target.value })}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => removeDateException(i)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(exception.overrideTimes || []).map((t, j) => (
                <div key={j} className="flex items-center gap-2 ml-4">
                  <TimeSelect value={t.startTime} onChange={() => {}} />
                  <span>-</span>
                  <TimeSelect value={t.endTime} onChange={() => {}} />
                </div>
              ))}
              <button
                type="button"
                onClick={() => addWeeklyHours('Monday')}
                className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Add opening hours
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addDateException}
            className="px-4 py-2 border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
          >
            Add date
          </button>
        </div>
      </div>
    </div>
  )
}

function PricingCategoriesStep() {
  const {
    pricingApproach, pricingCategories, showAdvancedCategorySettings,
    setField, addPricingCategory, updatePricingCategory, removePricingCategory,
  } = useProductBuilderStore()
  const [showPicker, setShowPicker] = useState(false)
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')
  const pickerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (customMode) inputRef.current?.focus()
  }, [customMode])

  useEffect(() => {
    if (!showPicker) return
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPicker])

  const handleSelectTemplate = (t) => {
    addPricingCategory({ name: t.name, price: null, minAge: t.minAge, maxAge: t.maxAge, notAllowed: false, ticketNotRequired: false, needsAdult: false, idRequired: t.idRequired || false, idType: '' })
    setShowPicker(false)
  }

  const handleAddCustom = () => {
    if (customName.trim()) {
      addPricingCategory({ name: customName.trim(), price: null, minAge: 1, maxAge: 99, notAllowed: false, ticketNotRequired: false, needsAdult: false, idRequired: false, idType: '' })
      setCustomName('')
      setCustomMode(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-3">Tell us more about your prices:</label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pricingApproach"
              checked={pricingApproach === 'sameForEveryone'}
              onChange={() => setField('pricingApproach', 'sameForEveryone')}
              data-field="pricingApproach"
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">The price is the same for everyone, eg: per participant</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pricingApproach"
              checked={pricingApproach === 'dependsOnAge'}
              onChange={() => setField('pricingApproach', 'dependsOnAge')}
              data-field="pricingApproach"
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700">Price depends on category, e.g. child, senior, military etc</span>
          </label>
        </div>

        {pricingApproach === 'sameForEveryone' && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600">
                Offering multiple participant types can boost bookings by up to 3x compared with activities with only one participant type.
              </p>
            </div>
          </div>
        )}
      </div>

      {pricingApproach === 'dependsOnAge' && (
        <div data-field="pricingCategories">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-900">Pricing categories:</label>
            <button
              type="button"
              onClick={() => setField('showAdvancedCategorySettings', !showAdvancedCategorySettings)}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              {showAdvancedCategorySettings ? 'Hide advanced settings' : 'Show advanced settings'}
              <div className={`w-10 h-5 rounded-full transition-colors ${showAdvancedCategorySettings ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${showAdvancedCategorySettings ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          <div className="space-y-3">
            {pricingCategories.map((cat, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-900 min-w-[80px]">{cat.name || 'Category'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Age range</span>
                        <span className="text-sm text-slate-700">{cat.minAge} to</span>
                        <Select value={String(cat.maxAge)} onValueChange={(v) => updatePricingCategory(i, { maxAge: parseInt(v) })}>
                          <SelectTrigger className="h-9 w-16 px-2 text-sm border-slate-200 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 100 }, (_, n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {showAdvancedCategorySettings && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        <h4 className="text-sm font-bold text-slate-900">Advanced settings</h4>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Is this category permitted?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={!cat.notAllowed} onChange={() => updatePricingCategory(i, { notAllowed: false })} className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-slate-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={cat.notAllowed} onChange={() => updatePricingCategory(i, { notAllowed: true })} className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-slate-700">No</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Is this category free of charge?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={cat.ticketNotRequired} onChange={() => updatePricingCategory(i, { ticketNotRequired: true })} className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-slate-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={!cat.ticketNotRequired} onChange={() => updatePricingCategory(i, { ticketNotRequired: false })} className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-slate-700">No</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Must be accompanied?</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={cat.needsAdult} onChange={() => updatePricingCategory(i, { needsAdult: true })} className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-slate-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={!cat.needsAdult} onChange={() => updatePricingCategory(i, { needsAdult: false })} className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-slate-700">No</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePricingCategory(i)}
                    className="text-sm text-red-500 hover:text-red-600 font-medium ml-4"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => { setShowPicker(!showPicker); setCustomMode(false) }}
              className="flex items-center gap-1.5 mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add pricing category
            </button>

            {showPicker && (
              <div className="absolute z-20 top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-600">Choose a category</span>
                </div>
                {CATEGORY_TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleSelectTemplate(t)}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 transition-colors flex items-center justify-between border-0 bg-transparent cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      {t.name}
                      {t.idRequired && (
                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">ID required</span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">{t.minAge}-{t.maxAge}</span>
                  </button>
                ))}
                <div className="border-t border-slate-100">
                  {customMode ? (
                    <div className="p-2 flex items-center gap-1.5 bg-white">
                      <input
                        ref={inputRef}
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom() }}
                        placeholder="Category name"
                        className="flex-1 h-8 rounded-lg border border-slate-200 px-2.5 text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustom}
                        disabled={!customName.trim()}
                        className="px-2.5 h-8 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setCustomMode(true); setCustomName('') }}
                      className="w-full text-left px-3.5 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors font-medium border-0 bg-transparent cursor-pointer"
                    >
                      + Custom category
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CapacityStep() {
  const { minParticipants, maxParticipants, setField } = useProductBuilderStore()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-2">Now, let's look at your capacity</h3>
        <p className="text-sm text-slate-600 mb-6">How many participants (who book on GetYourGuide) can you take per time slot?</p>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-700 min-w-[140px] flex items-center gap-1.5">
              Minimum number
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              type="number"
              value={minParticipants}
              onChange={(e) => setField('minParticipants', parseInt(e.target.value) || 1)}
              min={1}
              data-field="minParticipants"
              className="h-11 w-32 rounded-lg border border-slate-200 px-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-700 min-w-[140px]">Maximum number</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setField('maxParticipants', parseInt(e.target.value) || 1)}
              min={1}
              data-field="maxParticipants"
              className="h-11 w-32 rounded-lg border border-slate-200 px-3.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceStep() {
  const {
    pricingModel, pricingApproach, currency, pricingCategories, uniformPrice,
    minParticipants, maxParticipants,
    setField, addCategoryTier, updateCategoryTier, removeCategoryTier,
  } = useProductBuilderStore()

  const commission = 0.30

  const isSameForEveryone = pricingApproach === 'sameForEveryone'
  const categories = isSameForEveryone
    ? [{ name: 'Participant', minAge: 0, maxAge: 99, tiers: [] }]
    : pricingCategories

  function getCatPrice(cat) {
    return isSameForEveryone ? uniformPrice : (cat.price ?? '')
  }

  function handlePriceChange(i, value) {
    const num = parseFloat(value) || 0
    if (isSameForEveryone) {
      setField('uniformPrice', num)
    } else {
      const updated = [...pricingCategories]
      updated[i] = { ...updated[i], price: num }
      setField('pricingCategories', updated)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Set the price for your activity</h3>
        <p className="text-sm text-slate-500">
          Include all taxes in what the customer pays for your activity.{' '}
          <a href="#" className="text-emerald-600 underline">Learn more</a>.
        </p>
      </div>

      {categories.map((cat, i) => {
        const catPrice = getCatPrice(cat)
        const computed = catPrice ? (parseFloat(catPrice) * (1 - commission)).toFixed(2) : ''

        return (
          <div key={i} className="p-4 rounded-lg border border-slate-200 bg-white">
            <h4 className="text-sm font-bold text-slate-900 mb-3">{cat.name}</h4>
            <div className="grid grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Number of people</label>
                <div className="flex items-center gap-1 text-sm text-slate-700">
                  <span>{minParticipants} to</span>
                  <span>{maxParticipants}</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Customer pays</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={catPrice}
                    onChange={(e) => handlePriceChange(i, e.target.value)}
                    placeholder="USD"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Commission</label>
                <div className="h-11 rounded-lg bg-slate-100 flex items-center px-3 text-sm text-slate-500">
                  30%
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Price per participant</label>
                <div className="h-11 rounded-lg bg-slate-100 flex items-center px-3 text-sm text-slate-700 font-medium">
                  {computed ? `${computed} USD` : ''}
                </div>
              </div>
            </div>

            {(cat.tiers || []).map((tier, j) => (
              <div key={tier.id || j} className="flex items-end gap-3 p-3 mt-3 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">From</label>
                  <input
                    type="number"
                    value={tier.from ?? ''}
                    onChange={(e) => updateCategoryTier(i, j, { from: e.target.value ? parseInt(e.target.value) : null })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">To</label>
                  <input
                    type="number"
                    value={tier.to ?? ''}
                    onChange={(e) => updateCategoryTier(i, j, { to: e.target.value ? parseInt(e.target.value) : null })}
                    className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Price per person</label>
                  <input
                    type="number"
                    value={tier.pricePerPerson ?? ''}
                    onChange={(e) => updateCategoryTier(i, j, { pricePerPerson: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="USD"
                    className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Commission</label>
                  <div className="h-9 rounded-lg bg-slate-100 flex items-center px-2.5 text-sm text-slate-500">30%</div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">You receive</label>
                  <div className="h-9 rounded-lg bg-slate-100 flex items-center px-2.5 text-sm text-slate-700">
                    {tier.pricePerPerson ? `${(tier.pricePerPerson * 0.7).toFixed(2)} USD` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCategoryTier(i, j)}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium mb-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addCategoryTier(i)}
              className="flex items-center gap-1.5 mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Tier price
            </button>
          </div>
        )
      })}
    </div>
  )
}

function AddonsStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-2">Add-ons (optional)</h3>
        <p className="text-sm text-slate-500">
          Add optional extras that customers can book alongside your activity.
        </p>
      </div>
      <div className="p-6 rounded-lg border border-dashed border-slate-200 text-center">
        <p className="text-sm text-slate-400">No add-ons configured yet.</p>
      </div>
    </div>
  )
}

function ScheduleWizard({ onBack }) {
  const { currentScheduleStep, setField, saveSchedule, resetScheduleForm } = useProductBuilderStore()
  const [direction, setDirection] = useState(1)

  const handleNext = () => {
    setDirection(1)
    if (currentScheduleStep < 5) {
      setField('currentScheduleStep', currentScheduleStep + 1)
    } else {
      saveSchedule()
      onBack()
    }
  }

  const handleBack = () => {
    setDirection(-1)
    if (currentScheduleStep > 1) {
      setField('currentScheduleStep', currentScheduleStep - 1)
    } else {
      resetScheduleForm()
      onBack()
    }
  }

  const variants = {
    initial: (d) => ({ opacity: 0, x: d * 24 }),
    animate: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d * -24 }),
  }

  return (
    <div>
      <WizardStepper currentStep={currentScheduleStep} />

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentScheduleStep}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {currentScheduleStep === 1 && <ScheduleStep />}
            {currentScheduleStep === 2 && <PricingCategoriesStep />}
            {currentScheduleStep === 3 && <CapacityStep />}
            {currentScheduleStep === 4 && <PriceStep />}
            {currentScheduleStep === 5 && <AddonsStep />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={handleBack}
          className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          {currentScheduleStep === 5 ? 'Save and continue' : 'Save and continue'}
        </button>
      </div>
    </div>
  )
}

function ScheduleCard({ schedule, index, onEdit }) {
  const { removeSchedule } = useProductBuilderStore()
  const [expanded, setExpanded] = useState(false)

  const dateRange = schedule.startDate
    ? `${new Date(schedule.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${
        schedule.hasEndDate && schedule.endDate
          ? ` - ${new Date(schedule.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : ' - No end date'
      }`
    : 'No dates set'

  const activeDays = Object.entries(schedule.weeklySchedule || {})
    .filter(([, hours]) => hours.length > 0)
    .map(([day]) => day.slice(0, 3))

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">{schedule.name || 'Untitled Schedule'}</h4>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">Date range:</span>
                <span className="text-xs text-slate-700">{dateRange}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">Participants:</span>
                <span className="text-xs text-slate-700">{schedule.minParticipants} - {schedule.maxParticipants}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-20">Pricing:</span>
                <span className="text-xs text-slate-700">
                  {schedule.pricingApproach === 'sameForEveryone'
                    ? `$${schedule.uniformPrice || 0} per Person`
                    : `${schedule.pricingCategories?.length || 0} categories`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(index)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="flex justify-end px-4 pb-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {expanded ? 'Hide schedule' : 'Show schedule'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          <div className="space-y-3">
            {DAYS.map((day) => {
              const hours = schedule.weeklySchedule?.[day] || []
              return (
                <div key={day}>
                  <p className="text-sm font-semibold text-slate-800">{day}</p>
                  {hours.length > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      {hours.map((h, hi) => (
                        <p key={hi} className="text-sm text-slate-600">{h.startTime} - {h.endTime}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 mt-1">Closed</p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => removeSchedule(index)}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Step14PricingAvailability() {
  const {
    scheduleType, pricingModel, currency, schedules,
    setField, resetScheduleForm,
  } = useProductBuilderStore()
  const [showWizard, setShowWizard] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)

  const handleAddSchedule = () => {
    resetScheduleForm()
    setEditingIndex(null)
    setShowWizard(true)
  }

  const handleEditSchedule = (index) => {
    const { editSchedule } = useProductBuilderStore.getState()
    editSchedule(index)
    setEditingIndex(index)
    setShowWizard(true)
  }

  const handleWizardBack = () => {
    setShowWizard(false)
    setEditingIndex(null)
  }

  return (
    <AnimatePresence mode="wait">
      {showWizard ? (
        <motion.div
          key="wizard"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="max-w-[720px]"
        >
          <button
            type="button"
            onClick={handleWizardBack}
            className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-6"
          >
            &larr; Back to Availability & Pricing
          </button>
          <ScheduleWizard onBack={handleWizardBack} />
        </motion.div>
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="max-w-[720px] space-y-6"
        >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <h2 className="text-lg font-bold text-slate-900">Availability & Pricing</h2>
          <HelpCircle className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">This will apply to all the schedules added to this option.</p>
      </div>

      {/* Availability type */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-3">How do you set your availability?</label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              checked={scheduleType === 'fixedTimeSlot'}
              onChange={() => setField('scheduleType', 'fixedTimeSlot')}
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Time slots</span>
              <p className="text-xs text-slate-500 mt-0.5">Example: walking tour starting at 9:00 AM, 11:00 AM, and 2:00 PM</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              checked={scheduleType === 'operatingHours'}
              onChange={() => setField('scheduleType', 'operatingHours')}
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Opening hours</span>
              <p className="text-xs text-slate-500 mt-0.5">Example: museum open from Mon to Sat, between 9:00 AM and 7:00 PM</p>
            </div>
          </label>
        </div>
      </div>

      {/* Pricing model */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-3">How do you set your prices?</label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pricingModel"
              checked={pricingModel === 'perPerson'}
              onChange={() => setField('pricingModel', 'perPerson')}
              data-field="pricingModel"
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Price per person</span>
              <p className="text-xs text-slate-500 mt-0.5">Set different prices for adults, youth, child, etc.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="pricingModel"
              checked={pricingModel === 'perGroup'}
              onChange={() => setField('pricingModel', 'perGroup')}
              data-field="pricingModel"
              className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">Price per group/vehicle</span>
              <p className="text-xs text-slate-500 mt-0.5">Set different prices based on group size, vehicle type, etc.</p>
            </div>
          </label>
        </div>
      </div>

      {/* Saved schedules */}
      {schedules.length > 0 && (
        <div className="space-y-3">
          {schedules.map((schedule, i) => (
            <ScheduleCard
              key={i}
              schedule={schedule}
              index={i}
              onEdit={handleEditSchedule}
            />
          ))}
        </div>
      )}

      {/* Add schedule button */}
      <button
        type="button"
        onClick={handleAddSchedule}
        className="px-5 py-2.5 border-2 border-emerald-600 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors"
      >
        Add schedule
      </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
