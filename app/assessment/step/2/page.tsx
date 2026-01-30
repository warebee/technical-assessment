"use client";

import AssessmentNav from "../../components/AssessmentNav";
import {
  downloadCSV,
  generateDatasetCSV,
  getAvailableDatasets,
} from "@/lib/csv-generator";
import { testDatasetsSQL } from "@/lib/datasets";
import {
  canAccessStep,
  completeStep,
  loadWizardState,
  resetWizardState,
  saveWizardState,
} from "@/lib/wizard-state";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Step2Page() {
  const router = useRouter();
  const [datasetsViewed, setDatasetsViewed] = useState<string[]>([]);
  const [datasetsDownloaded, setDatasetsDownloaded] = useState<string[]>([]);
  const [expandedDatasets, setExpandedDatasets] = useState<string[]>([]);
  const [showSQLSchema, setShowSQLSchema] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const datasets = getAvailableDatasets();

  // Check access and load state on mount
  useEffect(() => {
    // Check if user can access step 2
    if (!canAccessStep(2)) {
      router.replace("/assessment/step/1");
      return;
    }

    // Load wizard state
    const state = loadWizardState();
    if (state) {
      if (state.datasetsViewed) setDatasetsViewed(state.datasetsViewed);
      if (state.datasetsDownloaded)
        setDatasetsDownloaded(state.datasetsDownloaded);
    }
  }, [router]);

  // Auto-save state on changes
  useEffect(() => {
    saveWizardState({
      datasetsViewed,
      datasetsDownloaded,
      currentStep: 2,
    });
  }, [datasetsViewed, datasetsDownloaded]);

  // Handle restart
  const handleRestart = () => {
    resetWizardState();
    setShowRestartConfirm(false);
    router.push("/assessment/step/1");
  };

  // Toggle dataset expansion and mark as viewed
  const toggleDataset = (datasetName: string) => {
    if (expandedDatasets.includes(datasetName)) {
      setExpandedDatasets(expandedDatasets.filter((d) => d !== datasetName));
    } else {
      setExpandedDatasets([...expandedDatasets, datasetName]);
      // Mark as viewed when expanded
      if (!datasetsViewed.includes(datasetName)) {
        setDatasetsViewed([...datasetsViewed, datasetName]);
      }
    }
  };

  // Handle CSV download
  const handleDownload = (datasetName: string) => {
    try {
      const csv = generateDatasetCSV(datasetName);
      downloadCSV(`${datasetName}.csv`, csv);

      // Mark as downloaded
      if (!datasetsDownloaded.includes(datasetName)) {
        setDatasetsDownloaded([...datasetsDownloaded, datasetName]);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download CSV. Please try again.");
    }
  };

  // Calculate completion
  const allViewed = datasetsViewed.length === datasets.length;
  const someDownloaded = datasetsDownloaded.length > 0;
  const sqlSchemaViewed = showSQLSchema;

  // Navigation handlers
  const handleBack = () => {
    router.push("/assessment/step/1");
  };

  const handleContinue = () => {
    completeStep(2);
    router.push("/assessment/step/3");
  };

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
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Introduction */}
        <section className="bg-app-panel rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-menu-h1 mb-2">
            Review the Datasets
          </h2>
          <p className="text-menu-h3 text-sm mb-4">
            Before answering questions, familiarize yourself with the data
            schemas and sample rows. You can download CSV files for reference.
          </p>

          {/* Completion Indicator */}
          <div className="flex items-center gap-6 text-sm">
            <div
              className={`flex items-center gap-2 ${allViewed ? "text-green-400" : "text-menu-h4"}`}
            >
              {allViewed && <Eye className="w-4 h-4" />}
              <span>
                Viewed: {datasetsViewed.length}/{datasets.length}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 ${someDownloaded ? "text-brand" : "text-menu-h4"}`}
            >
              {someDownloaded && <Download className="w-4 h-4" />}
              <span>Downloaded: {datasetsDownloaded.length}</span>
            </div>
          </div>
        </section>

        {/* Datasets */}
        {datasets.map((dataset) => {
          const isExpanded = expandedDatasets.includes(dataset.tableName);
          const isViewed = datasetsViewed.includes(dataset.tableName);
          const isDownloaded = datasetsDownloaded.includes(dataset.tableName);

          return (
            <section
              key={dataset.tableName}
              className="bg-app-panel rounded-lg mb-4 overflow-hidden"
            >
              {/* Dataset Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleDataset(dataset.tableName)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDataset(dataset.tableName);
                  }
                }}
                className="w-full p-6 flex items-center justify-between hover:bg-app-card transition text-left cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-menu-h1">
                      {dataset.tableName}
                    </h3>
                    {isViewed && (
                      <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">
                        Viewed
                      </span>
                    )}
                    {isDownloaded && (
                      <span className="text-xs bg-brand/20 text-brand px-2 py-1 rounded">
                        Downloaded
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-menu-h3">{dataset.description}</p>
                  <p className="text-xs text-menu-h4 mt-1">
                    {dataset.columns.length} columns ·{" "}
                    {dataset.sampleRows.length} sample rows
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(dataset.tableName);
                    }}
                    className="px-4 py-2 bg-brand hover:bg-brand-hover text-menu-active-text rounded-lg transition flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-menu-h3" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-menu-h3" />
                  )}
                </div>
              </div>

              {/* Dataset Details */}
              {isExpanded && (
                <div className="border-t border-app-card-border p-6">
                  {/* Schema */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-menu-h2 mb-3">
                      Schema
                    </h4>
                    <div className="bg-app-card rounded-lg p-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-app-card-border">
                            <th className="text-left py-2 pr-8 text-menu-h3 font-medium">
                              Column
                            </th>
                            <th className="text-left py-2 text-menu-h3 font-medium">
                              Type
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataset.columns.map((col, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-app-card-border/30 last:border-0"
                            >
                              <td className="py-2 pr-8 font-mono text-xs text-brand">
                                {col.name}
                              </td>
                              <td className="py-2 text-menu-h4 text-xs">
                                {col.type}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sample Data */}
                  <div>
                    <h4 className="text-sm font-semibold text-menu-h2 mb-3">
                      Sample Data (first 5 rows)
                    </h4>
                    <div className="bg-app-card rounded-lg p-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-app-card-border">
                            {dataset.columns.slice(0, 6).map((col, idx) => (
                              <th
                                key={idx}
                                className="text-left py-2 pr-4 text-menu-h3 font-medium"
                              >
                                {col.name}
                              </th>
                            ))}
                            {dataset.columns.length > 6 && (
                              <th className="text-left py-2 text-menu-h4">
                                ...
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {dataset.sampleRows.slice(0, 5).map((row, rowIdx) => (
                            <tr
                              key={rowIdx}
                              className="border-b border-app-card-border/30 last:border-0"
                            >
                              {row.slice(0, 6).map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="py-2 pr-4 text-menu-h4 font-mono"
                                >
                                  {cell || (
                                    <span className="text-menu-h5">NULL</span>
                                  )}
                                </td>
                              ))}
                              {row.length > 6 && (
                                <td className="py-2 text-menu-h5">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {dataset.columns.length > 6 && (
                        <p className="mt-2 text-xs text-menu-h5">
                          Showing first 6 of {dataset.columns.length} columns.
                          Download CSV for full data.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* Full SQL Schema */}
        <section className="bg-app-panel rounded-lg mb-6 overflow-hidden">
          <button
            onClick={() => {
              setShowSQLSchema(!showSQLSchema);
              if (!showSQLSchema) {
                saveWizardState({
                  datasetsViewed: Array.from(
                    new Set([...datasetsViewed, "sql_schema"]),
                  ),
                });
              }
            }}
            className="w-full p-6 flex items-center justify-between hover:bg-app-card transition text-left"
          >
            <div>
              <h3 className="text-lg font-semibold text-menu-h1">
                Full SQL Schema
              </h3>
              <p className="text-sm text-menu-h3">
                View the complete CREATE TABLE statements
              </p>
            </div>
            {showSQLSchema ? (
              <ChevronUp className="w-5 h-5 text-menu-h3" />
            ) : (
              <ChevronDown className="w-5 h-5 text-menu-h3" />
            )}
          </button>

          {showSQLSchema && (
            <div className="border-t border-app-card-border p-6">
              <pre className="bg-app-card rounded-lg p-4 overflow-x-auto text-xs font-mono text-menu-h3 whitespace-pre-wrap">
                {testDatasetsSQL}
              </pre>
            </div>
          )}
        </section>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-app-card hover:bg-menu-secondary text-menu-text font-semibold rounded-lg transition flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Step 1
          </button>

          <button
            onClick={handleContinue}
            className="px-6 py-3 bg-brand hover:bg-brand-hover text-menu-active-text font-semibold rounded-lg transition flex items-center gap-2"
          >
            Continue to Questions
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
