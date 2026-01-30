'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveWizardState } from '@/lib/wizard-state';

interface LegacyAssessmentPageProps {
  params: Promise<{ role: string }>;
}

export default function LegacyAssessmentPage({ params }: LegacyAssessmentPageProps) {
  const router = useRouter();
  const { role } = use(params);

  useEffect(() => {
    // Pre-populate wizard state with selected role
    const roleId = role.replace('-implementation', '');

    // Set up initial state with this role pre-selected
    saveWizardState({
      selectedRoles: [roleId],
      currentStep: 1,
    });

    // Redirect to Step 1
    router.replace('/assessment/step/1');
  }, [role, router]);

  return (
    <div className="min-h-screen bg-app-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-menu-h3">Redirecting to new assessment flow...</p>
        <p className="text-menu-h4 text-sm mt-2">Your role selection ({role}) has been preserved.</p>
      </div>
    </div>
  );
}
