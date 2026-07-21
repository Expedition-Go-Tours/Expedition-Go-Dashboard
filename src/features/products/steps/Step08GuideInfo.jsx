import { useProductBuilderStore } from '@/features/products/productBuilderStore'

const GUIDE_TYPE_OPTIONS = [
  {
    value: 'tour-guide',
    label: 'Tour guide',
    description: 'A professional guide leads the experience, providing commentary, history, and insights throughout the tour.',
    color: 'emerald',
    badge: 'Full guidance',
  },
  {
    value: 'driver',
    label: 'Driver',
    description: 'A driver provides transportation only. Customers are driven between locations without guided commentary.',
    color: 'amber',
    badge: 'Transport only',
  },
  {
    value: 'host',
    label: 'Host',
    description: 'A host welcomes and assists customers at the venue, handles check-in, and ensures a smooth experience.',
    color: 'violet',
    badge: 'On-site host',
  },
  {
    value: 'greeter',
    label: 'Greeter',
    description: 'A greeter meets customers at a designated location to direct them, then steps back as they explore independently.',
    color: 'blue',
    badge: 'Meet & release',
  },
  {
    value: 'self-guided',
    label: 'Self-guided',
    description: 'No live guide — customers explore at their own pace using maps, signage, or a mobile app.',
    color: 'slate',
    badge: 'Independent',
  },
  {
    value: 'instructor',
    label: 'Instructor',
    description: 'An instructor teaches a specific skill or activity, such as a cooking class, surf lesson, or pottery workshop.',
    color: 'rose',
    badge: 'Skill-based',
  },
]

function GuideCard({ option, isSelected, onSelect }) {
  const colorMap = {
    emerald: { bar: 'bg-emerald-500', border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
    amber: { bar: 'bg-amber-500', border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
    violet: { bar: 'bg-violet-500', border: 'border-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
    blue: { bar: 'bg-blue-500', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
    slate: { bar: 'bg-slate-500', border: 'border-slate-500', bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500', badge: 'bg-slate-200 text-slate-700' },
    rose: { bar: 'bg-rose-500', border: 'border-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700' },
  }

  const c = colorMap[option.color]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
        isSelected
          ? `${c.border} ${c.bg} shadow-[0_0_0_1px] shadow-current/10`
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className={`h-1.5 w-full ${c.bar} transition-all duration-200 ${isSelected ? 'h-2' : ''}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-bold ${isSelected ? c.text : 'text-slate-800'}`}>
                {option.label}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                {option.badge}
              </span>
            </div>
            <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
              {option.description}
            </p>
          </div>

          <div className={`shrink-0 w-5 h-5 rounded-full border-2 grid place-items-center transition-all duration-200 ${
            isSelected
              ? `${c.border} ${c.dot}`
              : 'border-slate-300 group-hover:border-slate-400'
          }`}>
            {isSelected && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

export default function Step08GuideInfo() {
  const guideType = useProductBuilderStore((s) => s.guideType)
  const guideMaterials = useProductBuilderStore((s) => s.guideMaterials)
  const setField = useProductBuilderStore((s) => s.setField)

  return (
    <div className="max-w-[720px] space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Who will customers interact with?</h3>
        <p className="text-[13px] text-slate-500 leading-relaxed">
          Choose the type of person who will be present with your customers during the experience.
          Each option represents a different level of interaction and guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GUIDE_TYPE_OPTIONS.map((opt) => (
          <GuideCard
            key={opt.value}
            option={opt}
            isSelected={guideType === opt.value}
            onSelect={() => setField('guideType', opt.value)}
          />
        ))}
      </div>

      <hr className="border-slate-100 my-2" />

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Guide materials</h3>
        <p className="text-[13px] text-slate-500 leading-relaxed">
          Select additional materials provided to customers as part of the guiding experience.
        </p>
        <div className="flex gap-6 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={guideMaterials?.audioGuide ?? false}
                onChange={(e) =>
                  setField('guideMaterials', {
                    ...guideMaterials,
                    audioGuide: e.target.checked,
                  })
                }
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 transition-all duration-150 grid place-items-center">
                {guideMaterials?.audioGuide && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-slate-700">Audio guides and headphones</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-sm select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={guideMaterials?.infoBooklet ?? false}
                onChange={(e) =>
                  setField('guideMaterials', {
                    ...guideMaterials,
                    infoBooklet: e.target.checked,
                  })
                }
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 transition-all duration-150 grid place-items-center">
                {guideMaterials?.infoBooklet && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-slate-700">Information booklets</span>
          </label>
        </div>
      </div>
    </div>
  )
}
