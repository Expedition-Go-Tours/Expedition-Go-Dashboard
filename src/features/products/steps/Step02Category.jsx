import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'

const CATEGORIES = [
  'Attraction ticket',
  'Day trip',
  'Guided walking tour',
  'Guided motorized tour',
  'Panoramic bus tour',
  'City cruise',
  'Boat tour',
  'Multi-day tour',
  'Transfer',
  'Hop-on hop-off bus',
  'Hop-on hop-off boat',
  'City card',
  'Workshop or class',
  'Sporting activity',
]

const ACTIVITY_TYPES = [
  { value: 'guided', label: 'Guided' },
  { value: 'self-guided', label: 'Self-guided' },
  { value: 'audio-guide', label: 'Audio guide' },
  { value: 'live-guide', label: 'Live guide' },
  { value: 'host', label: 'Host' },
]

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
  { value: 'challenging', label: 'Challenging' },
]

const DURATION_UNITS = ['minutes', 'hours', 'days']

export default function Step02Category() {
  const category = useProductBuilderStore((s) => s.category)
  const activityType = useProductBuilderStore((s) => s.activityType)
  const difficulty = useProductBuilderStore((s) => s.difficulty)
  const duration = useProductBuilderStore((s) => s.duration)
  const durationUnit = useProductBuilderStore((s) => s.durationUnit)
  const setField = useProductBuilderStore((s) => s.setField)
  const errors = useStepErrors(2)

  return (
    <div className="max-w-[720px] space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          Product category
        </label>
        <Select value={category || ''} onValueChange={(v) => setField('category', v)}>
          <SelectTrigger data-field="category">
            <SelectValue placeholder="Select a category..." />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.category[0]}</span>}
        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
          The category determines which optional features are available.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          Activity type
        </label>
        <Select value={activityType || ''} onValueChange={(v) => setField('activityType', v)}>
          <SelectTrigger data-field="activityType">
            <SelectValue placeholder="Select activity type..." />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map((at) => (
              <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.activityType && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.activityType[0]}</span>}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          Difficulty level
        </label>
        <Select value={difficulty || ''} onValueChange={(v) => setField('difficulty', v)}>
          <SelectTrigger data-field="difficulty">
            <SelectValue placeholder="Select difficulty..." />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_LEVELS.map((dl) => (
              <SelectItem key={dl.value} value={dl.value}>{dl.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.difficulty && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.difficulty[0]}</span>}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-slate-800">
          Duration
        </label>
        <div className="flex gap-3">
          <div className="w-[90px]">
            <input
              data-field="duration"
              type="number"
              min="0.5"
              step="0.5"
              className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
              placeholder="e.g. 2"
              value={duration ?? ''}
              onChange={(e) => setField('duration', e.target.value ? parseFloat(e.target.value) : null)}
            />
            {errors.duration && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.duration[0]}</span>}
          </div>
          <Select value={durationUnit} onValueChange={(v) => setField('durationUnit', v)}>
            <SelectTrigger data-field="durationUnit" className="w-[140px]">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_UNITS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
