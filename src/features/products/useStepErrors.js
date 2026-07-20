import { useProductBuilderStore } from './productBuilderStore'
import { validateStep } from './stepValidation'

export function useStepErrors(stepIndex) {
  const state = useProductBuilderStore()
  return validateStep(stepIndex, state)
}
