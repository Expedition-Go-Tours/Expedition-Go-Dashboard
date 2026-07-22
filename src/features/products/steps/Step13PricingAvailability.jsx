import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, DollarSign, Users, Tag, ChevronDown } from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'
import { cn, safeId } from '@/lib/utils'

const PRICING_MODELS = [
  { value: 'perPerson', label: 'Price per person', icon: Users },
  { value: 'perGroup', label: 'Price per group/vehicle', icon: Tag },
]

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'GHS', 'NGN', 'ZAR', 'KES', 'TZS',
  'RWF', 'UGX', 'MAD', 'EGP', 'AED', 'SAR', 'TRY', 'INR',
  'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'SEK', 'NOK', 'DKK',
  'BRL', 'MXN', 'THB', 'VND', 'IDR', 'MYR', 'PHP', 'KRW',
]

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', GHS: '₵', NGN: '₦', ZAR: 'R',
  KES: 'KSh', TZS: 'TSh', RWF: 'FRw', UGX: 'USh', MAD: 'MAD',
  EGP: 'E£', AED: 'د.إ', SAR: '﷼', TRY: '₺', INR: '₹',
  JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'CHF',
  SEK: 'kr', NOK: 'kr', DKK: 'kr', BRL: 'R$', MXN: 'MX$',
  THB: '฿', VND: '₫', IDR: 'Rp', MYR: 'RM', PHP: '₱', KRW: '₩',
}

const PRICING_CATEGORY_PRESETS = ['Adult', 'Child', 'Youth', 'Infant', 'Senior', 'Student', 'EU Citizen', 'Military']

const ID_TYPE_OPTIONS = {
  Student: ['Student ID', 'University ID', 'School ID'],
  'EU Citizen': ['EU Passport', 'EU ID card', 'National ID card'],
  Military: ['Military ID', 'Veteran ID', 'Military ID / Veteran card'],
}

function isAdultCategory(name) {
  return ['Adult', 'Senior', 'Student', 'EU Citizen', 'Military'].includes(name)
}

function isIdSupportedCategory(name) {
  return ['Student', 'EU Citizen', 'Military'].includes(name)
}

