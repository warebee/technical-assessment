/**
 * Wizard State Management
 *
 * Manages the state of the 3-step assessment wizard across Steps 1, 2, and 3.
 * State is persisted to localStorage and shared across all wizard pages.
 */

export interface WizardState {
  // Step 1: User Information
  candidateName: string;
  candidateEmail: string;
  selectedRoles: string[]; // Role IDs discovered from forms directory
  timerMode: 'none' | 30 | 60 | 90;

  // Direct Mode (URL params passed - hides selection UI)
  isDirectMode: boolean;

  // Step 2: Dataset Reference
  datasetsViewed: string[];
  datasetsDownloaded: string[];

  // Step 3: Assessment Questions
  formData: Record<string, any>;
  startTime: number | null;
  currentGroupIndex: number;
  viewMode: 'list' | 'focus';
  currentFieldIndex: number;
  sidebarCollapsed: boolean;

  // Navigation State
  currentStep: 1 | 2 | 3;
  completedSteps: number[];
}

const STORAGE_KEY = 'assessment_wizard_state';

/**
 * Save wizard state to localStorage
 * @param state Partial wizard state to save (merges with existing)
 */
export function saveWizardState(state: Partial<WizardState>): void {
  if (typeof window === 'undefined') return;

  const current = loadWizardState() || getDefaultState();
  const updated = { ...current, ...state };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Load wizard state from localStorage
 * @returns WizardState or null if not found
 */
export function loadWizardState(): WizardState | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WizardState;
  } catch (error) {
    console.error('Failed to parse wizard state:', error);
    return null;
  }
}

/**
 * Clear wizard state from localStorage
 * Called after successful submission or when user wants to start over
 */
export function resetWizardState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get default wizard state
 */
function getDefaultState(): WizardState {
  return {
    // Step 1
    candidateName: '',
    candidateEmail: '',
    selectedRoles: [],
    timerMode: 'none',
    isDirectMode: false,

    // Step 2
    datasetsViewed: [],
    datasetsDownloaded: [],

    // Step 3
    formData: {},
    startTime: null,
    currentGroupIndex: 0,
    viewMode: 'list',
    currentFieldIndex: 0,
    sidebarCollapsed: false,

    // Navigation
    currentStep: 1,
    completedSteps: [],
  };
}

/**
 * Check if a step is completed
 */
export function isStepCompleted(step: number): boolean {
  const state = loadWizardState();
  if (!state) return false;
  return state.completedSteps.includes(step);
}

/**
 * Check if user can access a specific step
 * @param step Step number to check (1, 2, or 3)
 * @returns true if user can access the step
 */
export function canAccessStep(step: number): boolean {
  if (step === 1) return true; // Step 1 is always accessible

  const state = loadWizardState();
  if (!state) return false;

  // Step 2 requires Step 1 completion
  if (step === 2) return state.completedSteps.includes(1);

  // Step 3 requires Step 1 and Step 2 completion
  if (step === 3) return state.completedSteps.includes(1) && state.completedSteps.includes(2);

  return false;
}

/**
 * Mark a step as completed
 */
export function completeStep(step: number): void {
  const state = loadWizardState() || getDefaultState();
  if (!state.completedSteps.includes(step)) {
    saveWizardState({
      completedSteps: [...state.completedSteps, step],
    });
  }
}

/**
 * Note: Role information is now managed in lib/roles.ts
 * These functions are deprecated and will be removed.
 * Use getRoleInfo() and getMultipleRolesInfo() from lib/roles.ts instead.
 */
