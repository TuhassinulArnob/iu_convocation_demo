import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from '../components/CountdownTimer';
import { PageHero } from '../components/PageHero';
import { api } from '../services/api';

export const SchedulePage: React.FC = () => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    api.getConfig()
      .then(data => setConfig(data))
      .catch(err => console.error(err));
  }, []);

  const eventTimeline = [
    { time: "08:00 AM", title: "Gates Open & Security Screening", desc: "Graduates and registered guests enter via specific gates at Central Playground." },
    { time: "09:00 AM", title: "Graduates Seated in Academic Gowns", desc: "All degree candidates must be seated inside the main convocation marquee." },
    { time: "09:30 AM", title: "Academic Procession Enters", desc: "Honorable Chancellor, Vice-Chancellor, Deans, and Syndicate members proceed to stage." },
    { time: "10:00 AM", title: "National Anthem & Holy Recitation", desc: "Ceremony commences with recitation from Holy Quran and national anthem." },
    { time: "10:15 AM", title: "Formal Opening of 5th Convocation", desc: "Honorable Chancellor declares the convocation open." },
    { time: "10:30 AM", title: "Chancellor's & VC's Address", desc: "Welcome speech, annual university academic report, and keynote addresses." },
    { time: "11:15 AM", title: "Conferment of Degrees & Chancellor's Gold Medals", desc: "Awarding of PhD, M.Phil, Masters, and Honours degrees with valedictory address." },
    { time: "01:00 PM", title: "Closing of Convocation & Ceremonial Lunch", desc: "Chancellor dissolves the assembly followed by lunch and photo sessions." },
  ];

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Banner matching Original IU Design */}
      <PageHero
        title="Schedule"
        description="Important dates and the programme of the ceremony"
        eyebrow="5TH CONVOCATION 2027"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Countdown Centerpiece */}
        <div className="flex flex-col items-center justify-center mb-12">
          <CountdownTimer />
        </div>

        {/* Important Dates Section matching Screenshot (447).png */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-xl font-bold text-teal-dark mb-4">
            Important dates
          </h2>

          <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-6">
            
            {/* Date Item 1 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-center min-w-[75px]">
                  <span className="text-2xl font-black text-teal-deep font-mono block leading-none">10</span>
                  <span className="text-[10px] font-bold text-teal-dark uppercase tracking-wider">NOV 2026</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-teal-dark">Online registration</h3>
                  <p className="font-bengali text-xs text-stone-500 font-medium">অনলাইন নিবন্ধন</p>
                  <p className="text-xs text-stone-600 mt-1">Tuesday, 10 Nov 2026 – Wednesday, 25 Nov 2026</p>
                  <p className="text-xs text-stone-500">Create an account, fill in the form and pay the fee.</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                Opening Soon
              </span>
            </div>

            {/* Date Item 2 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center min-w-[75px]">
                  <span className="text-2xl font-black text-gold-warm font-mono block leading-none">02</span>
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">FEB 2027</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-teal-dark">5th Convocation 2027 — ceremony</h3>
                  <p className="font-bengali text-xs text-stone-500 font-medium">সমাবর্তন অনুষ্ঠান</p>
                  <p className="text-xs text-stone-600 mt-1">Tuesday, 02 Feb 2027 · 09:00 AM BST</p>
                  <p className="text-xs text-stone-500">Central Playground, Islamic University Campus, Kushtia</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-teal-deep text-white text-xs font-bold shrink-0">
                Ceremony Day
              </span>
            </div>

          </div>

          <p className="text-xs text-stone-500 mt-3 text-center">
            Dates may change — watch the <Link to="/notices" className="underline font-semibold text-teal-dark">notices</Link>.
          </p>
        </div>

        {/* Day-of-Event Programme Timeline */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-teal-dark mb-6">
            Programme of the Ceremony (Draft)
          </h2>

          <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 sm:p-8">
            <div className="relative border-l-2 border-teal-200 ml-4 pl-6 space-y-8">
              {eventTimeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-teal-deep border-2 border-white shadow" />
                  
                  <div className="text-xs font-bold text-gold-warm uppercase tracking-wider mb-0.5">
                    {item.time}
                  </div>
                  <h4 className="text-base font-bold text-teal-dark">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