function SectionCard({ icon: Icon, title, subtitle, children, className }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-0.5 h-5 bg-linear-to-b from-emerald-500 to-emerald-300 rounded-full shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {Icon && <Icon size={14} className="text-slate-500 shrink-0" />}
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            </div>
            {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function RadioToggle({ name, options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap" role="radiogroup">
      {options.map((opt) => {
        const Icon = opt.icon
        const selected = value === opt.value
        return (
          <label
            key={opt.value}
            className={cn(
              'relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border-2 cursor-pointer transition-all duration-200',
              selected
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {Icon && <Icon size={16} className={selected ? 'text-emerald-600' : 'text-slate-400'} />}
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}

function SegmentedControl({ name, options, value, onChange }) {
  return (
    <div className="inline-flex bg-slate-200 p-0.5 rounded-xl" role="radiogroup">
      {options.map((opt) => {
        const Icon = opt.icon
        const selected = value === opt.value
        return (
          <label
            key={opt.value}
            className={cn(
              'relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-sm font-medium cursor-pointer transition-all duration-200 select-none',
              selected
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {Icon && <Icon size={14} className={selected ? 'text-emerald-600' : 'text-slate-400'} />}
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}

function AnimatedContent({ show, children }) {
  return show ? (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {children}
    </motion.div>
  ) : null
}

function AgeCoverageBar({ ageGroups }) {
  if (!ageGroups || ageGroups.length === 0) return null
  const sorted = [...ageGroups]
    .filter((g) => !g.notAllowed)
    .sort((a, b) => a.minAge - b.maxAge)

  const coverage = Array.from({ length: 100 }, (_, i) => {
    const group = sorted.find((g) => i >= g.minAge && i <= g.maxAge)
    return group ? group.name : null
  })

  const gaps = []
  let gapStart = null
  for (let i = 0; i < 100; i++) {
    if (!coverage[i] && gapStart === null) gapStart = i
    if (coverage[i] && gapStart !== null) {
      gaps.push({ from: gapStart, to: i - 1 })
      gapStart = null
    }
  }
  if (gapStart !== null) gaps.push({ from: gapStart, to: 99 })

  if (gaps.length === 0) return null

  const segments = []
  let prev = 0
  for (const gap of gaps) {
    if (gap.from > prev) {
      segments.push({ from: prev, to: gap.from - 1, covered: true })
    }
    segments.push({ from: gap.from, to: gap.to, covered: false })
    prev = gap.to + 1
  }
  if (prev < 100) segments.push({ from: prev, to: 99, covered: true })

  return (
    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
      <p className="text-[12px] font-medium text-amber-700 mb-2">
        The full age range (0–99) must be covered.
        {gaps.map((g, i) => (
          <span key={i}> Missing: {g.from}–{g.to}.</span>
        ))}
      </p>
      <div className="flex h-3 rounded-full overflow-hidden bg-amber-200/50">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn(
              'h-full transition-all duration-300',
              seg.covered ? 'bg-emerald-400' : 'bg-amber-300',
            )}
            style={{ width: `${((seg.to - seg.from + 1) / 100) * 100}%` }}
            title={seg.covered ? `Covered: ${seg.from}–${seg.to}` : `Gap: ${seg.from}–${seg.to}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-amber-600 mt-1">
        <span>0</span>
        <span>99</span>
      </div>
    </div>
  )
}

export default function Step13PricingAvailability() {
  const pricingModel = useProductBuilderStore((s) => s.pricingModel)
  const currency = useProductBuilderStore((s) => s.currency)
  const sym = CURRENCY_SYMBOLS[currency] || currency || '$'
  const scheduleType = useProductBuilderStore((s) => s.scheduleType)
  const scheduleName = useProductBuilderStore((s) => s.scheduleName)
  const scheduleStartDate = useProductBuilderStore((s) => s.scheduleStartDate)
  const scheduleHasEndDate = useProductBuilderStore((s) => s.scheduleHasEndDate)
  const scheduleEndDate = useProductBuilderStore((s) => s.scheduleEndDate)
  const timeSlots = useProductBuilderStore((s) => s.timeSlots)
  const operatingHoursStart = useProductBuilderStore((s) => s.operatingHoursStart)
  const operatingHoursEnd = useProductBuilderStore((s) => s.operatingHoursEnd)
  const dateExceptions = useProductBuilderStore((s) => s.dateExceptions)
  const pricingApproach = useProductBuilderStore((s) => s.pricingApproach)
  const uniformPrice = useProductBuilderStore((s) => s.uniformPrice)
  const pricingCategories = useProductBuilderStore((s) => s.pricingCategories)
  const minParticipants = useProductBuilderStore((s) => s.minParticipants)
  const maxParticipants = useProductBuilderStore((s) => s.maxParticipants)
  const pricingTiers = useProductBuilderStore((s) => s.pricingTiers)
  const groupSizes = useProductBuilderStore((s) => s.groupSizes)
  const additionalPersonsEnabled = useProductBuilderStore((s) => s.additionalPersonsEnabled)
  const additionalPersonPrice = useProductBuilderStore((s) => s.additionalPersonPrice)
  const maxGroupsPerTimeSlot = useProductBuilderStore((s) => s.maxGroupsPerTimeSlot)

  const setField = useProductBuilderStore((s) => s.setField)
  const addPricingCategory = useProductBuilderStore((s) => s.addPricingCategory)
  const updatePricingCategory = useProductBuilderStore((s) => s.updatePricingCategory)
  const removePricingCategory = useProductBuilderStore((s) => s.removePricingCategory)
  const addPricingTier = useProductBuilderStore((s) => s.addPricingTier)
  const updatePricingTier = useProductBuilderStore((s) => s.updatePricingTier)
  const removePricingTier = useProductBuilderStore((s) => s.removePricingTier)
  const addGroupSize = useProductBuilderStore((s) => s.addGroupSize)
  const updateGroupSize = useProductBuilderStore((s) => s.updateGroupSize)
  const removeGroupSize = useProductBuilderStore((s) => s.removeGroupSize)
  const addDateException = useProductBuilderStore((s) => s.addDateException)
  const updateDateException = useProductBuilderStore((s) => s.updateDateException)
  const removeDateException = useProductBuilderStore((s) => s.removeDateException)

  const errors = useStepErrors(13)
  const slotInputRef = useRef(null)

  function addTimeSlot() {
    setField('timeSlots', [
      ...timeSlots,
      { id: safeId(), startTime: '09:00', cutoff: 60 },
    ])
  }

  function updateTimeSlot(index, updates) {
    setField('timeSlots', timeSlots.map((slot, i) =>
      i === index ? { ...slot, ...updates } : slot,
    ))
  }

  function removeTimeSlot(index) {
    setField('timeSlots', timeSlots.filter((_, i) => i !== index))
  }

  function getError(path) {
    return errors[path] ? (
      <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">
        {errors[path][0]}
      </span>
    ) : null
  }

  const cutoffOptions = [
    { value: 0, label: 'No cut-off' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hr' },
    { value: 120, label: '2 hr' },
    { value: 240, label: '4 hr' },
    { value: 480, label: '8 hr' },
  ]

  return (
    <div className="max-w-[720px] space-y-6">
      {/* 1. Schedule — merged */}
      <SectionCard icon={Calendar} title="How you run your activity" subtitle="Choose how customers book time with your experience and set your schedule.">
        <div className="space-y-5">
          <RadioToggle
            name="scheduleType"
            options={[
              { value: 'fixedTimeSlot', label: 'Fixed time slot' },
              { value: 'operatingHours', label: 'Operating hours' },
            ]}
            value={scheduleType}
            onChange={(v) => {
              console.log('[Step13] Schedule type →', v)
              setField('scheduleType', v)
            }}
          />
          <div className="border-t border-slate-100 pt-5">
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Schedule name</label>
            <input
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
              type="text"
              value={scheduleName}
              onChange={(e) => setField('scheduleName', e.target.value)}
              placeholder="e.g. Default, 2026 Summer"
            />
            {getError('scheduleName')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Start date</label>
              <input
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                type="date"
                value={scheduleStartDate}
                onChange={(e) => setField('scheduleStartDate', e.target.value)}
              />
              {getError('scheduleStartDate')}
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduleHasEndDate}
              onChange={(e) => setField('scheduleHasEndDate', e.target.checked)}
              className="mt-0.5 w-[18px] h-[18px] cursor-pointer text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 shrink-0"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">My activity has an end date</span>
              <p className="text-[12px] text-slate-500 mt-0.5">Your activity will remain online and bookable up to 16 months in advance if no end date is set.</p>
            </div>
          </label>

          <AnimatedContent show={scheduleHasEndDate}>
            <div className="max-w-[200px]">
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">End date</label>
              <input
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                type="date"
                value={scheduleEndDate}
                onChange={(e) => setField('scheduleEndDate', e.target.value)}
              />
              {getError('scheduleEndDate')}
            </div>
          </AnimatedContent>

          {/* Time slots */}
          {scheduleType === 'fixedTimeSlot' && (
            <div className="pt-2">
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Time slots</label>
              <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">Fixed start times for your activity. Add all the starting times your activity is available.</p>
              {timeSlots.length > 0 && (
                <div className="space-y-2 mb-3">
                  {timeSlots.map((slot, i) => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="time"
                        className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[140px]"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(i, { startTime: e.target.value })}
                      />
                      <select
                        className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus-ring cursor-pointer"
                        value={slot.cutoff ?? 60}
                        onChange={(e) => updateTimeSlot(i, { cutoff: Number(e.target.value) })}
                      >
                        {cutoffOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(i)}
                        className="p-2.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  console.log('[Step13] Add time slot clicked')
                  addTimeSlot()
                }}
                className="px-4 py-2 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                + Add time slot
              </button>
              {getError('timeSlots')}
            </div>
          )}

          {/* Operating hours */}
          {scheduleType === 'operatingHours' && (
            <div className="pt-2">
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Operating hours</label>
              <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">Customers can arrive any time within these hours.</p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[150px]"
                  value={operatingHoursStart}
                  onChange={(e) => setField('operatingHoursStart', e.target.value)}
                />
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="time"
                  className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[150px]"
                  value={operatingHoursEnd}
                  onChange={(e) => setField('operatingHoursEnd', e.target.value)}
                />
              </div>
              {getError('operatingHoursStart')}
            </div>
          )}

          {/* Date Exceptions */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[13px] font-semibold text-slate-600">Date exceptions</p>
                <p className="text-[12px] text-slate-500 mt-0.5">Override time slots or close on specific dates.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  console.log('[Step13] Add date exception clicked')
                  addDateException()
                }}
                className="px-3 py-1.5 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors shrink-0"
              >
                + Add date
              </button>
            </div>
            {dateExceptions.length > 0 && (
              <div className="space-y-2">
                {dateExceptions.map((ex, i) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="date"
                        className="w-full min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring"
                        value={ex.date}
                        onChange={(e) => updateDateException(i, { date: e.target.value })}
                      />
                      <select
                        className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring cursor-pointer"
                        value={ex.type}
                        onChange={(e) => {
                          const type = e.target.value
                          updateDateException(i, {
                            type,
                            overrideTimes: type === 'closed' ? [] : (ex.overrideTimes?.length ? ex.overrideTimes : ['09:00']),
                          })
                        }}
                      >
                        <option value="closed">Closed</option>
                        <option value="override">Override times</option>
                      </select>
                      {ex.type === 'override' && (
                        <div className="space-y-1">
                          {(ex.overrideTimes || []).map((ot, ti) => (
                            <div key={ti} className="flex items-center gap-1.5">
                              <input
                                type="time"
                                className="flex-1 min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring"
                                value={ot}
                                onChange={(e) => {
                                  const times = [...(ex.overrideTimes || [])]
                                  times[ti] = e.target.value
                                  updateDateException(i, { overrideTimes: times })
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const times = (ex.overrideTimes || []).filter((_, ti2) => ti2 !== ti)
                                  updateDateException(i, { overrideTimes: times })
                                }}
                                className="text-slate-400 hover:text-red-500 text-xs p-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              updateDateException(i, {
                                overrideTimes: [...(ex.overrideTimes || []), '09:00'],
                              })
                            }
                            className="text-[13px] text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            + Add time
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDateException(i)}
                      className="shrink-0 mt-1 w-6 h-6 rounded-full bg-transparent text-slate-400 cursor-pointer grid place-items-center text-xs hover:text-red-500 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      </SectionCard>

      {/* 2. Pricing */}
      <SectionCard icon={DollarSign} title="Pricing" subtitle="Set your currency, pricing model, and pricing details.">
        {/* Currency */}
        <div className="mb-5">
          <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Currency</label>
          <div className="max-w-xs">
            <select
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring cursor-pointer"
              value={currency}
              onChange={(e) => setField('currency', e.target.value)}
            >
              <option value="">Select currency...</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c} ({CURRENCY_SYMBOLS[c] || c})
                </option>
              ))}
            </select>
            {getError('currency')}
          </div>
        </div>

        {/* Pricing model */}
        <div className="mb-5">
          <label className="block text-[13px] font-semibold mb-2 text-slate-600">Pricing model</label>
          <SegmentedControl
            name="pricingModel"
            options={PRICING_MODELS}
            value={pricingModel}
            onChange={(v) => {
              console.log('[Step13] Pricing model →', v)
              setField('pricingModel', v)
            }}
          />
          {getError('pricingModel')}
        </div>

        {/* Per Person */}
        <AnimatedContent show={pricingModel === 'perPerson'}>
          <div className="border-t border-slate-100 pt-5">
            {/* Pricing approach */}
            <div className="mb-5">
              <label className="block text-[13px] font-semibold mb-2 text-slate-600">Pricing categories</label>
              <div className="flex gap-2 flex-wrap">
                <label
                  className={cn(
                    'relative px-5 py-2.5 rounded-xl text-sm font-medium border-2 cursor-pointer transition-all duration-200',
                    pricingApproach === 'sameForEveryone'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  )}
                >
                  <input
                    type="radio"
                    name="pricingApproach"
                    value="sameForEveryone"
                    checked={pricingApproach === 'sameForEveryone'}
                    onChange={() => {
                      console.log('[Step13] Pricing approach → sameForEveryone')
                      setField('pricingApproach', 'sameForEveryone')
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  The price is the same for everyone
                </label>
                <label
                  className={cn(
                    'relative px-5 py-2.5 rounded-xl text-sm font-medium border-2 cursor-pointer transition-all duration-200',
                    pricingApproach === 'dependsOnAge'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  )}
                >
                  <input
                    type="radio"
                    name="pricingApproach"
                    value="dependsOnAge"
                    checked={pricingApproach === 'dependsOnAge'}
                    onChange={() => {
                      console.log('[Step13] Pricing approach → dependsOnAge')
                      setField('pricingApproach', 'dependsOnAge')
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  Price depends on category
                </label>
              </div>
            </div>

            {pricingApproach === 'sameForEveryone' ? (
              <div className="mb-5">
                <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Customer pays</label>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{sym}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-2.5 text-sm transition-all focus-ring"
                    value={uniformPrice ?? ''}
                    onChange={(e) => setField('uniformPrice', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                {getError('uniformPrice')}
                <p className="text-[13px] text-slate-500 mt-1.5">Your commission rate is applicable based on your current operating geographical area.</p>
              </div>
            ) : (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold text-slate-600">Pricing categories</p>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('[Step13] Add pricing category clicked')
                      addPricingCategory()
                    }}
                    className="px-3 py-1.5 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    + Add category
                  </button>
                </div>
                {pricingCategories.length === 0 ? (
                  <p className="text-[13px] text-slate-500 leading-relaxed py-3 text-center italic bg-slate-50 rounded-lg border border-dashed border-slate-200">No pricing categories added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pricingCategories.map((category, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">{sym}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="min-h-[40px] rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-sm transition-all focus-ring w-[100px] [appearance:textfield]"
                                  value={category.price ?? ''}
                                  onChange={(e) => updatePricingCategory(i, { price: e.target.value === '' ? null : Number(e.target.value) })}
                                  placeholder="0.00"
                                />
                              </div>
                              <select
                                className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring cursor-pointer"
                                value={category.name}
                                onChange={(e) => {
                                  const next = e.target.value
                                  const updates = { name: next }
                                  if (!isIdSupportedCategory(next)) {
                                    updates.idRequired = false
                                    updates.idType = ''
                                  }
                                  if (isAdultCategory(next)) {
                                    updates.needsAdult = false
                                  }
                                  updatePricingCategory(i, updates)
                                }}
                              >
                                <option value="">Select category</option>
                                {PRICING_CATEGORY_PRESETS.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[13px] text-slate-500 font-medium">Age</span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => updatePricingCategory(i, { minAge: Math.max(0, category.minAge - 1) })}
                                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 grid place-items-center text-sm transition-colors"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={category.maxAge - 1}
                                  value={category.minAge}
                                  onChange={(e) => updatePricingCategory(i, { minAge: Math.max(0, Math.min(category.maxAge - 1, Number(e.target.value) || 0)) })}
                                  className="w-14 h-8 text-center rounded-lg border border-slate-200 bg-white text-sm font-medium [appearance:textfield] focus-ring"
                                />
                                <button
                                  type="button"
                                  onClick={() => updatePricingCategory(i, { minAge: Math.min(category.maxAge - 1, category.minAge + 1) })}
                                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 grid place-items-center text-sm transition-colors"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-slate-300">–</span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => updatePricingCategory(i, { maxAge: Math.max(category.minAge + 1, category.maxAge - 1) })}
                                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 grid place-items-center text-sm transition-colors"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={category.minAge + 1}
                                  max={99}
                                  value={category.maxAge}
                                  onChange={(e) => updatePricingCategory(i, { maxAge: Math.max(category.minAge + 1, Math.min(99, Number(e.target.value) || 0)) })}
                                  className="w-14 h-8 text-center rounded-lg border border-slate-200 bg-white text-sm font-medium [appearance:textfield] focus-ring"
                                />
                                <button
                                  type="button"
                                  onClick={() => updatePricingCategory(i, { maxAge: Math.min(99, category.maxAge + 1) })}
                                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 grid place-items-center text-sm transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePricingCategory(i)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          >
                            ✕
                          </button>
                        </div>

                        <details className="group text-[13px]">
                          <summary className="flex items-center gap-1.5 text-slate-500 cursor-pointer hover:text-slate-700 font-medium list-none">
                            <ChevronDown size={13} className="transition-transform duration-200 group-open:rotate-180" />
                            Show advanced settings
                          </summary>
                          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={category.notAllowed}
                                onChange={(e) => updatePricingCategory(i, { notAllowed: e.target.checked })}
                                className="w-[16px] h-[16px] cursor-pointer text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className={cn('text-sm', category.notAllowed ? 'text-red-600 font-medium' : 'text-slate-600')}>
                                Category not allowed on activity
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={category.ticketNotRequired}
                                onChange={(e) => updatePricingCategory(i, { ticketNotRequired: e.target.checked })}
                                className="w-[16px] h-[16px] cursor-pointer text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-sm text-slate-600">Ticket is not required</span>
                            </label>
                            {!isAdultCategory(category.name) && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={category.needsAdult}
                                  onChange={(e) => updatePricingCategory(i, { needsAdult: e.target.checked })}
                                  className="w-[16px] h-[16px] cursor-pointer text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-600">{category.name || 'This category'} — do they need an adult with them?</span>
                              </label>
                            )}
                            {isIdSupportedCategory(category.name) && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!category.idRequired}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    const options = ID_TYPE_OPTIONS[category.name] || []
                                    updatePricingCategory(i, { idRequired: checked, idType: checked ? (category.idType || options[0] || '') : '' })
                                  }}
                                  className="w-[16px] h-[16px] cursor-pointer text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <span className={cn('text-sm', category.idRequired ? 'text-emerald-700 font-medium' : 'text-slate-600')}>
                                  Requires ID verification
                                </span>
                              </label>
                            )}
                            {category.idRequired && isIdSupportedCategory(category.name) && (
                              <div className="w-full">
                                <label className="block text-[13px] font-medium mb-1 text-slate-500">ID type</label>
                                <select
                                  value={ID_TYPE_OPTIONS[category.name]?.includes(category.idType) ? category.idType : (ID_TYPE_OPTIONS[category.name]?.[0] || '')}
                                  onChange={(e) => updatePricingCategory(i, { idType: e.target.value })}
                                  className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm transition-all focus-ring cursor-pointer w-full"
                                >
                                  {(ID_TYPE_OPTIONS[category.name] || []).map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </details>
                      </motion.div>
                    ))}
                  </div>
                )}
                {getError('pricingCategories')}
                {errors.pricingCategories && errors.pricingCategories.map((msg, idx) => (
                  <span key={idx} className="block text-[13px] text-red-600 font-medium mt-1">{msg}</span>
                ))}
                <AgeCoverageBar ageGroups={pricingCategories} />
              </div>
            )}

            {/* Capacity */}
            <div className="mb-5">
              <label className="block text-[13px] font-semibold mb-3 text-slate-600">Capacity</label>
              <div className="flex gap-4">
                <div>
                  <label className="block text-[12px] font-medium mb-1 text-slate-500">Min participants</label>
                  <input
                    type="number"
                    min="0"
                    className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[120px] [appearance:textfield]"
                    value={minParticipants}
                    onChange={(e) => setField('minParticipants', Math.max(0, Number(e.target.value)))}
                  />
                  {getError('minParticipants')}
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1 text-slate-500">Max participants</label>
                  <input
                    type="number"
                    min="1"
                    className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[120px] [appearance:textfield]"
                    value={maxParticipants}
                    onChange={(e) => setField('maxParticipants', Math.max(1, Number(e.target.value)))}
                  />
                  {getError('maxParticipants')}
                </div>
              </div>
              <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">The minimum number of participants required for your activity to operate, and the maximum per time slot.</p>
            </div>

            {/* Pricing tiers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-semibold text-slate-600">Pricing tiers</p>
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Step13] Add pricing tier clicked. Current pricingTiers:', JSON.stringify(pricingTiers))
                    addPricingTier()
                  }}
                  className="px-3 py-1.5 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  + Add pricing tier
                </button>
              </div>
              <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">Setting up price tiers is optional. The tiers you enter will apply to all your age groups.</p>
              {pricingTiers.length === 0 ? (
                <p className="text-[13px] text-slate-500 leading-relaxed italic py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No pricing tiers set. Pricing tiers allow you to have different prices per person depending on the number of people booked.
                </p>
              ) : (
                <div className="space-y-2">
                  {pricingTiers.map((tier, i) => (
                    <motion.div
                      key={tier.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white"
                    >
                      <span className="text-[13px] text-slate-500">From</span>
                      <input
                        type="number"
                        min="1"
                        className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[60px] text-center [appearance:textfield]"
                        value={tier.from ?? ''}
                        onChange={(e) => updatePricingTier(i, { from: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="1"
                      />
                      <span className="text-[13px] text-slate-500">to</span>
                      <input
                        type="number"
                        min="1"
                        className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[60px] text-center [appearance:textfield]"
                        value={tier.to ?? ''}
                        onChange={(e) => updatePricingTier(i, { to: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="4"
                      />
                      <span className="text-[13px] text-slate-500">{sym}/person</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">{sym}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="min-h-[40px] rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-sm transition-all focus-ring w-[90px] [appearance:textfield]"
                          value={tier.pricePerPerson ?? ''}
                          onChange={(e) => updatePricingTier(i, { pricePerPerson: e.target.value === '' ? null : Number(e.target.value) })}
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePricingTier(i)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[13px] text-slate-500 mt-4 leading-relaxed border-t border-slate-200 pt-3">
              Commission will be deducted from each successful booking. Your payout is the retail price minus commission based on your agreement.
            </p>
          </div>
        </AnimatedContent>

        {/* Per Group */}
        <AnimatedContent show={pricingModel === 'perGroup'}>
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold text-slate-600">Group sizes</p>
              <button
                type="button"
                onClick={() => {
                  console.log('[Step13] Add group size clicked')
                  addGroupSize()
                }}
                className="px-3 py-1.5 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                + Additional group size
              </button>
            </div>

            {groupSizes.length === 0 ? (
              <p className="text-[13px] text-slate-500 leading-relaxed italic py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">No group sizes added yet.</p>
            ) : (
              <div className="space-y-2">
                {groupSizes.map((gs, i) => (
                  <motion.div
                    key={gs.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <span className="text-[13px] text-slate-500">Up to</span>
                    <input
                      type="number"
                      min="1"
                      className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[60px] text-center [appearance:textfield]"
                      value={gs.size ?? ''}
                      onChange={(e) => updateGroupSize(i, { size: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="5"
                    />
                    <span className="text-[13px] text-slate-500">people</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">{sym}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="min-h-[40px] rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-sm transition-all focus-ring w-[100px] [appearance:textfield]"
                        value={gs.price ?? ''}
                        onChange={(e) => updateGroupSize(i, { price: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                    <span className="text-[13px] text-slate-500">per group</span>
                    <button
                      type="button"
                      onClick={() => removeGroupSize(i)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
            {getError('groupSizes')}

            {/* Additional persons */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={additionalPersonsEnabled}
                  onChange={(e) => setField('additionalPersonsEnabled', e.target.checked)}
                  className="mt-0.5 w-[18px] h-[18px] cursor-pointer text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 shrink-0"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Additional persons</span>
                  <p className="text-[12px] text-slate-500 mt-0.5">Combine a group price with a price per extra person.</p>
                </div>
              </label>
              <AnimatedContent show={additionalPersonsEnabled}>
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-[13px] text-slate-500">Extra person price:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">{sym}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="min-h-[40px] rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-sm transition-all focus-ring w-[100px] [appearance:textfield]"
                      value={additionalPersonPrice ?? ''}
                      onChange={(e) => setField('additionalPersonPrice', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </AnimatedContent>
            </div>

            {/* Max groups per time slot */}
            <div className="mt-4">
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">Maximum groups per time slot</label>
              <input
                type="number"
                min="1"
                className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[120px] [appearance:textfield]"
                value={maxGroupsPerTimeSlot}
                onChange={(e) => setField('maxGroupsPerTimeSlot', Math.max(1, Number(e.target.value)))}
              />
              <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                The maximum number of groups you can accommodate at the same time (e.g., number of guides or vehicles available).
              </p>
              {getError('maxGroupsPerTimeSlot')}
            </div>

            <p className="text-[13px] text-slate-500 mt-4 leading-relaxed border-t border-slate-200 pt-3">
              Commission will be deducted from each successful booking. Your payout is the retail price minus commission based on your agreement.
            </p>
          </div>
        </AnimatedContent>
      </SectionCard>
    </div>
  )
}
