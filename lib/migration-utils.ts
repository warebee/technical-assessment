/**
 * Migration Utilities
 *
 * Handles migration of old localStorage data to new wizard state format
 */

import { saveWizardState, WizardState } from './wizard-state';
import { getDefaultRoleIds } from './roles';

/**
 * Migrate old assessment_* localStorage data to new wizard state format
 * @returns true if migration occurred, false if no old data found
 */
export function migrateOldAssessmentData(): boolean {
  if (typeof window === 'undefined') return false;

  const roles = getDefaultRoleIds();
  let migrated = false;
  let migratedRole: string | null = null;
  let migratedData: any = null;

  // Check for old localStorage keys and find the one with the most data
  for (const role of roles) {
    const oldKey = `assessment_${role}`;
    const oldData = localStorage.getItem(oldKey);

    if (oldData) {
      try {
        const parsed = JSON.parse(oldData);

        // Prefer the role with the most form data or most recent data
        if (!migratedData || Object.keys(parsed.formData || {}).length > Object.keys(migratedData.formData || {}).length) {
          migratedData = parsed;
          migratedRole = role;
        }
      } catch (e) {
        console.error(`Failed to parse old data for ${role}:`, e);
      }
    }
  }

  // If we found old data, migrate it
  if (migratedRole && migratedData) {
    const newState: Partial<WizardState> = {
      candidateName: migratedData.formData?.candidate_name || '',
      candidateEmail: migratedData.formData?.candidate_email || '',
      selectedRoles: [migratedRole], // Infer from old key
      timerMode: 'none',
      datasetsViewed: [],
      datasetsDownloaded: [],
      formData: migratedData.formData || {},
      startTime: migratedData.startTime || null,
      currentGroupIndex: migratedData.currentGroupIndex || 0,
      viewMode: migratedData.viewMode || 'list',
      currentFieldIndex: migratedData.currentFieldIndex || 0,
      sidebarCollapsed: migratedData.sidebarCollapsed || false,
      currentStep: 3, // They were on questions
      completedSteps: [1, 2], // Assume they got through steps 1 & 2
    };

    saveWizardState(newState);

    // Clean up old keys
    for (const role of roles) {
      localStorage.removeItem(`assessment_${role}`);
    }

    migrated = true;
    console.log(`Migrated assessment data from ${migratedRole} to new wizard state`);
  }

  return migrated;
}

/**
 * Check if there's any old assessment data that needs migration
 */
export function hasOldAssessmentData(): boolean {
  if (typeof window === 'undefined') return false;

  const roles = getDefaultRoleIds();
  return roles.some((role) => localStorage.getItem(`assessment_${role}`) !== null);
}
