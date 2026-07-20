import { useState } from 'react'
import { GYG_SECTIONS, GYG_STEPS } from './gygSteps'
import { useProductBuilderStore } from './productBuilderStore'
import { isStepComplete } from './stepValidation'

export default function WizardSidebar({ currentStep, onSelectStep }) {
  const formData = useProductBuilderStore()
  const [expandedSections, setExpandedSections] = useState(() => new Set(['product-content']))

  const totalSteps = GYG_STEPS.length
  const completedCount = GYG_STEPS.filter(
    (s) => s.id !== currentStep && isStepComplete(s.id, formData),
  ).length
  const progress = Math.round((completedCount / totalSteps) * 100)

  function toggleSection(id) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function isCompleted(stepId) {
    if (stepId === currentStep) return false
    return isStepComplete(stepId, formData)
  }

  function getStepsForSection(section) {
    return GYG_STEPS.filter((s) => s.sectionId === section.id)
  }

  return (
    <aside className="wizard-sidebar w-[300px] shrink-0 bg-[#f4f7fc] rounded-[20px] border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="wizard-sidebar-header shrink-0 pt-[18px] px-5 pb-4 border-b border-slate-200">
        <span className="block text-sm font-bold mb-2.5">Product Builder</span>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-500">{completedCount} of {totalSteps} complete</span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-none px-5 py-2">
        {GYG_SECTIONS.map((section) => {
          const steps = getStepsForSection(section)
          const isExpanded = expandedSections.has(section.id)

          return (
            <div key={section.id} className="border-b border-slate-200 last:border-b-0">
              <button
                className="flex items-center justify-between w-full px-5 py-3 bg-transparent border-0 cursor-pointer text-[11px] font-bold uppercase tracking-wider text-slate-500"
                onClick={() => toggleSection(section.id)}
                type="button"
              >
                <span>{section.label}</span>
                {section.collapsible && (
                  <span className={`text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                    ▼
                  </span>
                )}
              </button>

              {(!section.collapsible || isExpanded) && (
                <div>
                  {steps.map((step) => {
                    const isActive = currentStep === step.id
                    const complete = isCompleted(step.id)

                    return (
                      <div key={step.id}>
                        <button
                          className={`flex items-center gap-2.5 w-full px-5 py-2.5 bg-transparent border-0 border-l-[3px] border-transparent cursor-pointer text-left text-sm text-slate-700 transition-all duration-150 hover:bg-white/70 ${
                            isActive ? 'border-l-emerald-600 bg-emerald-50/60 font-semibold text-emerald-700' : ''
                          } ${complete ? 'text-emerald-800' : ''}`}
                          onClick={() => onSelectStep(step.id)}
                          type="button"
                        >
                          <span className="grid place-items-center w-5 h-5 shrink-0">
                            {complete ? (
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="7" fill="#16a34a" />
                                <path d="M5 8.5L7 10.5L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <span className="grid place-items-center w-5 h-5 rounded-full bg-slate-200 text-[11px] font-bold text-slate-500">
                                {step.id}
                              </span>
                            )}
                          </span>
                          <span className="leading-tight">{step.label}</span>
                        </button>

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
