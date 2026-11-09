import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Send, AlertCircle, CheckCircle, ExternalLink, Phone } from 'lucide-react';
import { PageHero } from '../components/PageHero';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roll_or_app_id: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Banner matching Original IU Design */}
      <PageHero
        title="Contact us"
        description="Convocation Cell, Office of the Registrar"
        eyebrow="5TH CONVOCATION 2027"
      />

      {/* Main Content matching Screenshot (448).png */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* Left Card: Convocation Cell Office Details */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-5">
            <h3 className="text-base font-bold text-teal-dark flex items-center gap-2 pb-3 border-b border-stone-100">
              <span className="text-xl">🏛️</span>
              <span>Convocation Cell, Office of the Registrar</span>
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-warm mt-1 shrink-0" />
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Address</span>
                  <p className="text-stone-800 font-medium">
                    Islamic University Campus, Kushtia - 7003, Bangladesh.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-stone-400 mt-1 shrink-0" />
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Official University E-mail (Reference)</span>
                  <a href="mailto:convocation@iu.ac.bd" className="text-stone-700 font-semibold hover:underline">
                    convocation@iu.ac.bd
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gold-warm mt-1 shrink-0" />
                <div>
                  <span className="text-xs text-stone-400 block font-medium">Official PABX (Reference)</span>
                  <p className="text-stone-800 font-medium">
                    +880-247778-6500 (Ext. Convocation Cell)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
              <a
                href="https://convocation.iu.ac.bd/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-teal-deep hover:underline font-semibold"
              >
                <span>Official Convocation Contact Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://iu.ac.bd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-teal-deep transition"
              >
                <span>Islamic University Official Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Project Developer Section — Clearly Distinguished from Official Info */}
            <div className="mt-5 pt-5 border-t border-stone-200/80 bg-stone-50/70 -mx-6 -mb-6 p-6 rounded-b-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Project Developer
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">
                  Unofficial Demo
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-teal-dark">Arnob</p>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  GitHub: github.com/TuhassinulArnob
                </p>
              </div>
              <div>
                <a
                  href="https://github.com/TuhassinulArnob"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>Visit GitHub Profile ↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Card: Guidelines Helper Box */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-teal-dark">
              Frequently Asked Questions & Quick Help
            </h3>
            
            <p className="text-sm text-stone-700 leading-relaxed">
              For a question about your registration, first see the <Link to="/guidelines" className="text-teal-deep font-bold underline">guidelines</Link> and <Link to="/fees" className="text-teal-deep font-bold underline">fee structure</Link>.
            </p>
            
            <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-stone-700 leading-relaxed">
              When you write or call the convocation office, please always specify your <strong>application number</strong> or <strong>Roll No</strong> so that your academic record can be identified without delay.
            </div>

            {/* Interactive Demonstration Inquiry Form */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Send a Demonstration Inquiry
              </h4>

              {submitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <strong>Demonstration Message Recorded!</strong><br />
                    In this testing sandbox, mock messages are displayed locally without contacting actual university servers.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Roll No or App ID (e.g. IU27-DEMO-000101)"
                      value={formData.roll_or_app_id}
                      onChange={(e) => setFormData({ ...formData, roll_or_app_id: e.target.value })}
                      className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Subject (e.g. Photo upload, Fee payment)"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe your question or message..."
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-stone-500 italic">
                      * Demo simulator form only.
                    </span>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-deep text-white font-bold rounded-lg text-xs hover:bg-teal-hover transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Inquiry</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
