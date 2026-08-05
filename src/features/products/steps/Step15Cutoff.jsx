import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'

const CUTOFF_OPTIONS = [
  { group: 'Minutes', items: [5, 10, 15, 20, 30, 45, 60, 90, 120] },
]

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Africa/Dar_es_Salaam', label: 'East Africa Time (UTC+3) — Tanzania, Kenya, Uganda' },
  { value: 'Africa/Addis_Ababa', label: 'East Africa Time (UTC+3) — Ethiopia' },
  { value: 'Africa/Nairobi', label: 'East Africa Time (UTC+3) — Kenya' },
  { value: 'Africa/Kigali', label: 'Central Africa Time (UTC+2) — Rwanda' },
  { value: 'Africa/Kampala', label: 'East Africa Time (UTC+3) — Uganda' },
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time (UTC+2)' },
  { value: 'Africa/Cairo', label: 'Eastern European Time (UTC+2/+3) — Egypt' },
  { value: 'Africa/Casablanca', label: 'Morocco (UTC+1)' },
  { value: 'Africa/Lagos', label: 'West Africa Time (UTC+1) — Nigeria' },
  { value: 'Africa/Accra', label: 'Greenwich Mean Time (UTC+0) — Ghana' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (UTC+0/+1) — UK' },
  { value: 'Europe/Paris', label: 'Central European Time (UTC+1/+2)' },
  { value: 'Europe/Berlin', label: 'Central European Time (UTC+1/+2) — Germany' },
  { value: 'Europe/Istanbul', label: 'Turkey (UTC+3)' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time (UTC+3)' },
  { value: 'America/New_York', label: 'Eastern Time (UTC-5/-4)' },
  { value: 'America/Chicago', label: 'Central Time (UTC-6/-5)' },
  { value: 'America/Denver', label: 'Mountain Time (UTC-7/-6)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8/-7)' },
  { value: 'America/Phoenix', label: 'Mountain Time, no DST (UTC-7)' },
  { value: 'America/Anchorage', label: 'Alaska (UTC-9/-8)' },
  { value: 'America/Honolulu', label: 'Hawaii (UTC-10)' },
  { value: 'America/Toronto', label: 'Eastern Time (UTC-5/-4) — Canada' },
  { value: 'America/Mexico_City', label: 'Central Time (UTC-6) — Mexico' },
  { value: 'America/Bogota', label: 'Colombia (UTC-5)' },
  { value: 'America/Lima', label: 'Peru (UTC-5)' },
  { value: 'America/Santiago', label: 'Chile (UTC-4/-3)' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (UTC-3)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (UTC-3)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (UTC+4) — UAE' },
  { value: 'Asia/Riyadh', label: 'Arabia Standard Time (UTC+3) — Saudi Arabia' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (UTC+5:30)' },
  { value: 'Asia/Karachi', label: 'Pakistan (UTC+5)' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (UTC+7) — Thailand' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (UTC+9)' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia Eastern Time (UTC+10/+11)' },
  { value: 'Australia/Perth', label: 'Australia Western Time (UTC+8)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (UTC+12/+13)' },
]

function formatCutoffLabel(minutes) {
  if (minutes < 60) return `${minutes} Minutes`
  const h = minutes / 60
  return `${h} ${h === 1 ? 'Hour' : 'Hours'}`
}

export default function Step15Cutoff() {
  const cutoffMinutes = useProductBuilderStore((s) => s.cutoffMinutes)
  const lastMinuteBookings = useProductBuilderStore((s) => s.lastMinuteBookings)
  const perSlotCutoff = useProductBuilderStore((s) => s.perSlotCutoff)
  const timezone = useProductBuilderStore((s) => s.timezone)
  const setField = useProductBuilderStore((s) => s.setField)
  const errors = useStepErrors(17)

  const [showBanner, setShowBanner] = useState(true)

  return (
    <div className="max-w-[720px] space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Set your cut-off time</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          The cut-off time is the very latest you accept new bookings before the start time or end of opening hours.{' '}
          <a href="#" className="text-blue-600 hover:underline font-medium">Learn more</a>
        </p>
      </div>

      {/* Tour timezone */}
      <div data-field="timezone">
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          What timezone are your slots and cut-off times in?
        </label>
        <select
          value={timezone}
          onChange={(e) => setField('timezone', e.target.value)}
          className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
        <p className="text-[13px] text-slate-400 mt-1.5">
          Operating days, slot times and cut-off deadlines are anchored to this timezone. Defaults to UTC.
        </p>
      </div>

      {/* Cutoff dropdown */}
      <div data-field="cutoffMinutes">
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          How far in advance do you stop accepting new bookings? This is your default cut-off time.
        </label>
        <select
          value={cutoffMinutes}
          onChange={(e) => setField('cutoffMinutes', Number(e.target.value))}
          className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {CUTOFF_OPTIONS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.items.map((mins) => (
                <option key={mins} value={mins}>{formatCutoffLabel(mins)}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-[13px] text-slate-400 mt-1.5">
          Example: When the activity start time is 10:00, bookings will be stopped at {formatCutoffLabel(cutoffMinutes).toLowerCase()} before.
        </p>
        {errors.cutoffMinutes && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.cutoffMinutes[0]}</span>}
      </div>

      {/* Info banner */}
      {showBanner && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 flex-1">
            Setting a lower cut-off time can capture last minute bookings and drive more sales for your product.
          </p>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="p-0.5 text-blue-400 hover:text-blue-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Last-minute bookings checkbox */}
      <div data-field="lastMinuteBookings">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={lastMinuteBookings}
              onChange={(e) => setField('lastMinuteBookings', e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 transition-all duration-150 grid place-items-center shrink-0">
              {lastMinuteBookings && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">
              Enable last-minute bookings after the first booking (optional)
            </span>
            <p className="text-[13px] text-slate-400 mt-0.5 leading-relaxed">
              After the first booking is made for a time slot, the cut-off time is removed. This encourages more bookings right up until the start time.
            </p>
          </div>
        </label>
        {errors.lastMinuteBookings && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.lastMinuteBookings[0]}</span>}
      </div>

      <hr className="border-slate-100" />

      {/* Per-slot cutoff radio */}
      <div data-field="perSlotCutoff">
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          Do you want your time slots to have different cut-off times?
        </label>
        <p className="text-[13px] text-slate-500 mb-3">
          You can override the default cut-off time with a different value for each time slot.
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="perSlotCutoff"
              checked={perSlotCutoff === false}
              onChange={() => setField('perSlotCutoff', false)}
              className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900">No</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="perSlotCutoff"
              checked={perSlotCutoff === true}
              onChange={() => setField('perSlotCutoff', true)}
              className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900">Yes</span>
          </label>
        </div>
        {errors.perSlotCutoff && <span className="text-[13px] text-red-600 font-medium mt-1">{errors.perSlotCutoff[0]}</span>}
      </div>
    </div>
  )
}
