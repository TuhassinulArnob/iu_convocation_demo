import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, MapPin, ArrowRight, CheckCircle2, UserCheck, 
  FileText, CreditCard, Award, ChevronDown, ChevronUp, Clock, AlertCircle
} from 'lucide-react';
import { CountdownTimer } from '../components/CountdownTimer';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api.getNotices()
      .then(data => setNotices(data.slice(0, 3)))
      .catch(err => console.error("Error fetching notices:", err));
  }, []);

  const faqs = [
    {
      q: "Who is eligible to participate in the 5th Convocation 2027?",
      a: "Graduates who have successfully completed Undergraduate (Honours) programs between 2012–13 and 2020–21 sessions, Postgraduate (Masters) between 2015–16 and 2023–24 sessions, as well as M.Phil, PhD, and Evening/Professional Masters degree holders within the approved timeframe."
    },
    {
      q: "What is the fee structure for regular vs evening registration?",
      a: "Regular registration fee is ৳4,500 and Evening program registration fee is ৳5,500. Original certificate fees apply only if you do not already possess your original degree certificate (Honours: ৳500, Masters: ৳700, M.Phil: ৳1,500, PhD: ৳2,000, Evening Masters: ৳1,000)."
    },
    {
      q: "Can I bring guests to the convocation ceremony?",
      a: "Yes, graduates may register a maximum of three guests (parents, spouse, or children). Each chargeable guest is ৳1,000. Under the official fee policy, children under five (5) years of age are completely exempt from guest charges."
    },
    {
      q: "Is this website the official Islamic University portal?",
      a: "No. This is an independent educational demonstration project built for UI/UX testing and academic demonstration. No real payments, money transfers, or official registrations are accepted or processed on this website."
    },
    {
      q: "When can I download my Convocation Card / Entry Pass?",
      a: "In this demonstration portal, your watermarked Convocation Card can be generated and printed once your simulated application is reviewed and approved by the department or demo administrator."
    }
  ];

  return (
    <div className="min-h-screen bg-iu-bg">
      {/* SECTION B & C: Hero Section with Background and Dark Teal Overlay */}
      <section className="relative min-h-[560px] lg:min-h-[640px] bg-[#075C55] overflow-hidden flex items-center w-full">
        {/* Background Campus Main Gate Image - cleanly contained */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-90 transition duration-1000"
          style={{ backgroundImage: `url('/assets/reference/background_mainGateImage.webp')` }}
        />
        {/* Optimized Teal Gradient Overlay - keeping photo visible while preserving high text contrast */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'linear-gradient(110deg, rgba(7, 92, 85, 0.65) 0%, rgba(7, 92, 85, 0.45) 50%, rgba(21, 58, 55, 0.40) 100%)'
          }}
        />

        {/* Diagonal Pinstripe Lines Texture Overlay (Matching Original Website) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.045) 0px, rgba(255, 255, 255, 0.045) 1.5px, transparent 1.5px, transparent 16px)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-18 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-5 text-white drop-shadow-sm">
              
              {/* Registration Status Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-dark/80 border border-white/20 text-xs font-medium text-emerald-200 backdrop-blur-md shadow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Registration opens on 10 Nov 2026</span>
              </div>

              {/* Main Heading (58-64px target) */}
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                  5th Convocation 2027
                </h1>
                <h2 className="font-bengali text-xl sm:text-2xl lg:text-[28px] font-bold text-gold-warm drop-shadow-sm">
                  পঞ্চম সমাবর্তন ২০২৭
                </h2>
              </div>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-[17px] text-stone-100 max-w-xl leading-relaxed font-normal">
                Online registration for graduates of Islamic University Bangladesh — Honours, Masters, M.Phil, PhD and Masters (Professional/Evening) programs.
              </p>

              {/* Date & Venue Cards */}
              <div className="space-y-2 pt-1 text-xs sm:text-sm text-stone-200">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-gold-warm shrink-0" />
                  <span className="font-medium">Tuesday, 02 February 2027 · 09:00 AM BST</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-gold-warm shrink-0" />
                  <span>Central Playground, Islamic University Campus, Kushtia</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-gold-warm hover:bg-gold-hover text-stone-900 font-bold rounded-full shadow transition flex items-center gap-2 text-sm sm:text-[15px]"
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 border border-white/40 hover:border-white text-white font-semibold rounded-full hover:bg-white/10 transition backdrop-blur-sm text-sm sm:text-[15px]"
                >
                  Sign In
                </Link>
                <Link
                  to="/track-application"
                  className="px-5 py-2.5 bg-teal-dark/70 hover:bg-teal-dark text-emerald-200 border border-emerald-400/30 rounded-full transition text-sm font-medium"
                >
                  Track Application
                </Link>
              </div>

              {/* Countdown Component */}
              <div className="pt-3">
                <CountdownTimer />
              </div>

            </div>

            {/* Right Hero Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 sm:p-6 shadow-xl text-white">
                
                {/* Logo Box */}
                <div className="bg-white p-4 rounded-xl flex items-center justify-center shadow-sm mb-5">
                  <img 
                    src="/assets/logo/convoLogo.png" 
                    alt="5th Convocation Official Logo" 
                    className="max-h-44 w-auto object-contain hover:scale-105 transition-transform"
                  />
                </div>

                {/* Key Status List */}
                <div className="space-y-3 text-xs sm:text-[13px] divide-y divide-white/10">
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-stone-300">Status</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-400/30">
                      Registration opens 10 Nov 2026
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5">
                    <span className="text-stone-300">Registration period</span>
                    <span className="font-semibold text-white">10 Nov – 25 Nov 2026</span>
                  </div>

                  <div className="pt-2.5">
                    <span className="text-stone-300 text-xs block mb-1.5">Eligible degree categories</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Honours", "Masters", "M.Phil", "PhD", "Masters (Evening)"].map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-white/15 rounded text-[11px] font-medium text-stone-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION E: Registration Steps */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-gold-warm uppercase tracking-widest block mb-2">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl font-extrabold text-teal-dark tracking-tight">
            Register in five simple steps
          </h2>
          <p className="mt-2 text-stone-600 text-sm">
            Everything you need to successfully participate in the 5th Convocation 2027.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              step: "01",
              title: "Create Account",
              desc: "Select department, degree level, roll number, session, mobile & email.",
              icon: UserCheck
            },
            {
              step: "02",
              title: "Fill Application",
              desc: "Enter personal information, addresses, gown size and guest details.",
              icon: FileText
            },
            {
              step: "03",
              title: "Upload Photo",
              desc: "Provide a clear passport-size photograph with preview & validation.",
              icon: Award
            },
            {
              step: "04",
              title: "Simulate Payment",
              desc: "Dynamic fee breakdown. Test bKash or Rocket demonstration QR code.",
              icon: CreditCard
            },
            {
              step: "05",
              title: "Download Card",
              desc: "Upon demonstration approval, download your watermarked Convocation Card.",
              icon: CheckCircle2
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step} 
                className="bg-white rounded-2xl p-6 border border-iu-border shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-gold-warm font-mono">{item.step}</span>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-deep flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-teal-dark text-base mb-1.5">{item.title}</h3>
                  <p className="text-stone-600 text-xs leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-semibold text-teal-secondary">
                  Step {idx + 1} of 5
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/guidelines"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-deep hover:text-teal-hover transition"
          >
            <span>Read full registration guidelines</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* SECTION F & G: Fee Overview & Notices Grid */}
      <section className="py-12 bg-stone-100/60 border-y border-iu-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Fee Overview Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-iu-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-teal-dark">Fee Structure Overview</h3>
                  <p className="text-xs text-stone-500">Official reference rate overview</p>
                </div>
                <Link to="/fees" className="text-xs font-bold text-gold-warm hover:underline">
                  Full Details →
                </Link>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-700">Regular Program Registration</span>
                  <span className="font-bold text-teal-dark">৳ 4,500</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-700">Evening Program Registration</span>
                  <span className="font-bold text-teal-dark">৳ 5,500</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-700">Bachelor / Honours Certificate</span>
                  <span className="font-bold text-teal-dark">৳ 500</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-700">Masters Certificate</span>
                  <span className="font-bold text-teal-dark">৳ 700</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-700">Chargeable Guest (each, max 3)</span>
                  <span className="font-bold text-teal-dark">৳ 1,000</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-700">Child Under 5 Years</span>
                  <span className="font-bold text-emerald-600">Free (Exempt)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-stone-700">Online Processing Charge</span>
                  <span className="font-bold text-teal-dark">৳ 32.50</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100">
                <Link
                  to="/fees"
                  className="block w-full text-center py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-deep rounded-xl text-xs font-bold transition"
                >
                  Open Interactive Fee Calculator
                </Link>
              </div>
            </div>

            {/* Recent Notices */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-iu-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-teal-dark">Latest Notices</h3>
                  <p className="text-xs text-stone-500">Official announcements and circulars</p>
                </div>
                <Link to="/notices" className="text-xs font-bold text-gold-warm hover:underline">
                  View All Notices →
                </Link>
              </div>

              <div className="space-y-3">
                {notices.map((n) => (
                  <div 
                    key={n.id}
                    className="p-4 rounded-xl border border-stone-100 hover:border-teal-200 bg-stone-50/50 hover:bg-teal-50/20 transition group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {n.date}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-deep">
                        {n.category}
                      </span>
                      {n.is_new && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-stone-900">
                          NEW
                        </span>
                      )}
                    </div>
                    <Link to="/notices" className="font-semibold text-teal-dark group-hover:text-teal-deep text-sm block">
                      {n.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION I: Campus Gallery Section */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-gold-warm uppercase tracking-widest block mb-2">
            CAMPUS IDENTITY
          </span>
          <h2 className="text-3xl font-extrabold text-teal-dark tracking-tight">
            Islamic University, Kushtia
          </h2>
          <p className="mt-2 text-stone-600 text-sm">
            Known as the Green Campus of Bangladesh, spreading excellence in higher education and Islamic studies since 1979.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl overflow-hidden border border-iu-border shadow-sm group">
            <div className="h-48 overflow-hidden bg-stone-200 relative">
              <img 
                src="/assets/reference/background_mainGateImage.webp" 
                alt="IU Main Gate" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-teal-dark/30 group-hover:bg-teal-dark/10 transition" />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-teal-dark text-base">Main Entrance & Gateway</h3>
              <p className="text-xs text-stone-600 mt-1">
                The historic archway gate of Islamic University Bangladesh located along the Kushtia-Jhenaidah highway.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-iu-border shadow-sm group">
            <div className="h-48 overflow-hidden bg-teal-dark relative flex items-center justify-center p-6">
              <img 
                src="/assets/logo/convoLogo.png" 
                alt="Convocation Emblem" 
                className="h-36 object-contain group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-teal-dark text-base">5th Convocation Emblem</h3>
              <p className="text-xs text-stone-600 mt-1">
                Official ceremonial identity featuring the academic book, beacon of truth, and historic monument of IU.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden border border-iu-border shadow-sm group">
            <div className="h-48 overflow-hidden bg-emerald-900/90 relative flex items-center justify-center p-6">
              <img 
                src="/assets/logo/iuLogo.png" 
                alt="University Monogram" 
                className="h-32 object-contain bg-white/10 p-2 rounded-xl group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-teal-dark text-base">University Monogram & Heritage</h3>
              <p className="text-xs text-stone-600 mt-1">
                Representing 8 faculties and 36 academic departments dedicated to arts, sciences, law, and theology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION J: FAQ Section */}
      <section className="py-16 bg-white border-t border-iu-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest block mb-2">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl font-extrabold text-teal-dark tracking-tight">
              Convocation Information & FAQs
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="border border-iu-border rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left font-semibold text-teal-dark flex items-center justify-between gap-4 hover:bg-stone-50 transition"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-teal-deep shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 bg-stone-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};
