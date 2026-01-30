'use client';

import { CheckCircle } from 'lucide-react';

interface WizardLayoutProps {
  currentStep: 1 | 2 | 3;
  children: React.ReactNode;
  onNext?: () => boolean; // Validation callback, returns true if can proceed
  onPrevious?: () => void;
  showNext?: boolean;
  showPrevious?: boolean;
  nextLabel?: string;
  previousLabel?: string;
}

const steps = [
  { number: 1, name: 'Your Information' },
  { number: 2, name: 'Dataset Reference' },
  { number: 3, name: 'Assessment Questions' },
];

export default function WizardLayout({
  currentStep,
  children,
  onNext,
  onPrevious,
  showNext = true,
  showPrevious = true,
  nextLabel = 'Next',
  previousLabel = 'Previous',
}: WizardLayoutProps) {
  const handleNextClick = () => {
    if (onNext) {
      const canProceed = onNext();
      if (!canProceed) {
        // Validation failed, don't proceed
        return;
      }
    }
  };

  const handlePreviousClick = () => {
    if (onPrevious) {
      onPrevious();
    }
  };

  return (
    <div className="min-h-screen bg-app-main flex flex-col">
      {/* Header with branding */}
      <header className="border-b border-app-header-divide bg-app-header/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center font-bold text-app-header">
              W
            </div>
            <div>
              <h1 className="font-bold text-lg text-menu-h1">
                Implementation Role Assessment
              </h1>
              <p className="text-sm text-menu-h4">
                SQL & Data Analysis Skills Evaluation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Step Progress Indicator */}
      <div className="bg-app-card border-b border-app-header-divide">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between md:justify-center md:gap-12">
              {steps.map((step) => {
                const isCompleted = step.number < currentStep;
                const isCurrent = step.number === currentStep;
                const isUpcoming = step.number > currentStep;

                return (
                  <li key={step.number} className="flex items-center flex-1 md:flex-none">
                    <div className="flex items-center gap-2">
                      {/* Step Circle */}
                      <div
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-full transition
                          ${isCompleted
                            ? 'bg-brand text-menu-active-text'
                            : isCurrent
                            ? 'bg-brand text-menu-active-text ring-4 ring-brand/20'
                            : 'bg-app-input text-menu-h4 border-2 border-app-header-divide'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <span className="font-bold">{step.number}</span>
                        )}
                      </div>

                      {/* Step Name (hidden on mobile) */}
                      <div className="hidden md:block">
                        <p
                          className={`
                            text-sm font-medium
                            ${isCurrent ? 'text-brand' : isCompleted ? 'text-menu-h2' : 'text-menu-h4'}
                          `}
                        >
                          {step.name}
                        </p>
                        <p className="text-xs text-menu-h5">Step {step.number} of 3</p>
                      </div>
                    </div>

                    {/* Connector Line */}
                    {step.number < 3 && (
                      <div className="flex-1 md:flex-none md:w-20 h-0.5 mx-2 md:mx-4">
                        <div
                          className={`
                            h-full transition
                            ${isCompleted ? 'bg-brand' : 'bg-app-header-divide'}
                          `}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Mobile Step Name */}
          <div className="mt-4 text-center md:hidden">
            <p className="text-sm font-medium text-brand">
              {steps[currentStep - 1].name}
            </p>
            <p className="text-xs text-menu-h5">Step {currentStep} of 3</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {children}
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="border-t border-app-header-divide bg-app-card sticky bottom-0">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Previous Button */}
            <div>
              {showPrevious ? (
                <button
                  onClick={handlePreviousClick}
                  className="flex items-center gap-2 px-6 py-3 border border-app-header-divide hover:bg-app-input rounded-lg transition text-menu-h3 font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="hidden sm:inline">{previousLabel}</span>
                </button>
              ) : (
                <div className="w-24" /> // Spacer
              )}
            </div>

            {/* Step Indicator (Mobile) */}
            <div className="text-sm text-menu-h4 font-medium md:hidden">
              {currentStep} / 3
            </div>

            {/* Next Button */}
            <div>
              {showNext ? (
                <button
                  onClick={handleNextClick}
                  className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand/80 rounded-lg transition text-menu-active-text font-medium"
                >
                  <span>{nextLabel}</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ) : (
                <div className="w-24" /> // Spacer
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
