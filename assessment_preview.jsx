import { useState } from 'react';
import { User, Database, FileText, Send, Download, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

// Simplified preview of the SQL Assessment App
export default function AssessmentPreview() {
  const [activeTab, setActiveTab] = useState('info');
  const [started, setStarted] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState({ name: '', email: '', timeLimit: 'no_limit' });
  const [currentSection, setCurrentSection] = useState('A');
  const [answers, setAnswers] = useState({});

  const sections = [
    { id: 'A', title: 'Data Understanding', points: 15 },
    { id: 'B', title: 'Basic SQL & Joins', points: 25 },
    { id: 'C', title: 'Window Functions', points: 25 },
    { id: 'D', title: 'Full Transformation', points: 20 },
    { id: 'E', title: 'Root Cause Analysis', points: 15 },
  ];

  const sampleQuestions = {
    A: [
      { id: 'A1', title: 'Timestamp Analysis', points: 5, type: 'text' },
      { id: 'A2', title: 'Scan Code Structure', points: 5, type: 'text' },
      { id: 'A3', title: 'Process Type Mapping', points: 5, type: 'text' },
    ],
    B: [
      { id: 'B1', title: 'Deduplication', points: 5, type: 'sql' },
      { id: 'B2', title: 'Join with Item Master', points: 8, type: 'sql' },
      { id: 'B3', title: 'Location Assignment Lookup', points: 7, type: 'sql' },
      { id: 'B4', title: 'Battery Distribution', points: 5, type: 'sql' },
    ],
  };

  const handleStart = () => {
    if (candidateInfo.name && candidateInfo.email) {
      setStarted(true);
      setActiveTab('datasets');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-sm">
                W
              </div>
              <div>
                <h1 className="font-bold text-sm">SQL Technical Assessment</h1>
                <p className="text-xs text-slate-400">Data Engineering Position</p>
              </div>
            </div>
            
            {started && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">00:05:32</span>
                </div>
                <button className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-medium">
                  <Send className="w-3 h-3" />
                  Submit
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {[
              { id: 'info', label: 'Getting Started', icon: User },
              { id: 'datasets', label: 'Test Datasets', icon: Database },
              { id: 'questions', label: 'Questionnaire', icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => started && setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                } ${!started && tab.id !== 'info' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'info' && (
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Welcome to the Assessment</h2>
              <p className="text-slate-300 text-sm">
                This assessment evaluates your SQL skills, data transformation abilities, and analytical thinking.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                Before You Begin
              </h3>
              <ul className="space-y-1.5 text-slate-300 text-xs">
                <li>• <strong>100 points</strong> total across 5 sections</li>
                <li>• Use <strong>Trino/Presto SQL</strong> syntax</li>
                <li>• Download test datasets from the "Test Datasets" tab</li>
                <li>• Partial credit for demonstrating understanding</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-sm">Your Information</h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={candidateInfo.name}
                  onChange={e => setCandidateInfo(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={candidateInfo.email}
                  onChange={e => setCandidateInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Time Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'no_limit', label: 'Self-paced' },
                    { value: '90', label: '90 minutes' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs ${
                        candidateInfo.timeLimit === opt.value
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={candidateInfo.timeLimit === opt.value}
                        onChange={() => setCandidateInfo(p => ({ ...p, timeLimit: opt.value }))}
                      />
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        candidateInfo.timeLimit === opt.value ? 'border-orange-500 bg-orange-500' : 'border-slate-500'
                      }`} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStart}
                disabled={!candidateInfo.name || !candidateInfo.email}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed font-semibold py-2 rounded text-sm mt-2"
              >
                Start Assessment
              </button>
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Test Datasets</h2>
                <p className="text-slate-400 text-sm">Download and use these to test your queries</p>
              </div>
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded text-sm font-medium">
                <Download className="w-4 h-4" />
                Download SQL
              </button>
            </div>

            <div className="grid gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-2">Sample Event Data</h3>
                <pre className="bg-black/30 rounded p-3 text-xs text-green-400 overflow-x-auto">
{`{
  "event_id": "a726c6c6-7bf6-47f8-8ebb-afc3acf25e1b",
  "time_created": "1769490868295",
  "time_received": "1769490866530",
  "device_serial": "MDMR312817942",
  "inferred_process_type_id": "PICKING",
  "inferred_scancode_label": "location",
  "scan_code": "PKL421303"
}`}
                </pre>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-2">Available Tables</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['events', 'item_set', 'assignment'].map(table => (
                    <div key={table} className="bg-slate-900/50 rounded p-3">
                      <span className="text-orange-400 font-medium text-sm">{table}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('questions')}
                className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-lg text-sm font-medium"
              >
                Continue to Questions <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            {/* Section Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSection(s.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                    currentSection === s.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s.id}: {s.title} ({s.points}pts)
                </button>
              ))}
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">
                Section {currentSection}: {sections.find(s => s.id === currentSection)?.title}
              </h2>

              {(sampleQuestions[currentSection] || sampleQuestions.A).map(q => (
                <div key={q.id} className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                        Q{q.id}
                      </span>
                      <h3 className="font-semibold text-sm mt-1">{q.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400">{q.points} pts</span>
                  </div>
                  <textarea
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-sm font-mono h-24 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                    placeholder={q.type === 'sql' ? '-- Write your SQL query here...' : 'Your answer...'}
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="flex justify-between pt-4">
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                  ← Previous
                </button>
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded text-sm">
                  Next Section →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-500">
          Submissions sent to work@warebee.com • Powered by WareBee
        </div>
      </footer>
    </div>
  );
}
