"use client";

import {
  canAccessStep,
  isStepCompleted,
  loadWizardState,
} from "@/lib/wizard-state";
import { Clock, RefreshCcw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AssessmentNavProps {
  onRestart?: () => void;
  showTimer?: boolean;
  showProgress?: boolean;
  answeredCount?: number;
  totalCount?: number;
}

const STEPS = [
  { number: 1, label: "Getting Started", path: "/assessment/step/1" },
  { number: 2, label: "Test Datasets", path: "/assessment/step/2" },
  { number: 3, label: "Questionnaire", path: "/assessment/step/3" },
];

export default function AssessmentNav({
  onRestart,
  showTimer = false,
  showProgress = false,
  answeredCount = 0,
  totalCount = 0,
}: AssessmentNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [timerDisplay, setTimerDisplay] = useState<string | null>(null);
  const [timerMode, setTimerMode] = useState<"none" | 30 | 60 | 90>("none");
  const [startTime, setStartTime] = useState<number | null>(null);

  // Load timer state
  useEffect(() => {
    const state = loadWizardState();
    if (state) {
      setTimerMode(state.timerMode);
      setStartTime(state.startTime);
    }
  }, []);

  // Update timer display
  useEffect(() => {
    if (!showTimer || timerMode === "none" || !startTime) {
      setTimerDisplay(null);
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const limitSeconds = timerMode * 60;
      const remaining = limitSeconds - elapsed;

      if (remaining <= 0) {
        setTimerDisplay("00:00");
        return;
      }

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      setTimerDisplay(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [showTimer, timerMode, startTime]);

  // Determine current step from pathname
  const currentStep = STEPS.find((s) => pathname === s.path)?.number || 1;

  // Handle tab navigation
  const handleTabClick = (step: (typeof STEPS)[0]) => {
    // Allow navigation to current step or completed/accessible steps
    if (step.number === currentStep) return;

    if (canAccessStep(step.number)) {
      router.push(step.path);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-app-header">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top row: Title and timer/progress */}
        <div className="flex items-center justify-between py-3">
          <h1 className="text-xl font-bold text-menu-h1">
            Technical Assessment
          </h1>

          <div className="flex items-center gap-4">
            {/* Timer display */}
            {showTimer && timerDisplay && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  timerDisplay === "00:00"
                    ? "bg-red-900/30 text-red-400"
                    : parseInt(timerDisplay.split(":")[0]) < 5
                      ? "bg-yellow-900/30 text-yellow-400"
                      : "bg-app-card text-menu-h2"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm font-medium">
                  {timerDisplay}
                </span>
              </div>
            )}

            {/* Progress display */}
            {showProgress && totalCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-card text-menu-h2">
                <span className="text-sm">
                  <span className="font-semibold text-brand">
                    {answeredCount}
                  </span>
                  <span className="text-menu-h4"> / {totalCount}</span>
                </span>
              </div>
            )}

            {/* Restart button */}
            {onRestart && (
              <button
                onClick={onRestart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-menu-h4 hover:text-menu-h2 hover:bg-app-card rounded-lg transition"
                title="Restart assessment"
              >
                <RefreshCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Restart</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 -mb-px">
          {STEPS.map((step) => {
            const isCurrent = step.number === currentStep;
            const isCompleted = isStepCompleted(step.number);
            const isAccessible = canAccessStep(step.number);
            const canClick = isAccessible && !isCurrent;

            return (
              <button
                key={step.number}
                onClick={() => canClick && handleTabClick(step)}
                disabled={!canClick}
                className={`
                  relative px-4 py-3 text-sm font-medium transition-colors
                  ${
                    isCurrent
                      ? "text-brand border-b-2 border-brand"
                      : isCompleted
                        ? "text-menu-h2 hover:text-menu-h1 cursor-pointer"
                        : isAccessible
                          ? "text-menu-h3 hover:text-menu-h2 cursor-pointer"
                          : "text-menu-h5 cursor-not-allowed"
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs
                      ${
                        isCurrent
                          ? "bg-menu-active text-menu-active-text"
                          : isCompleted
                            ? "bg-green-600 text-white"
                            : "bg-app-card text-menu-h4"
                      }
                    `}
                  >
                    {isCompleted && !isCurrent ? "✓" : step.number}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
