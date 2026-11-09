import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, FileText, ArrowRight, Mail, Download, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { PageHero } from '../components/PageHero';
import { getRegistrationStatus } from '../config/registrationConfig';

export const NoticesPage: React.FC = () => {
  const regStatus = getRegistrationStatus();
  const [notices, setNotices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalNotice, setActiveModalNotice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotices = () => {
    setLoading(true);
    api.getNotices(search, selectedCategory === 'All' ? undefined : selectedCategory)
      .then(data => setNotices(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotices();
  };

  const categories = ['All', 'Registration', 'Guidelines', 'Schedule', 'Demonstration'];

  return (
    <div className="min-h-screen bg-iu-bg pb-16">
      
      {/* Top Hero Banner matching Original IU Design */}
      <PageHero
        title="Notices"
        description="Official announcements and updates"
        eyebrow="5TH CONVOCATION 2027"
      />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Notices List & Search */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search the notices — e.g. payment, photo, list"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-iu-border rounded-xl pl-11 pr-24 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-deep shadow-sm"
              />
              <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                className="absolute right-2 top-2 px-4 py-1.5 bg-teal-deep hover:bg-teal-hover text-white rounded-lg text-xs font-semibold transition"
              >
                Search
              </button>
            </form>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-teal-deep text-white shadow-sm'
                      : 'bg-white text-stone-600 border border-iu-border hover:bg-stone-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Month Header */}
            <div className="pt-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                NOVEMBER 2026
              </span>
            </div>

            {/* Notices List */}
            {loading ? (
              <div className="text-center py-12 text-stone-500 text-sm">
                Loading official notices...
              </div>
            ) : notices.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-iu-border">
                <AlertCircle className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                <h3 className="font-bold text-stone-700">No notices found</h3>
                <p className="text-xs text-stone-500 mt-1">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((n) => {
                  const parts = (n.date || '09 Nov').split(' ');
                  const day = parts[0] || '09';
                  const month = parts[1] || 'NOV';

                  return (
                    <div
                      key={n.id}
                      className="bg-white rounded-2xl p-5 border border-iu-border shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start gap-5"
                    >
                      {/* Date Badge matching Screenshot (444).png */}
                      <div className="bg-stone-100/80 border border-stone-200 rounded-xl px-4 py-3 flex flex-col items-center justify-center min-w-[70px] shrink-0 text-center">
                        <span className="text-2xl font-black text-teal-dark font-mono leading-none">{day}</span>
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1">{month}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {n.is_new && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white">
                              NEW
                            </span>
                          )}
                          <span className="text-xs text-stone-500">
                            {n.date} · 1 min read · PDF
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-teal-dark leading-snug">
                          {n.title}
                        </h3>

                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {n.description}
                        </p>

                        <div className="pt-2 flex items-center gap-3">
                          <button
                            onClick={() => setActiveModalNotice(n)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-deep text-teal-deep hover:bg-teal-50 text-xs font-semibold transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Read the notice</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Right Column: Key Dates & Guidelines Links matching Screenshot (444).png */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* KEY DATES Card */}
            <div className="bg-white rounded-2xl p-6 border border-iu-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  KEY DATES
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {regStatus.status}
                </span>
              </div>
              
              <div className="space-y-4 text-sm divide-y divide-stone-100">
                <div className="flex justify-between items-center pt-1">
                  <span className="text-stone-600 font-medium">Registration Deadline</span>
                  <span className="font-extrabold text-teal-dark">{regStatus.deadlineText}</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-stone-600">Registration Period</span>
                  <span className="font-semibold text-stone-800">{regStatus.periodText}</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-stone-600">Convocation Ceremony</span>
                  <span className="font-bold text-teal-deep">02 Feb 2027</span>
                </div>
              </div>
            </div>

            {/* Quick Link Card: Guidelines */}
            <Link
              to="/guidelines"
              className="bg-white rounded-2xl p-5 border border-iu-border shadow-sm hover:border-teal-300 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-deep flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-teal-dark group-hover:text-teal-deep transition">
                    Guidelines
                  </h4>
                  <p className="text-xs text-stone-500">What to keep ready before you register</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-teal-deep transition" />
            </Link>

            {/* Quick Link Card: Start Registration */}
            <Link
              to="/register"
              className="bg-white rounded-2xl p-5 border border-iu-border shadow-sm hover:border-gold-warm transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-gold-warm flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-teal-dark group-hover:text-gold-warm transition">
                    Start registration
                  </h4>
                  <p className="text-xs text-stone-500">Department, degree level and Roll No</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-gold-warm transition" />
            </Link>

            {/* Contact Box */}
            <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/80 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
              <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Questions about a notice?</p>
                <p className="mt-1">
                  Write to <a href="mailto:arnob.ict.iu@gmail.com" className="font-bold underline text-teal-dark">arnob.ict.iu@gmail.com</a> (Demo Support) or check the <Link to="/contact" className="underline font-bold">Contact Us</Link> page.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Notice Detail Modal */}
      {activeModalNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setActiveModalNotice(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-teal-100 text-teal-deep uppercase">
                {activeModalNotice.category}
              </span>
              <span className="text-xs text-stone-500">{activeModalNotice.date}</span>
            </div>

            <h2 className="text-xl font-bold text-teal-dark leading-snug mb-4">
              {activeModalNotice.title}
            </h2>

            <div className="text-sm text-stone-700 leading-relaxed space-y-3 pb-6 border-b border-stone-100">
              <p>{activeModalNotice.description}</p>
              <p className="text-xs text-stone-500 italic">
                Note: In this educational demonstration portal, circulars reflect public information from Islamic University.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => alert("Demonstration Notice PDF download simulated. In official portal, circular PDF is provided.")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-deep text-white text-xs font-bold rounded-lg hover:bg-teal-hover transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Circular (PDF)</span>
              </button>
              <button
                onClick={() => setActiveModalNotice(null)}
                className="px-4 py-2 border border-stone-200 text-stone-600 text-xs font-medium rounded-lg hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
