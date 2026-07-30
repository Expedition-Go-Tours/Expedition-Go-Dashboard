import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'

export default function Step03Title() {
  const title = useProductBuilderStore((s) => s.title)
  const referenceCode = useProductBuilderStore((s) => s.referenceCode)
  const setField = useProductBuilderStore((s) => s.setField)
  const errors = useStepErrors(3)

  return (
    <div className="max-w-[720px]">
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Product title *</label>
        <input
          data-field="title"
          className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
          type="text"
          value={title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="e.g. Paris: Eiffel Tower Priority Access Tour"
        />
        {errors.title && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.title[0]}</span>}
        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
          Use title case. Format: Location: Activity Type + USP. Do not include price.
        </p>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Product reference code</label>
        <input
          data-field="referenceCode"
          className="w-full min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
          type="text"
          value={referenceCode}
          onChange={(e) => setField('referenceCode', e.target.value)}
          placeholder="Internal code (optional)"
        />
        {errors.referenceCode && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.referenceCode[0]}</span>}
        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
          An internal code to help you identify this product. Not shown to customers.
        </p>
      </div>
    </div>
  )
}
