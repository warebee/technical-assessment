"use client";

import { getFormStats, MarkformGroup, ParsedForm } from "@/lib/markform-parser";
import { loadWizardState, resetWizardState } from "@/lib/wizard-state";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Maximize2,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import type { ExtendedGroup, MergedForm } from "../step/3/Step3Client";
import AssessmentNav from "./AssessmentNav";
import FormField from "./FormField";

interface AssessmentFormProps {
  form: ParsedForm | MergedForm;
  selectedRoles: string[];
}

// Role badge colors
const ROLE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  junior: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  mid: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  senior: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
};

export default function AssessmentForm({
  form,
  selectedRoles,
}: AssessmentFormProps) {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // UI State
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "focus">("list");
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Timer and auto-save
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate Zod schema dynamically from form fields
  const schema = generateFormSchema(form);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const stats = getFormStats(form);

  // Filter out candidate_info group since we collected that in Step 1
  const filteredGroups = useMemo(
    () => form.groups.filter((g) => g.id !== "candidate_info"),
    [form.groups],
  );

  const allFields = filteredGroups.flatMap((g) => g.fields);
  const currentGroup = filteredGroups[currentGroupIndex] || filteredGroups[0];

  // Get candidate info from wizard state
  const [candidateInfo, setCandidateInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const state = loadWizardState();
    if (state) {
      setCandidateInfo({
        name: state.candidateName || "",
        email: state.candidateEmail || "",
      });
    }
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `assessment_${selectedRoles.sort().join("_")}`;
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.formData) {
            Object.entries(state.formData).forEach(([key, value]) => {
              setValue(key as any, value as any);
            });
          }
          if (state.startTime) setStartTime(state.startTime);
          if (state.currentGroupIndex !== undefined)
            setCurrentGroupIndex(state.currentGroupIndex);
          if (state.viewMode) setViewMode(state.viewMode);
          if (state.currentFieldIndex !== undefined)
            setCurrentFieldIndex(state.currentFieldIndex);
          if (state.sidebarCollapsed !== undefined)
            setSidebarCollapsed(state.sidebarCollapsed);
        } catch (e) {
          console.error("Failed to load saved state:", e);
        }
      }
      // Start timer if not already started
      if (!startTime) {
        setStartTime(Date.now());
      }
      setIsLoaded(true);
    }
  }, [selectedRoles, setValue, startTime]);

  // Watch form data using optimized useWatch
  const formData = useWatch({ control: control as any }) || {};

  // Storage key for multi-role support
  const storageKey = useMemo(
    () => `assessment_${selectedRoles.sort().join("_")}`,
    [selectedRoles],
  );

  // Restart confirmation state
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Handle restart - clear all progress and start fresh
  const handleRestart = useCallback(() => {
    if (typeof window !== "undefined") {
      // Clear localStorage for this assessment
      localStorage.removeItem(storageKey);
      // Clear wizard state
      resetWizardState();
      // Navigate to step 1
      router.push("/assessment/step/1");
    }
  }, [storageKey, router]);

  // Debounced save function
  const debouncedSave = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (data: any) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(data));
          setLastSaved(new Date());
        }
      }, 500);
    };
  }, [storageKey]);

  // Save state to localStorage with debouncing
  useEffect(() => {
    if (isLoaded && !submitStatus.type) {
      const stateToSave = {
        formData,
        startTime,
        currentGroupIndex,
        viewMode,
        currentFieldIndex,
        sidebarCollapsed,
      };
      debouncedSave(stateToSave);
    }
  }, [
    formData,
    startTime,
    currentGroupIndex,
    viewMode,
    currentFieldIndex,
    sidebarCollapsed,
    isLoaded,
    submitStatus.type,
    debouncedSave,
  ]);

  // Timer
  useEffect(() => {
    if (startTime && !submitStatus.type) {
      const timer = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, submitStatus.type]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Memoized progress calculation
  const { progress, answeredCount } = useMemo(() => {
    const totalFields = allFields.length;
    if (totalFields === 0) return { progress: 0, answeredCount: 0 };
    const answeredFields = allFields.filter((field) => {
      const value = formData[field.id as keyof typeof formData];
      if (Array.isArray(value)) return value.length > 0;
      return value && String(value).trim().length > 0;
    }).length;
    return {
      progress: Math.round((answeredFields / totalFields) * 100),
      answeredCount: answeredFields,
    };
  }, [allFields, formData]);

  // Memoized group progress calculation
  const groupProgress = useMemo(() => {
    return filteredGroups.map((group) => {
      const answered = group.fields.filter((field) => {
        const value = formData[field.id as keyof typeof formData];
        if (Array.isArray(value)) return value.length > 0;
        return value && String(value).trim().length > 0;
      }).length;
      return { answered, total: group.fields.length };
    });
  }, [filteredGroups, formData]);

  const getGroupProgress = useCallback(
    (groupIndex: number) =>
      groupProgress[groupIndex] || { answered: 0, total: 0 },
    [groupProgress],
  );

  const onSubmit = async (data: FormData) => {
    console.log("[AssessmentForm] onSubmit called", { data, candidateInfo, selectedRoles });

    try {
      setSubmitStatus({ type: null, message: "" });

      // Check if we have candidate info from wizard state
      if (!candidateInfo?.name || !candidateInfo?.email) {
        console.error("[AssessmentForm] Missing candidate info", candidateInfo);
        throw new Error(
          "Missing candidate information. Please go back to Step 1.",
        );
      }

      console.log("[AssessmentForm] Sending request to /api/assessment/submit");
      const response = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roles: selectedRoles,
          candidate: {
            name: candidateInfo.name,
            email: candidateInfo.email,
          },
          answers: data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Submission failed");
      }

      setSubmitStatus({
        type: "success",
        message:
          "Assessment submitted successfully! Results have been emailed to the evaluation team.",
      });

      // Clear localStorage
      localStorage.removeItem(storageKey);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitStatus({
        type: "error",
        message:
          "Failed to submit assessment. Please try again or contact support.",
      });
    }
  };

  // Handle focus mode navigation with batched updates
  const goToPreviousField = useCallback(() => {
    if (currentFieldIndex > 0) {
      startTransition(() => {
        setCurrentFieldIndex(currentFieldIndex - 1);
        // Update current group if needed
        let fieldCount = 0;
        for (let i = 0; i < filteredGroups.length; i++) {
          if (
            fieldCount + filteredGroups[i].fields.length >
            currentFieldIndex - 1
          ) {
            setCurrentGroupIndex(i);
            break;
          }
          fieldCount += filteredGroups[i].fields.length;
        }
      });
    }
  }, [currentFieldIndex, filteredGroups]);

  const goToNextField = useCallback(() => {
    if (currentFieldIndex < allFields.length - 1) {
      startTransition(() => {
        setCurrentFieldIndex(currentFieldIndex + 1);
        // Update current group if needed
        let fieldCount = 0;
        for (let i = 0; i < filteredGroups.length; i++) {
          if (
            fieldCount + filteredGroups[i].fields.length >
            currentFieldIndex + 1
          ) {
            setCurrentGroupIndex(i);
            break;
          }
          fieldCount += filteredGroups[i].fields.length;
        }
      });
    }
  }, [currentFieldIndex, allFields.length, filteredGroups]);

  const currentField = allFields[currentFieldIndex];

  // Get group's roles (for MergedForm with role badges)
  // NOTE: This hook must be called before any early returns
  const getGroupRoles = useCallback(
    (group: MarkformGroup): string[] => {
      return (group as ExtendedGroup).roles || selectedRoles;
    },
    [selectedRoles],
  );

  // Focus mode: show/hide question context
  const [showFocusContext, setShowFocusContext] = useState(true);

  if (submitStatus.type === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-menu-h1">
            Assessment Submitted!
          </h1>
          <p className="text-menu-h3 mb-6">
            Thank you, {candidateInfo?.name || ""}. Your responses have been
            sent to the team.
          </p>
          <div className="bg-app-card rounded-xl p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-menu-h4">Time taken</span>
              <span className="font-mono text-menu-text">
                {formatTime(elapsed)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-menu-h4">Questions answered</span>
              <span className="text-menu-text">{progress}%</span>
            </div>
          </div>
          <p className="mt-6 text-sm text-menu-h5">
            We'll review your submission and get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-screen overflow-hidden h-screen flex flex-col">
      {/* Navigation Header - Hidden in focus mode */}
      {viewMode === "list" && (
        <AssessmentNav
          showTimer={true}
          showProgress={true}
          answeredCount={answeredCount}
          totalCount={allFields.length}
          onRestart={() => setShowRestartConfirm(true)}
        />
      )}

      {/* Assessment Toolbar - Hidden in focus mode */}
      {viewMode === "list" && (
        <div className="sticky top-[103px] z-40 bg-app-panel/80 backdrop-blur shadow-xl">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedRoles.map((role) => (
                  <span
                    key={role}
                    className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[role]?.bg || "bg-gray-500/20"} ${ROLE_COLORS[role]?.text || "text-gray-400"}`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                ))}
                <span className="text-sm text-menu-h4 ml-2">
                  Target: {form.metadata.targetScore}
                </span>
                {lastSaved && (
                  <div className="flex items-center gap-2 text-xs text-green-400 ml-4">
                    <CheckCircle className="w-3 h-3" />
                    <span>Auto-saved</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-menu-text">
                  <Clock className="w-4 h-4 text-menu-h4" />
                  <span className="font-mono">{formatTime(elapsed)}</span>
                </div>
                <div className="text-sm text-menu-text">
                  <span className="text-brand font-medium">{progress}%</span>
                </div>
                <button
                  onClick={() => {
                    setViewMode("focus");
                    setSidebarCollapsed(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-menu-text rounded-lg transition hover:bg-menu-secondary text-sm"
                  title="Focus Mode"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Focus</span>
                </button>
                <button
                  onClick={handleSubmit(
                    onSubmit,
                    (validationErrors) => {
                      console.error("[AssessmentForm] Validation errors:", validationErrors);
                      alert("Form validation failed. Check console for details.");
                    }
                  )}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-brand hover:bg-brand/80 disabled:bg-menu-h5/50 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-medium transition text-menu-active-text"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-app-card border border-app-header-divide rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <RotateCcw className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-menu-h1">
                Start Over?
              </h3>
            </div>
            <p className="text-menu-h3 mb-6">
              This will clear all your progress and answers. You'll need to
              re-enter your information and start the assessment from the
              beginning.
            </p>
            <p className="text-sm text-menu-h4 mb-6">
              Time spent:{" "}
              <span className="font-mono text-menu-h2">
                {formatTime(elapsed)}
              </span>{" "}
              • Progress:{" "}
              <span className="text-brand font-medium">{progress}%</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 px-4 py-3 bg-app-input border border-app-header-divide rounded-xl text-menu-h3 hover:bg-menu-secondary transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-medium transition"
              >
                Yes, Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Hidden in focus mode */}
        {viewMode === "list" && (
          <aside
            className={`
              fixed md:sticky top-[73px] left-0 h-[calc(100vh-73px)] z-40
               
              sidebar-transition
              ${sidebarCollapsed ? "w-[60px] border-r bg-app-panel/5 border-app-header-divide/20 shadow" : "w-[280px] bg-app-panel/30 border-r border-app-header-divide/50"}
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-app-header-divide flex items-center justify-between">
              {!sidebarCollapsed && (
                <h2 className="font-semibold text-menu-h3">Sections</h2>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-menu-secondary rounded transition"
                aria-label={
                  sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Section List */}
            <nav className="flex-1 overflow-y-auto p-2">
              {filteredGroups.map((group, idx) => {
                const { answered, total } = getGroupProgress(idx);
                const isActive = currentGroupIndex === idx;
                const isComplete = answered === total && total > 0;
                const groupRoles = getGroupRoles(group);

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      startTransition(() => {
                        setCurrentGroupIndex(idx);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      });
                    }}
                    className={`
                    w-full rounded-lg mb-2 p-3 text-left transition
                    ${
                      isActive
                        ? "bg-brand/30 shadow"
                        : "hover:bg-menu-secondary border-transparent text-menu-h3"
                    }
                  `}
                  >
                    {sidebarCollapsed ? (
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-lg">{idx + 1}</span>
                        <span className="text-xs">
                          {answered}/{total}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-sm leading-tight">
                            {group.title}
                          </span>
                          {isComplete && (
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          {total > 0 && (
                            <span
                              className={
                                isComplete ? "text-green-400" : "text-menu-h5"
                              }
                            >
                              {answered}/{total} complete
                            </span>
                          )}
                          {/* Role badges */}
                          {selectedRoles.length > 1 && (
                            <div className="flex gap-1">
                              {groupRoles.map((role) => (
                                <span
                                  key={role}
                                  className={`w-2 h-2 rounded-full ${ROLE_COLORS[role]?.bg?.replace("/20", "") || "bg-gray-500"}`}
                                  title={
                                    role.charAt(0).toUpperCase() + role.slice(1)
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Navigation Buttons */}
            <div className="p-2 border-t border-app-header-divide space-y-1 pb-10">
              <button
                onClick={() => {
                  if (currentGroupIndex > 0)
                    setCurrentGroupIndex(currentGroupIndex - 1);
                }}
                disabled={currentGroupIndex === 0}
                className="w-full p-2 rounded bg-app-card hover:bg-menu-secondary disabled:opacity-50 disabled:cursor-not-allowed transition text-menu-h3 text-sm"
              >
                {sidebarCollapsed ? "←" : "← Previous Section"}
              </button>
              <button
                onClick={() => {
                  if (currentGroupIndex < filteredGroups.length - 1)
                    setCurrentGroupIndex(currentGroupIndex + 1);
                }}
                disabled={currentGroupIndex === filteredGroups.length - 1}
                className="w-full p-2 rounded bg-app-card hover:bg-menu-secondary disabled:opacity-50 disabled:cursor-not-allowed transition text-menu-h3 text-sm"
              >
                {sidebarCollapsed ? "→" : "Next Section →"}
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Error Message */}
            {submitStatus.type === "error" && (
              <div className="m-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                <p className="font-medium">{submitStatus.message}</p>
              </div>
            )}

            {/* List View - Fallback when no groups */}
            {viewMode === "list" && !currentGroup && (
              <div className="p-6 max-w-5xl mx-auto">
                <div className="bg-app-card rounded-lg p-8 text-center border border-app-header-divide">
                  <p className="text-menu-h3 mb-4">
                    No assessment sections found.
                  </p>
                  <p className="text-menu-h5 text-sm">
                    The form may not have any questions configured.
                  </p>
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && currentGroup && (
              <div className="p-6 max-w-5xl mx-auto space-y-8">
                {/* Current Group */}
                <div>
                  {/* Section Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-menu-h1 mb-2">
                        {currentGroup.title}
                      </h2>
                      <div className="flex items-center gap-3">
                        {/* Role badges for this group */}
                        {selectedRoles.length > 1 && (
                          <div className="flex items-center gap-1">
                            {getGroupRoles(currentGroup).map((role) => (
                              <span
                                key={role}
                                className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[role]?.bg || "bg-gray-500/20"} ${ROLE_COLORS[role]?.text || "text-gray-400"} ${ROLE_COLORS[role]?.border || "border-gray-500/30"} border`}
                              >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-menu-h4">
                          {getGroupProgress(currentGroupIndex).answered} of{" "}
                          {getGroupProgress(currentGroupIndex).total} completed
                        </span>
                      </div>
                    </div>
                    {/* Progress ring */}
                    <div className="flex items-center gap-2 bg-app-card px-3 py-2 rounded-lg border border-app-header-divide">
                      <span className="text-2xl font-bold text-brand">
                        {progress}%
                      </span>
                      <span className="text-xs text-menu-h4">complete</span>
                    </div>
                  </div>

                  {/* Group Content (markdown) */}
                  {currentGroup.content && (
                    <div className="question-content bg-app-card rounded-xl p-8 border border-app-header-divide mb-8">
                      <ReactMarkdown
                        components={{
                          code: ({ node, className, children, ...props }) => {
                            // Check if it's a code block (has language class) or inline code
                            const isCodeBlock =
                              className?.includes("language-") ||
                              node?.position?.start?.line !==
                                node?.position?.end?.line;
                            if (!isCodeBlock) {
                              return <code {...props}>{children}</code>;
                            }
                            return (
                              <pre>
                                <code {...props}>{children}</code>
                              </pre>
                            );
                          },
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto rounded-lg border border-app-header-divide">
                              <table {...props} />
                            </div>
                          ),
                        }}
                      >
                        {currentGroup.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Tasks Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-menu-h4 uppercase tracking-wide">
                        Tasks
                      </h3>
                      <div className="flex-1 h-px bg-app-header-divide" />
                      <span className="text-xs text-menu-h5">
                        {currentGroup.fields.length}{" "}
                        {currentGroup.fields.length === 1 ? "task" : "tasks"}
                      </span>
                    </div>

                    {currentGroup.fields.map((field, fieldIndex) => (
                      <div key={field.id} className="task-card p-6">
                        <FormField
                          field={field}
                          register={register}
                          setValue={setValue}
                          error={errors[field.id as keyof FormData] as any}
                          value={watch(field.id as any) as string}
                          commentValue={
                            watch(`${field.id}_comment` as any) as string
                          }
                          taskNumber={fieldIndex + 1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Focus View - Fallback when no fields */}
            {viewMode === "focus" && !currentField && (
              <div className="flex flex-col h-screen bg-app-background items-center justify-center">
                <div className="text-center">
                  <p className="text-menu-h3 mb-4">No questions available.</p>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className="px-4 py-2 bg-brand hover:bg-brand-hover text-black rounded-lg font-medium"
                  >
                    Switch to List View
                  </button>
                </div>
              </div>
            )}

            {/* Focus View - Simplified, distraction-free */}
            {viewMode === "focus" && currentField && (
              <div className="flex flex-col h-screen bg-app-background">
                {/* Minimal Top Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-app-header-divide bg-app-panel/50">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-menu-h3">
                      Question {currentFieldIndex + 1} / {allFields.length}
                    </span>
                    <div className="w-32 h-1.5 bg-app-input rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand transition-all duration-300"
                        style={{
                          width: `${((currentFieldIndex + 1) / allFields.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {lastSaved && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Saved
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className="p-2 hover:bg-menu-secondary rounded-lg transition text-menu-h4 hover:text-menu-h2"
                      title="Exit Focus Mode"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Field Content - Centered */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-4xl mx-auto px-6 py-8">
                    {/* Section Title */}
                    <p className="text-xs text-menu-h5 uppercase tracking-wide mb-1">
                      {currentGroup?.title}
                    </p>

                    {/* Question Context - Collapsible */}
                    {currentGroup?.content && (
                      <div className="focus-context mb-6">
                        <div className="focus-context-header">
                          <span className="focus-context-title">
                            Question Context
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setShowFocusContext(!showFocusContext)
                            }
                            className="focus-context-toggle"
                          >
                            {showFocusContext ? (
                              <>
                                <ChevronLeft className="w-3 h-3 rotate-90" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-3 h-3 rotate-90" />
                                Show
                              </>
                            )}
                          </button>
                        </div>
                        {showFocusContext && (
                          <div className="question-compact">
                            <ReactMarkdown
                              components={{
                                code: ({
                                  node,
                                  className,
                                  children,
                                  ...props
                                }) => {
                                  const isCodeBlock =
                                    className?.includes("language-") ||
                                    node?.position?.start?.line !==
                                      node?.position?.end?.line;
                                  if (!isCodeBlock) {
                                    return <code {...props}>{children}</code>;
                                  }
                                  return (
                                    <pre>
                                      <code {...props}>{children}</code>
                                    </pre>
                                  );
                                },
                                table: ({ node, ...props }) => (
                                  <div className="overflow-x-auto rounded-lg border border-app-header-divide">
                                    <table {...props} />
                                  </div>
                                ),
                              }}
                            >
                              {currentGroup.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Task Card */}
                    <div className="focus-task-card">
                      <FormField
                        field={currentField}
                        register={register}
                        setValue={setValue}
                        error={errors[currentField.id as keyof FormData] as any}
                        value={watch(currentField.id as any) as string}
                        commentValue={
                          watch(`${currentField.id}_comment` as any) as string
                        }
                        taskNumber={
                          currentFieldIndex +
                          1 -
                          filteredGroups
                            .slice(0, currentGroupIndex)
                            .reduce((acc, g) => acc + g.fields.length, 0)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation Footer - Floating */}
                <div className="sticky bottom-0 bg-app-card/10 pt-4 pb-4 px-6">
                  <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={goToPreviousField}
                      disabled={currentFieldIndex === 0}
                      className="flex items-center gap-2 px-5 py-2 bg-app-card hover:bg-menu-secondary disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition text-menu-h3 border border-app-header-divide"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {watch(currentField.id as any) ? (
                        <span className="text-green-400 flex items-center gap-1.5 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Answered
                        </span>
                      ) : (
                        <span className="text-menu-h5 text-sm">
                          Not answered yet
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={goToNextField}
                      disabled={currentFieldIndex === allFields.length - 1}
                      className="flex items-center gap-2 px-5 py-3 bg-brand hover:bg-brand/80 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition text-menu-active-text font-medium shadow-lg shadow-brand/20"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}

/**
 * Generate Zod schema dynamically from form structure
 */
function generateFormSchema(form: ParsedForm): z.ZodObject<any> {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  // Filter out candidate_info group since it's collected in Step 1
  const filteredGroups = form.groups.filter((g) => g.id !== "candidate_info");

  for (const group of filteredGroups) {
    for (const field of group.fields) {
      let fieldSchema: z.ZodTypeAny;

      // Base schema based on field kind
      // All fields are optional by default, coercing undefined to empty values
      switch (field.kind) {
        case "string":
          // Allow undefined/null and coerce to string
          // Note: maxLength is used as a UI hint only, not for validation
          // SQL queries can be lengthy, so we don't enforce limits on submission
          fieldSchema = z.string().optional().default("");
          break;

        case "checkboxes":
          fieldSchema = z.array(z.string()).optional().default([]);
          break;

        case "single_select":
          fieldSchema = z.string().optional().default("");
          break;

        case "number":
          fieldSchema = z.number().optional();
          break;

        default:
          fieldSchema = z.string().optional().default("");
      }

      schemaFields[field.id] = fieldSchema;
    }
  }

  return z.object(schemaFields);
}
