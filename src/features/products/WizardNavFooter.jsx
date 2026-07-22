import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { validateStep } from './stepValidation'
import { useProductBuilderStore } from './productBuilderStore'

export default function WizardNavFooter({ currentStep, totalSteps, onBack, onNext, onSave, saving }) {
  const formData = useProductBuilderStore()
  const [savedText, setSavedText] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    const unsub = useProductBuilderStore.subscribe(() => {
      setSavedText('Saving...')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setSavedText('Draft saved')
        setTimeout(() => setSavedText(''), 2000)
      }, 400)
    })
    return () => { unsub(); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const errors = validateStep(currentStep, formData)
  const hasErrors = Object.keys(errors).length > 0
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  async function handleSaveAndContinue(e) {
    e.preventDefault()
    if (hasErrors) return
    try {
      await onSave?.()
      toast.success('Product saved')
      onNext()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save product')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (hasErrors) return
    try {
      await onSave?.()
      toast.success('Product saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save product')
    }
  }

  return (
    <div className="flex items-center justify-between px-8 py-4 border-t border-slate-200 bg-slate-50/80">
      <div className="flex items-center gap-3">
        {!isFirstStep && (
          <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors" onClick={onBack} type="button">
            Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {saving && (
          <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 font-semibold">
            <Loader2 size={14} className="animate-spin" />
            Saving...
          </span>
        )}
        {!saving && hasErrors && (
          <span className="text-[13px] text-red-600 font-semibold">
            {Object.values(errors).flat().length} issue{Object.values(errors).flat().length > 1 ? 's' : ''} to fix
          </span>
        )}
        {!saving && !hasErrors && savedText && (
          <span className="text-xs text-emerald-600 font-semibold animate-[fadeIn_0.2s_ease]">{savedText}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!isLastStep ? (
          <button
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSaveAndContinue}
            disabled={hasErrors || saving}
            type="button"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        ) : (
          <button
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={hasErrors || saving}
            type="button"
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  )
}
