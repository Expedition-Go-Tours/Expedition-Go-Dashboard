import { useState } from 'react'
import { useProductBuilderStore } from '@/features/products/productBuilderStore'
import { useStepErrors } from '@/features/products/useStepErrors'

export default function Step04Descriptions() {
  const shortDescription = useProductBuilderStore((s) => s.shortDescription)
  const fullDescription = useProductBuilderStore((s) => s.fullDescription)
  const highlights = useProductBuilderStore((s) => s.highlights)
  const setField = useProductBuilderStore((s) => s.setField)
  const addHighlight = useProductBuilderStore((s) => s.addHighlight)
  const removeHighlight = useProductBuilderStore((s) => s.removeHighlight)
  const errors = useStepErrors(4)
  const [highlightInput, setHighlightInput] = useState('')

  function addHighlightItem() {
    const val = highlightInput.trim()
    if (val && highlights.length < 5 && !highlights.includes(val)) {
      addHighlight(val)
      setHighlightInput('')
    }
  }

  return (
    <div className="max-w-[720px]">
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Short description *</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
          rows={3}
          value={shortDescription}
          onChange={(e) => setField('shortDescription', e.target.value)}
          placeholder="2-3 sentences about your product. Shown on landing pages."
        />
        {errors.shortDescription && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.shortDescription[0]}</span>}
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Full description *</label>
        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring resize-vertical"
          rows={8}
          value={fullDescription}
          onChange={(e) => setField('fullDescription', e.target.value)}
          placeholder="Detailed description of the activity. Use descriptive language. Avoid listing a schedule."
        />
        {errors.fullDescription && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.fullDescription[0]}</span>}
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2 text-slate-800">Highlights * (3-5)</label>
        {highlights.length < 5 && (
          <div className="flex gap-2 mb-2.5">
            <input
              className="flex-1 min-h-[46px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm transition-all focus-ring"
              type="text"
              value={highlightInput}
              onChange={(e) => setHighlightInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addHighlightItem()
                }
              }}
              placeholder="Start with a verb: See, Visit, Enjoy, Explore..."
            />
            <button
              type="button"
              onClick={addHighlightItem}
              disabled={!highlightInput.trim()}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              Add
            </button>
          </div>
        )}
        <ul className="list-none p-0 m-0 mb-2.5">
          {highlights.map((item, i) => (
            <li key={i} className="flex items-center justify-between px-3 py-2 mb-1 bg-slate-50 rounded-lg border border-slate-100 text-sm">
              <span>{item}</span>
              <button
                className="bg-transparent border-0 text-red-500 cursor-pointer text-sm p-1 rounded-lg hover:bg-red-50"
                onClick={() => removeHighlight(i)}
                type="button"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        {errors.highlights && <span className="text-[13px] text-red-600 font-medium mt-1 flex items-center gap-1">{errors.highlights[0]}</span>}
      </div>
    </div>
  )
}
