import { useRef } from 'react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'

const PRICING_MODELS = [
  { value: 'perPerson', label: 'Per person' },
  { value: 'perGroup', label: 'Per group / vehicle' },
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

const AGE_GROUP_PRESETS = ['Adult', 'Child', 'Youth', 'Infant', 'Senior', 'Student']

export default function Step12PricingAvailability() {
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
  const ageGroups = useProductBuilderStore((s) => s.ageGroups)
  const minParticipants = useProductBuilderStore((s) => s.minParticipants)
  const maxParticipants = useProductBuilderStore((s) => s.maxParticipants)
  const pricingTiers = useProductBuilderStore((s) => s.pricingTiers)
  const groupSizes = useProductBuilderStore((s) => s.groupSizes)
  const additionalPersonsEnabled = useProductBuilderStore((s) => s.additionalPersonsEnabled)
  const additionalPersonPrice = useProductBuilderStore((s) => s.additionalPersonPrice)
  const maxGroupsPerTimeSlot = useProductBuilderStore((s) => s.maxGroupsPerTimeSlot)

  const setField = useProductBuilderStore((s) => s.setField)
  const addAgeGroup = useProductBuilderStore((s) => s.addAgeGroup)
  const updateAgeGroup = useProductBuilderStore((s) => s.updateAgeGroup)
  const removeAgeGroup = useProductBuilderStore((s) => s.removeAgeGroup)
  const addPricingTier = useProductBuilderStore((s) => s.addPricingTier)
  const updatePricingTier = useProductBuilderStore((s) => s.updatePricingTier)
  const removePricingTier = useProductBuilderStore((s) => s.removePricingTier)
  const addGroupSize = useProductBuilderStore((s) => s.addGroupSize)
  const updateGroupSize = useProductBuilderStore((s) => s.updateGroupSize)
  const removeGroupSize = useProductBuilderStore((s) => s.removeGroupSize)
  const addDateException = useProductBuilderStore((s) => s.addDateException)
  const updateDateException = useProductBuilderStore((s) => s.updateDateException)
  const removeDateException = useProductBuilderStore((s) => s.removeDateException)

  const errors = useStepErrors(12)
  const slotInputRef = useRef(null)

  function addTimeSlot() {
    setField('timeSlots', [
      ...timeSlots,
      { id: crypto.randomUUID(), startTime: '09:00', cutoff: 60 },
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
      <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors[path][0]}</span>
    ) : null
  }

  return (
    <div className="max-w-[720px] space-y-8">
      {/* 1. How do you run your activity — Schedule Type */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          How do you run your activity?
        </label>
        <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
          Choose how customers book time with your experience.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setField('scheduleType', 'fixedTimeSlot')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
              scheduleType === 'fixedTimeSlot'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            Fixed time slot
          </button>
          <button
            type="button"
            onClick={() => setField('scheduleType', 'operatingHours')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
              scheduleType === 'operatingHours'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            Operating hours
          </button>
        </div>
      </div>

      {/* 2. How do you price your activity — Pricing Model */}
      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          How do you price your activity?
        </label>
        <div className="flex gap-2">
          {PRICING_MODELS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setField('pricingModel', m.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                pricingModel === m.value
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {getError('pricingModel')}
      </div>

      {/* 3. Add new schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-slate-800">
            Schedule
          </label>
        </div>

        <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
              Schedule name
            </label>
            <input
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
              type="text"
              value={scheduleName}
              onChange={(e) => setField('scheduleName', e.target.value)}
              placeholder="e.g. Default, 2026 Summer"
            />
            {getError('scheduleName')}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                Start date
              </label>
              <input
                className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                type="date"
                value={scheduleStartDate}
                onChange={(e) => setField('scheduleStartDate', e.target.value)}
              />
              {getError('scheduleStartDate')}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={scheduleHasEndDate}
              onChange={(e) => setField('scheduleHasEndDate', e.target.checked)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <span className="text-slate-700">My activity has an end date</span>
          </label>

          {scheduleHasEndDate && (
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                End date
              </label>
              <input
                className="w-full max-w-[200px] min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
                type="date"
                value={scheduleEndDate}
                onChange={(e) => setField('scheduleEndDate', e.target.value)}
              />
              {getError('scheduleEndDate')}
            </div>
          )}

          {scheduleType === 'fixedTimeSlot' && (
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                Time slots
              </label>
              <p className="text-[13px] text-slate-500 mb-1.5 leading-relaxed">
                Fixed start times for your activity.
              </p>
              {timeSlots.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {timeSlots.map((slot, i) => (
                    <div key={slot.id} className="flex items-center gap-2">
                      <input
                        type="time"
                        className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[130px]"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(i, { startTime: e.target.value })}
                      />
                      <select
                        className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-sm transition-all focus-ring"
                        value={slot.cutoff ?? 60}
                        onChange={(e) => updateTimeSlot(i, { cutoff: Number(e.target.value) })}
                      >
                        <option value={0}>No cut-off</option>
                        <option value={5}>5 min</option>
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={25}>25 min</option>
                        <option value={30}>30 min</option>
                        <option value={35}>35 min</option>
                        <option value={40}>40 min</option>
                        <option value={45}>45 min</option>
                        <option value={50}>50 min</option>
                        <option value={55}>55 min</option>
                        <option value={60}>1 hr</option>
                        <option value={120}>2 hr</option>
                        <option value={180}>3 hr</option>
                        <option value={240}>4 hr</option>
                        <option value={300}>5 hr</option>
                        <option value={360}>6 hr</option>
                        <option value={480}>8 hr</option>
                        <option value={600}>10 hr</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(i)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addTimeSlot}
                className="px-4 py-2 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                + Add time slot
              </button>
              {getError('timeSlots')}
            </div>
          )}

          {scheduleType === 'operatingHours' && (
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                Operating hours
              </label>
              <p className="text-[13px] text-slate-500 mb-1.5 leading-relaxed">
                Customers can arrive any time within these hours.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[150px]"
                  value={operatingHoursStart}
                  onChange={(e) => setField('operatingHoursStart', e.target.value)}
                />
                <span className="text-slate-400">to</span>
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-semibold text-slate-600">
                Date exceptions
              </label>
              <button
                type="button"
                onClick={addDateException}
                className="px-3 py-1 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                + Add date
              </button>
            </div>
            <p className="text-[13px] text-slate-500 mb-1.5 leading-relaxed">
              Override time slots or close on specific dates.
            </p>
            {dateExceptions.length > 0 && (
              <div className="space-y-2">
                {dateExceptions.map((ex, i) => (
                  <div key={ex.id} className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="date"
                        className="w-full min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring"
                        value={ex.date}
                        onChange={(e) => updateDateException(i, { date: e.target.value })}
                      />
                      <select
                        className="min-h-[36px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring"
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
                                className="text-slate-400 hover:text-red-500 text-xs"
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
                      className="shrink-0 mt-1 w-6 h-6 rounded-full border-0 bg-transparent text-slate-400 cursor-pointer grid place-items-center text-xs hover:text-red-500 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Currency */}
      <div className="w-40">
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          Currency
        </label>
        <select
          className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
          value={currency}
          onChange={(e) => setField('currency', e.target.value)}
        >
          <option value="">Select...</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {getError('currency')}
      </div>

      {/* 5. Per Person — Pricing Categories & Capacity */}
      {pricingModel === 'perPerson' && (
        <>
          {/* Pricing Approach */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-800">
              Pricing categories
            </label>
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                type="button"
                onClick={() => setField('pricingApproach', 'sameForEveryone')}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  pricingApproach === 'sameForEveryone'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                The price is the same for everyone
              </button>
              <button
                type="button"
                onClick={() => setField('pricingApproach', 'dependsOnAge')}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  pricingApproach === 'dependsOnAge'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Price depends on age
              </button>
            </div>

            {pricingApproach === 'sameForEveryone' && (
              <div>
                <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                  Price per person
                </label>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{sym}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-2.5 text-sm transition-all focus-ring"
                    value={ageGroups[0]?.price ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value)
                      updateAgeGroup(0, { price: val })
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {pricingApproach === 'dependsOnAge' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[13px] font-semibold text-slate-600">
                    Age groups
                  </label>
                  <button
                    type="button"
                    onClick={addAgeGroup}
                    className="px-3 py-1.5 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    + Add age group
                  </button>
                </div>
                {ageGroups.length === 0 ? (
                  <p className="text-[13px] text-slate-500 leading-relaxed">No age groups added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {ageGroups.map((group, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-start gap-2">
                          <select
                            className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[110px]"
                            value={group.name}
                            onChange={(e) => updateAgeGroup(i, { name: e.target.value })}
                          >
                            <option value="">Group</option>
                            {AGE_GROUP_PRESETS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">{sym}</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="min-h-[40px] rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-sm transition-all focus-ring w-[90px]"
                              value={group.price ?? ''}
                              onChange={(e) => updateAgeGroup(i, { price: e.target.value === '' ? null : Number(e.target.value) })}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] text-slate-500">Age</span>
                            <select
                              className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 text-sm transition-all focus-ring w-[60px] text-center"
                              value={group.minAge}
                              onChange={(e) => updateAgeGroup(i, { minAge: Number(e.target.value) })}
                            >
                              {Array.from({ length: 100 }, (_, a) => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                            <span className="text-slate-300">–</span>
                            <select
                              className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 text-sm transition-all focus-ring w-[60px] text-center"
                              value={group.maxAge}
                              onChange={(e) => updateAgeGroup(i, { maxAge: Number(e.target.value) })}
                            >
                              {Array.from({ length: 100 }, (_, a) => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAgeGroup(i)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                        {/* Advanced settings per age group */}
                        <details className="text-[13px]">
                          <summary className="text-slate-500 cursor-pointer hover:text-slate-700 font-medium">
                            Show advanced settings
                          </summary>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.notAllowed}
                                onChange={(e) => updateAgeGroup(i, { notAllowed: e.target.checked })}
                                className="w-[16px] h-[16px] cursor-pointer"
                              />
                              <span className={group.notAllowed ? 'text-red-600' : 'text-slate-600'}>
                                Category not allowed on activity
                              </span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.ticketNotRequired}
                                onChange={(e) => updateAgeGroup(i, { ticketNotRequired: e.target.checked })}
                                className="w-[16px] h-[16px] cursor-pointer"
                              />
                              <span className="text-slate-600">Ticket is not required</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.needsAdult}
                                onChange={(e) => updateAgeGroup(i, { needsAdult: e.target.checked })}
                                className="w-[16px] h-[16px] cursor-pointer"
                              />
                              <span className="text-slate-600">Children need adult company</span>
                            </label>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
                {getError('ageGroups')}
                {errors.ageGroups && errors.ageGroups.map((msg, idx) => (
                  <span key={idx} className="block text-[13px] text-red-600 font-medium mt-1">{msg}</span>
                ))}
              </div>
            )}

            {/* Capacity */}
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-3 text-slate-800">
                Capacity
              </label>
              <div className="flex gap-4">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                    Min participants
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[120px]"
                    value={minParticipants}
                    onChange={(e) => setField('minParticipants', Math.max(0, Number(e.target.value)))}
                  />
                  {getError('minParticipants')}
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
                    Max participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[120px]"
                    value={maxParticipants}
                    onChange={(e) => setField('maxParticipants', Math.max(1, Number(e.target.value)))}
                  />
                  {getError('maxParticipants')}
                </div>
              </div>
              <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                The minimum number of participants required for your activity to operate, and the maximum per time slot.
              </p>
            </div>

            {/* Pricing Tiers (optional) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Pricing tiers
                </label>
                <button
                  type="button"
                  onClick={addPricingTier}
                  className="px-3 py-1.5 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  + Add pricing tier
                </button>
              </div>
              <p className="text-[13px] text-slate-500 mb-2 leading-relaxed">
                Offer scaled prices based on group size (optional).
              </p>
              {pricingTiers.length === 0 ? (
                <p className="text-[13px] text-slate-500 leading-relaxed italic">
                  No pricing tiers set. Pricing tiers allow you to have different prices per person depending on the number of people booked.
                </p>
              ) : (
                <div className="space-y-2">
                  {pricingTiers.map((tier, i) => (
                    <div key={tier.id} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                      <span className="text-[13px] text-slate-500">From</span>
                      <input
                        type="number"
                        min="1"
                        className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[60px] text-center"
                        value={tier.from ?? ''}
                        onChange={(e) => updatePricingTier(i, { from: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="1"
                      />
                      <span className="text-[13px] text-slate-500">to</span>
                      <input
                        type="number"
                        min="1"
                        className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[60px] text-center"
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
                          className="min-h-[40px] rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-sm transition-all focus-ring w-[90px]"
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commission info */}
            <p className="text-[13px] text-slate-500 mt-4 leading-relaxed border-t border-slate-200 pt-3">
              Commission will be deducted from each successful booking. Your payout is the retail price minus commission based on your agreement.
            </p>
          </div>
        </>
      )}

      {/* 6. Per Group */}
      {pricingModel === 'perGroup' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-slate-800">
              Group pricing
            </label>
            <button
              type="button"
              onClick={addGroupSize}
              className="px-3 py-1.5 text-[13px] font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              + Additional group size
            </button>
          </div>
          <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
            Set prices for different group sizes. Customers pay one price for the entire group.
          </p>

          {groupSizes.length === 0 ? (
            <p className="text-[13px] text-slate-500 leading-relaxed italic">No group sizes added yet.</p>
          ) : (
            <div className="space-y-2">
              {groupSizes.map((gs, i) => (
                <div key={gs.id} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[13px] text-slate-500">Up to</span>
                  <input
                    type="number"
                    min="1"
                    className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm transition-all focus-ring w-[60px] text-center"
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
                      className="min-h-[40px] rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-sm transition-all focus-ring w-[100px]"
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
                </div>
              ))}
            </div>
          )}
          {getError('groupSizes')}

          {/* Additional persons */}
          <div className="mt-4 p-3 rounded-xl border border-slate-200 bg-white space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={additionalPersonsEnabled}
                onChange={(e) => setField('additionalPersonsEnabled', e.target.checked)}
                className="w-[18px] h-[18px] cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Additional persons</span>
            </label>
            {additionalPersonsEnabled && (
              <div className="flex items-center gap-2 ml-6">
                <span className="text-[13px] text-slate-500">Extra person price:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">{sym}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="min-h-[40px] rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 py-1.5 text-sm transition-all focus-ring w-[100px]"
                    value={additionalPersonPrice ?? ''}
                    onChange={(e) => setField('additionalPersonPrice', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                <span className="text-[13px] text-slate-500">per person beyond group size</span>
              </div>
            )}
          </div>

          {/* Max groups per time slot */}
          <div className="mt-4">
            <label className="block text-[13px] font-semibold mb-1.5 text-slate-600">
              Maximum groups per time slot
            </label>
            <input
              type="number"
              min="1"
              className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring w-[120px]"
              value={maxGroupsPerTimeSlot}
              onChange={(e) => setField('maxGroupsPerTimeSlot', Math.max(1, Number(e.target.value)))}
            />
            <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
              The maximum number of groups you can accommodate at the same time (e.g., number of guides or vehicles available).
            </p>
            {getError('maxGroupsPerTimeSlot')}
          </div>

          {/* Commission info */}
          <p className="text-[13px] text-slate-500 mt-4 leading-relaxed border-t border-slate-200 pt-3">
            Commission will be deducted from each successful booking. Your payout is the retail price minus commission based on your agreement.
          </p>
        </div>
      )}
    </div>
  )
}
