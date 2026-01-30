'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { loadWizardState, canAccessStep, saveWizardState } from '@/lib/wizard-state';
import { ParsedForm, MarkformGroup } from '@/lib/markform-parser';
import AssessmentForm from '../../components/AssessmentForm';

interface Step3ClientProps {
  forms: Record<string, ParsedForm | null>;
}

// Extended group type to track which roles a group belongs to
export interface ExtendedGroup extends MarkformGroup {
  roles: string[];
}

// Extended form type with role tracking
export interface MergedForm extends Omit<ParsedForm, 'groups'> {
  groups: ExtendedGroup[];
  selectedRoles: string[];
}

/**
 * Merge multiple role forms into a single form
 * - Combines all groups from selected roles
 * - Tracks which roles each group belongs to
 * - Deduplicates groups with same ID by merging role lists
 */
function mergeRoleForms(
  forms: Record<string, ParsedForm | null>,
  selectedRoles: string[]
): MergedForm | null {
  const validForms = selectedRoles
    .map(role => ({ role, form: forms[role] }))
    .filter((item): item is { role: string; form: ParsedForm } => item.form !== null);

  if (validForms.length === 0) return null;

  // Use first form's metadata as base
  const baseForm = validForms[0].form;
  const mergedGroups: ExtendedGroup[] = [];
  const groupMap = new Map<string, ExtendedGroup>();
  let submissionGroup: ExtendedGroup | null = null;

  for (const { role, form } of validForms) {
    for (const group of form.groups) {
      // Skip candidate_info as it's handled in Step 1
      if (group.id === 'candidate_info') continue;

      // Handle submission group separately to ensure it's always last
      if (group.id === 'submission') {
        if (submissionGroup) {
          // Add role to existing submission group
          if (!submissionGroup.roles.includes(role)) {
            submissionGroup.roles.push(role);
          }
        } else {
          // Create submission group but don't add to mergedGroups yet
          submissionGroup = {
            ...group,
            roles: [role],
          };
        }
        continue;
      }

      const existing = groupMap.get(group.id);
      if (existing) {
        // Group already exists, add role to its list
        if (!existing.roles.includes(role)) {
          existing.roles.push(role);
        }
      } else {
        // New group, add it with role tracking
        const extendedGroup: ExtendedGroup = {
          ...group,
          roles: [role],
        };
        groupMap.set(group.id, extendedGroup);
        mergedGroups.push(extendedGroup);
      }
    }
  }

  // Add submission group at the very end
  if (submissionGroup) {
    mergedGroups.push(submissionGroup);
  }

  // Create combined title
  const roleNames = selectedRoles.map(r =>
    r.charAt(0).toUpperCase() + r.slice(1)
  ).join(' + ');

  return {
    metadata: {
      ...baseForm.metadata,
      title: selectedRoles.length > 1
        ? `${roleNames} Assessment`
        : baseForm.metadata.title,
    },
    groups: mergedGroups,
    selectedRoles,
  };
}

export default function Step3Client({ forms }: Step3ClientProps) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check if user can access step 3
    if (!canAccessStep(3)) {
      setIsRedirecting(true);
      router.replace('/assessment/step/1');
      return;
    }

    // Load wizard state to get selected role(s)
    const state = loadWizardState();
    if (!state || !state.selectedRoles || state.selectedRoles.length === 0) {
      setIsRedirecting(true);
      router.replace('/assessment/step/1');
      return;
    }

    setSelectedRoles(state.selectedRoles);

    // Update current step
    saveWizardState({ currentStep: 3 });

    setIsLoading(false);
  }, [router]);

  // Merge forms for all selected roles
  const mergedForm = useMemo(() => {
    if (selectedRoles.length === 0) return null;
    return mergeRoleForms(forms, selectedRoles);
  }, [forms, selectedRoles]);

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-app-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-menu-h3">
            {isRedirecting ? 'Redirecting to step 1...' : 'Loading assessment...'}
          </p>
          {isRedirecting && (
            <>
              <p className="text-menu-h5 mt-2 text-sm">
                Please complete steps 1 and 2 first.
              </p>
              <a
                href="/assessment/step/1"
                className="inline-block mt-4 px-4 py-2 bg-brand hover:bg-brand-hover text-black rounded-lg text-sm font-medium"
              >
                Go to Step 1
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!mergedForm || mergedForm.groups.length === 0) {
    return (
      <div className="min-h-screen bg-app-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-2 text-lg font-semibold">No assessment questions found</p>
          <p className="text-menu-h4 mb-4 text-sm">
            {selectedRoles.length > 0
              ? `Selected roles: ${selectedRoles.join(', ')}. The form files may be missing or empty.`
              : 'No roles were selected. Please go back and select at least one role.'}
          </p>
          <button
            onClick={() => router.push('/assessment/step/1')}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-black rounded-lg font-medium"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <AssessmentForm
      form={mergedForm}
      selectedRoles={selectedRoles}
    />
  );
}
