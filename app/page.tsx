'use client';

import { useState, useEffect } from 'react';
import { User, Database, FileText, Send, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { questions, sections, sampleEventData, activityFeedSchema } from '@/lib/questions';
import { testDatasetsSQL } from '@/lib/datasets';

type Tab = 'info' | 'datasets' | 'questions';

interface CandidateInfo {
  name: string;
  email: string;
  position: string;
  timeLimit: string;
}

interface Answers {
  [key: string]: string;
}

export default function AssessmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    name: '',
    email: '',
    position: '',
    timeLimit: 'no_limit'
  });
  const [answers, setAnswers] = useState<Answers>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState('A');

  // Timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (startTime && !submitted) {
      const timer = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, submitted]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartAssessment = () => {
    if (candidateInfo.name && candidateInfo.email) {
      setStartTime(Date.now());
      setActiveTab('datasets');
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateProgress = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).filter(k => answers[k]?.trim()).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  const downloadDatasets = () => {
    const blob = new Blob([testDatasetsSQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_datasets.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const submission = {
      candidate: candidateInfo,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: new Date().toISOString(),
      totalTimeSeconds: elapsed,
      answers: answers,
      progress: calculateProgress()
    };

    try {
      // Send to API route
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert('Submission failed. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Assessment Submitted!</h1>
          <p className="text-slate-300 mb-6">
            Thank you, {candidateInfo.name}. Your responses have been sent to the WareBee team.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Time taken</span>
              <span className="font-mono">{formatTime(elapsed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Questions answered</span>
              <span>{calculateProgress()}%</span>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            We'll review your submission and get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-warebee-500 rounded-lg flex items-center justify-center font-bold text-white">
                W
              </div>
              <div>
                <h1 className="font-bold text-lg">SQL Technical Assessment</h1>
                <p className="text-sm text-slate-400">Data Engineering Position</p>
              </div>
            </div>
            
            {startTime && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="font-mono">{formatTime(elapsed)}</span>
                </div>
                <div className="text-sm">
                  Progress: <span className="text-warebee-400 font-medium">{calculateProgress()}%</span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'info' as Tab, label: 'Getting Started', icon: User },
              { id: 'datasets' as Tab, label: 'Test Datasets', icon: Database },
              { id: 'questions' as Tab, label: 'Questionnaire', icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!startTime && tab.id !== 'info'}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'info' && (
          <div className="tab-content space-y-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">Welcome to the Assessment</h2>
              <p className="text-slate-300 mb-6">
                This assessment evaluates your SQL skills, data transformation abilities, and analytical thinking.
                You'll work with real IoT event data from warehouse operations.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warebee-400" />
                  Before You Begin
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>• <strong>100 points</strong> total across 5 sections</li>
                  <li>• Use <strong>Trino/Presto SQL</strong> syntax</li>
                  <li>• Download the test datasets from the "Test Datasets" tab</li>
                  <li>• Partial credit given for demonstrating understanding</li>
                  <li>• Comments explaining your approach are encouraged</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Your Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={candidateInfo.name}
                      onChange={e => setCandidateInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-warebee-500"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Email *</label>
                    <input
                      type="email"
                      value={candidateInfo.email}
                      onChange={e => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-warebee-500"
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Position Applied For</label>
                    <input
                      type="text"
                      value={candidateInfo.position}
                      onChange={e => setCandidateInfo(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-warebee-500"
                      placeholder="Data Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Time Preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'no_limit', label: 'Self-paced (no limit)' },
                        { value: '60', label: '60 minutes' },
                        { value: '90', label: '90 minutes' },
                        { value: '120', label: '120 minutes' },
                      ].map(option => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                            candidateInfo.timeLimit === option.value
                              ? 'border-warebee-500 bg-warebee-500/10'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="timeLimit"
                            value={option.value}
                            checked={candidateInfo.timeLimit === option.value}
                            onChange={e => setCandidateInfo(prev => ({ ...prev, timeLimit: e.target.value }))}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            candidateInfo.timeLimit === option.value
                              ? 'border-warebee-500 bg-warebee-500'
                              : 'border-slate-500'
                          }`} />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleStartAssessment}
                    disabled={!candidateInfo.name || !candidateInfo.email}
                    className="w-full bg-warebee-500 hover:bg-warebee-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition mt-4"
                  >
                    Start Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="tab-content space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Test Datasets</h2>
                <p className="text-slate-400 mt-1">Download and use these datasets to test your queries</p>
              </div>
              <button
                onClick={downloadDatasets}
                className="flex items-center gap-2 bg-warebee-500 hover:bg-warebee-600 px-4 py-2 rounded-lg font-medium transition"
              >
                <Download className="w-4 h-4" />
                Download SQL File
              </button>
            </div>

            <div className="grid gap-6">
              {/* Sample Event */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="font-semibold mb-3">Sample Event Data</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Each event represents an IoT scan from warehouse devices. Transform these to the ActivityFeed schema.
                </p>
                <pre className="code-block text-green-400 text-sm overflow-x-auto">
                  {sampleEventData}
                </pre>
              </div>

              {/* Target Schema */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="font-semibold mb-3">Target: ActivityFeed Schema</h3>
                <p className="text-sm text-slate-400 mb-4">
                  This is the target schema you need to transform the events into.
                </p>
                <pre className="code-block text-blue-400 text-sm overflow-x-auto">
                  {activityFeedSchema}
                </pre>
              </div>

              {/* Tables Overview */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="font-semibold mb-3">Available Tables</h3>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-warebee-400">events</h4>
                    <p className="text-sm text-slate-400 mt-1">IoT scan events (22 rows including duplicates)</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-warebee-400">item_set</h4>
                    <p className="text-sm text-slate-400 mt-1">Item master with EAN/SKU/UOM (use latest import_job_id)</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-warebee-400">assignment</h4>
                    <p className="text-sm text-slate-400 mt-1">Location to SKU mappings (use latest import_job_id)</p>
                  </div>
                </div>
              </div>

              {/* Key Transformations */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="font-semibold mb-3">Key Transformation Rules</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="text-warebee-400 font-medium mb-2">Location Format</h4>
                    <code className="text-slate-300">PKL421303 → PKLF 42 13 03</code>
                  </div>
                  <div>
                    <h4 className="text-warebee-400 font-medium mb-2">Timestamps</h4>
                    <code className="text-slate-300">Milliseconds (string) → datetime</code>
                  </div>
                  <div>
                    <h4 className="text-warebee-400 font-medium mb-2">Latest Data</h4>
                    <code className="text-slate-300">WHERE import_job_id = (SELECT MAX(...))</code>
                  </div>
                  <div>
                    <h4 className="text-warebee-400 font-medium mb-2">Job Boundary</h4>
                    <code className="text-slate-300">&gt;5 min gap = new job</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="tab-content">
            {/* Section Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {sections.map(section => {
                const sectionQuestions = questions.filter(q => q.section === section.id);
                const answered = sectionQuestions.filter(q => answers[q.id]?.trim()).length;
                return (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      currentSection === section.id
                        ? 'bg-warebee-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{section.id}: {section.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      answered === sectionQuestions.length ? 'bg-green-500/20 text-green-400' : 'bg-slate-600'
                    }`}>
                      {answered}/{sectionQuestions.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current Section */}
            {sections.filter(s => s.id === currentSection).map(section => (
              <div key={section.id}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Section {section.id}: {section.title}</h2>
                  <p className="text-slate-400 mt-1">{section.points} points • {section.description}</p>
                </div>

                <div className="space-y-8">
                  {questions.filter(q => q.section === section.id).map(question => (
                    <div key={question.id} className="bg-slate-800/50 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-xs font-medium px-2 py-1 bg-warebee-500/20 text-warebee-400 rounded">
                            Q{question.id}
                          </span>
                          <h3 className="text-lg font-semibold mt-2">{question.title}</h3>
                        </div>
                        <span className="text-sm text-slate-400">{question.points} pts</span>
                      </div>

                      <div className="prose prose-invert prose-sm max-w-none mb-4">
                        <pre className="whitespace-pre-wrap text-slate-300 text-sm bg-transparent p-0 font-sans">
                          {question.prompt}
                        </pre>
                      </div>

                      <textarea
                        value={answers[question.id] || ''}
                        onChange={e => handleAnswerChange(question.id, e.target.value)}
                        className={`w-full bg-slate-900 border border-slate-600 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-warebee-500 resize-y ${
                          question.type === 'sql' || question.type === 'sql_analysis' ? 'sql-input h-64' : 'h-40'
                        }`}
                        placeholder={
                          question.type === 'sql' || question.type === 'sql_analysis'
                            ? '-- Write your SQL query here...'
                            : 'Your answer...'
                        }
                      />

                      {question.analysisPrompt && (
                        <div className="mt-4">
                          <label className="block text-sm text-slate-400 mb-2">
                            Analysis: {question.analysisPrompt}
                          </label>
                          <textarea
                            value={answers[`${question.id}_analysis`] || ''}
                            onChange={e => handleAnswerChange(`${question.id}_analysis`, e.target.value)}
                            className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-warebee-500 resize-y"
                            placeholder="Explain your analysis approach..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Section Navigation */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => {
                      const idx = sections.findIndex(s => s.id === currentSection);
                      if (idx > 0) setCurrentSection(sections[idx - 1].id);
                    }}
                    disabled={currentSection === 'A'}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                  >
                    ← Previous Section
                  </button>
                  {currentSection !== 'E' ? (
                    <button
                      onClick={() => {
                        const idx = sections.findIndex(s => s.id === currentSection);
                        if (idx < sections.length - 1) setCurrentSection(sections[idx + 1].id);
                      }}
                      className="px-6 py-2 bg-warebee-500 hover:bg-warebee-600 rounded-lg transition"
                    >
                      Next Section →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded-lg transition"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
