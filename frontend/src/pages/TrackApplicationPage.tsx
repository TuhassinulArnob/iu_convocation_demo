import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, CheckCircle2, Clock, AlertTriangle, 
  Copy, Printer, ArrowLeft, LogIn, ShieldAlert, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { PageHero } from '../components/PageHero';

export const TrackApplicationPage: React.FC = () => {
  const [appIdInput, setAppIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = appIdInput.trim();
    if (!cleanId) return;

    setLoading(true);
    setError(null);
    setTrackResult(null);

    try {
      const data = await api.trackApplication(cleanId);
      setTrackResult(data);
    } catch (err: any) {
      setError(err.message || 'Application ID not found. Please verify the ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (trackResult?.app_id) {
      navigator.clipboard.writeText(trackResult.app_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const quickDemoIds = ['IU27-DEMO-000101', 'IU27-DEMO-000102'];

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Banner matching Original IU Design */}
      <PageHero
        title="Track Your Application"
        description="Enter your demonstration application ID to view the current application status."
        eyebrow="5TH CONVOCATION 2027"
        className="no-print"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Tracking Input Card */}
        <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 sm:p-8 mb-8 no-print">
          <form onSubmit={handleSearch} className="space-y-4">
            <label className="block text-sm font-bold text-teal-dark">
              Demonstration Application ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. IU27-DEMO-000101"
                  value={appIdInput}
                  onChange={(e) => setAppIdInput(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-teal-deep"
                  required
                />
                <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl text-sm transition shrink-0 disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Tracking...' : 'Track Application'}
              </button>
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className="font-semibold text-stone-600">Quick Demo IDs:</span>
              {quickDemoIds.map(id => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAppIdInput(id)}
                  className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-teal-50 hover:text-teal-deep font-mono text-[11px] font-medium border border-stone-200 transition"
                >
                  {id}
                </button>
              ))}
            </div>
          </form>

          {/* Privacy Note */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
            <ShieldAlert className="w-4 h-4 text-teal-secondary shrink-0" />
            <span>
              <strong>Privacy Protection:</strong> Personal contact info, full address, and sensitive student records are withheld on this public tracking page.
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-center gap-3 mb-8">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong>Lookup Failed:</strong> {error}
            </div>
          </div>
        )}

        {/* Tracking Results Card */}
        {trackResult && (
          <div className="bg-white rounded-2xl border border-iu-border shadow-md overflow-hidden">
            
            {/* Header with App ID and Status */}
            <div className="bg-teal-dark text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-gold-warm font-bold">
                  APPLICATION STATUS TRACKER
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-2xl font-black font-mono tracking-tight text-white">
                    {trackResult.app_id}
                  </h2>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition no-print"
                    title="Copy Application ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copied && <span className="text-xs text-emerald-300 font-semibold no-print">Copied!</span>}
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                <span className={`inline-block px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wide border ${
                  trackResult.status.includes('Approved')
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : trackResult.status.includes('Rejected')
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}>
                  {trackResult.status}
                </span>
              </div>
            </div>

            {/* Academic & Application Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-stone-50/70 border-b border-iu-border text-xs">
              <div>
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">Department</span>
                <span className="font-bold text-teal-dark text-xs sm:text-sm line-clamp-1">{trackResult.department}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">Degree Level</span>
                <span className="font-bold text-teal-dark text-xs sm:text-sm">{trackResult.degree_level}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">Payment Status</span>
                <span className={`font-extrabold text-xs sm:text-sm ${
                  trackResult.payment_status === 'DEMO SUCCESS' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {trackResult.payment_status}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">Last Updated</span>
                <span className="font-bold text-stone-700 text-xs sm:text-sm">{trackResult.last_status_update}</span>
              </div>
            </div>

            {/* Correction Required Notice if applicable */}
            {(trackResult.status?.toLowerCase().includes('correct') || trackResult.review_note?.toLowerCase().includes('correct')) && (
              <div className="p-5 bg-amber-50 border-b border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Correction Required by Convocation Committee</span>
                  </div>
                  <p className="text-amber-900 leading-relaxed">
                    {trackResult.review_note || "Your application requires correction. Please sign in to your student dashboard to update the requested information."}
                  </p>
                </div>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In & Edit Application</span>
                </Link>
              </div>
            )}

            {/* Visual Timeline Section */}
            <div className="p-6 sm:p-8">
              <h3 className="text-sm font-bold text-teal-dark uppercase tracking-wider mb-6">
                Progress Timeline
              </h3>

              <div className="relative border-l-2 border-stone-200 ml-4 pl-6 space-y-6">
                {trackResult.timeline?.map((step: any) => {
                  const isCompleted = step.status === 'completed';
                  const isActive = step.status === 'active';
                  const isFailed = step.status === 'failed';

                  return (
                    <div key={step.step} className="relative">
                      {/* Timeline icon */}
                      <div className={`absolute -left-[33px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        isCompleted
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : isActive
                          ? 'border-teal-deep bg-teal-50'
                          : isFailed
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : 'border-stone-300 bg-white'
                      }`}>
                        {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-teal-deep animate-ping" />}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className={`text-sm font-bold ${
                          isCompleted ? 'text-teal-dark' : isActive ? 'text-teal-deep' : isFailed ? 'text-rose-700' : 'text-stone-400'
                        }`}>
                          {step.title}
                        </h4>
                        <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md inline-block w-fit ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isActive
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : isFailed
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-100 text-stone-500'
                        }`}>
                          {step.status}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons & Watermark Warning */}
            <div className="p-6 bg-stone-50 border-t border-iu-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Tracking Summary</span>
                </button>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-deep text-white hover:bg-teal-hover text-xs font-semibold transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In for Full Details</span>
                </Link>
              </div>

              <span className="text-[11px] text-stone-400 italic text-center sm:text-right">
                Demonstration tracking simulator · No official verification implied.
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
