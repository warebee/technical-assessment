'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadWizardState } from '@/lib/wizard-state';

export default function AssessmentPage() {
  const router = useRouter();

  useEffect(() => {
    const state = loadWizardState();

    if (state && state.currentStep) {
      // Resume where they left off
      router.replace(`/assessment/step/${state.currentStep}`);
    } else {
      // Start from beginning
      router.replace('/assessment/step/1');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-app-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-menu-h3">Redirecting...</p>
      </div>
    </div>
  );
}
