/**
 * Onboarding wizard step definitions.
 * Shared between the wizard and any progress indicator.
 */

import type { Step } from "./step-indicator"

export const ONBOARDING_STEPS: Step[] = [
  { num: 1, label: "Personal Info" },
  { num: 2, label: "Additional Info" },
  { num: 3, label: "Property" },
  { num: 4, label: "Documents" },
  { num: 5, label: "Agreement" },
  { num: 6, label: "Review & Sign" },
]

/** Total number of wizard steps (used for "last step" checks). */
export const TOTAL_STEPS = ONBOARDING_STEPS.length
