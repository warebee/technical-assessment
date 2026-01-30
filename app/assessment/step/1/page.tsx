"use client";

import AssessmentNav from "../../components/AssessmentNav";
import { getAvailableRoles, getMultipleRolesInfo } from "@/lib/roles";
import {
  completeStep,
  loadWizardState,
  resetWizardState,
  saveWizardState,
} from "@/lib/wizard-state";
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function Step1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [timerMode, setTimerMode] = useState<"none" | 30 | 60 | 90>("none");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    roles?: string;
  }>({});
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isDirectMode, setIsDirectMode] = useState(false);

  // Get available roles from forms directory (memoized to prevent infinite loops)
  const availableRoles = useMemo(() => getAvailableRoles(), []);
  const validRoleIds = useMemo(() => availableRoles.map((r) => r.id), [availableRoles]);

  // Load existing state on mount - ALWAYS load candidate info
  useEffect(() => {
    const state = loadWizardState();
    if (state) {
      // ALWAYS restore candidate name/email if they exist
      if (state.candidateName) setCandidateName(state.candidateName);
      if (state.candidateEmail) setCandidateEmail(state.candidateEmail);
    }
  }, []);

  // Check for URL params on mount
  useEffect(() => {
    const roleParam = searchParams.get("role") || searchParams.get("roles");
    const timerParam = searchParams.get("timer");

    if (roleParam) {
      // Parse roles from URL (comma-separated)
      const urlRoles = roleParam.split(",").map((r) => r.trim().toLowerCase());
      const validUrlRoles = urlRoles.filter((r) => validRoleIds.includes(r));

      if (validUrlRoles.length > 0) {
        setSelectedRoles(validUrlRoles);
        setIsDirectMode(true);

        // Parse timer if provided
        if (timerParam) {
          const timerValue = parseInt(timerParam, 10);
          if ([30, 60, 90].includes(timerValue)) {
            setTimerMode(timerValue as 30 | 60 | 90);
          }
        }
      }
    } else {
      // No URL params - load roles/timer from saved state
      const state = loadWizardState();
      if (state) {
        if (state.selectedRoles && state.selectedRoles.length > 0)
          setSelectedRoles(state.selectedRoles);
        if (state.timerMode) setTimerMode(state.timerMode);
        if (state.isDirectMode) setIsDirectMode(true);
      }
    }
  }, [searchParams, validRoleIds]);

  // Auto-save state on changes
  useEffect(() => {
    saveWizardState({
      candidateName,
      candidateEmail,
      selectedRoles,
      timerMode,
      isDirectMode,
      currentStep: 1,
    });
  }, [candidateName, candidateEmail, selectedRoles, timerMode, isDirectMode]);

  // Toggle role selection
  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  // Validate and proceed
  const handleContinue = () => {
    const newErrors: typeof errors = {};

    if (!candidateName || candidateName.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!candidateEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Skip role validation in direct mode (roles are set via URL)
    if (!isDirectMode && selectedRoles.length === 0) {
      newErrors.roles = "Please select at least one assessment role";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Mark step 1 as completed
    completeStep(1);

    // Navigate to step 2
    router.push("/assessment/step/2");
  };

  // Handle restart
  const handleRestart = () => {
    resetWizardState();
    setCandidateName("");
    setCandidateEmail("");
    setSelectedRoles([]);
    setTimerMode("none");
    setErrors({});
    setShowRestartConfirm(false);
  };

  // Get combined role info if multiple roles selected
  const multiRoleInfo =
    selectedRoles.length > 0 ? getMultipleRolesInfo(selectedRoles) : null;

  return (
    <div className="min-h-screen bg-app-background">
      {/* Navigation */}
      <AssessmentNav onRestart={() => setShowRestartConfirm(true)} />

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-app-panel rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-menu-h1 mb-2">
              Restart Assessment?
            </h3>
            <p className="text-menu-h3 text-sm mb-4">
              This will clear all your progress and answers. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="px-4 py-2 text-sm text-menu-h3 hover:text-menu-h1 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Candidate Information */}
        <section className="bg-app-panel rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-menu-h1 mb-4">
            Candidate Information
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-menu-h2 mb-1"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={candidateName}
                onChange={(e) => {
                  setCandidateName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                className="w-full px-4 py-2 bg-app-card border border-app-card-border rounded-lg text-menu-text focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-menu-h2 mb-1"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={candidateEmail}
                onChange={(e) => {
                  setCandidateEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className="w-full px-4 py-2 bg-app-card border border-app-card-border rounded-lg text-menu-text focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Role Selection - hidden in direct mode */}
        {!isDirectMode && (
          <section className="bg-app-panel rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-menu-h1 mb-2">
              Select Assessment Level(s) *
            </h2>
            <p className="text-menu-h3 text-sm mb-4">
              You can select multiple levels to complete in one session.
            </p>

            {errors.roles && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-400">{errors.roles}</p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {availableRoles.map((role) => {
                const isSelected = selectedRoles.includes(role.id);

                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      toggleRole(role.id);
                      if (errors.roles)
                        setErrors({ ...errors, roles: undefined });
                    }}
                    className={`
                      p-4 rounded-lg border-2 text-left transition
                      ${
                        isSelected
                          ? "border-brand bg-brand/10"
                          : "border-app-card-border hover:border-brand/50 bg-app-card"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-menu-h1">
                        {role.title.replace(
                          " Implementation Role Assessment",
                          "",
                        )}
                      </h3>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-brand flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-menu-h3 mb-1">
                      Experience: {role.experience}
                    </p>
                    <p className="text-xs text-menu-h3 mb-1">
                      Target: {role.targetScore}
                    </p>
                    <p className="text-xs text-menu-h4">
                      Time: {role.estimatedTime}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Combined time estimate */}
            {multiRoleInfo && selectedRoles.length > 1 && (
              <div className="mt-4 p-4 bg-app-card rounded-lg border border-brand/30">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-brand" />
                  <span className="text-menu-h2">
                    Combined estimated time:{" "}
                    <span className="font-semibold text-brand">
                      {multiRoleInfo.totalEstimatedTime}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Timer Mode - hidden in direct mode */}
        {!isDirectMode && (
          <section className="bg-app-panel rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-menu-h1 mb-2">
              Timer Mode (Optional)
            </h2>
            <p className="text-menu-h3 text-sm mb-4">
              Add a time limit for bonus points. The timer starts when you begin
              answering questions.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  value: "none" as const,
                  label: "No Timer",
                  desc: "Take your time",
                },
                { value: 30 as const, label: "30 Minutes", desc: "+5 bonus" },
                { value: 60 as const, label: "60 Minutes", desc: "+3 bonus" },
                { value: 90 as const, label: "90 Minutes", desc: "+2 bonus" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimerMode(option.value)}
                  className={`
                    p-3 rounded-lg border-2 text-center transition
                    ${
                      timerMode === option.value
                        ? "border-brand bg-brand/10"
                        : "border-app-card-border hover:border-brand/50 bg-app-card"
                    }
                  `}
                >
                  <div className="font-semibold text-menu-h1 text-sm">
                    {option.label}
                  </div>
                  <div className="text-xs text-menu-h4 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Direct Mode Info */}
        {isDirectMode && (
          <section className="bg-app-panel rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-menu-h1 mb-2">
              Assessment Configuration
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-menu-h3">
                <span className="text-menu-h2 font-medium">Level(s):</span>{" "}
                {selectedRoles
                  .map((r) => availableRoles.find((ar) => ar.id === r)?.title?.replace(" Implementation Role Assessment", "") || r)
                  .join(", ")}
              </p>
              <p className="text-menu-h3">
                <span className="text-menu-h2 font-medium">Timer:</span>{" "}
                {timerMode === "none" ? "No Timer" : `${timerMode} Minutes`}
              </p>
            </div>
          </section>
        )}

        {/* Assessment Overview */}
        <section className="bg-app-panel rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-menu-h1 mb-4">
            What to Expect
          </h2>

          <div className="space-y-4 text-menu-h3 text-sm">
            <div>
              <h3 className="font-semibold text-menu-h2 mb-1">
                Step 2: Dataset Review
              </h3>
              <p>
                You'll review the SQL schemas and sample data for 3 tables:
                events, item_set, and assignment. You can download CSV files for
                reference.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-menu-h2 mb-1">
                Step 3: Questions
              </h3>
              <p>
                Answer SQL and data analysis questions. Your progress is
                auto-saved after each answer, so you can safely refresh the page
                without losing work.
              </p>
            </div>

            <div className="pt-4 border-t border-app-card-border">
              <h3 className="font-semibold text-menu-h2 mb-2">Tips:</h3>
              <ul className="list-disc list-inside space-y-1 text-menu-h4">
                <li>Write clean, well-formatted SQL queries</li>
                <li>Add comments to explain your reasoning</li>
                <li>Test your queries mentally against the sample data</li>
                <li>
                  Take breaks if needed - your progress is saved automatically
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            className="px-6 py-3 bg-brand hover:bg-brand-hover text-menu-active-text font-semibold rounded-lg transition flex items-center gap-2"
          >
            Continue to Datasets
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}

export default function Step1Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-app-background" />}>
      <Step1Content />
    </Suspense>
  );
}
