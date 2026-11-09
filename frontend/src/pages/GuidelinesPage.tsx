import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCheck, FileText, Camera, CreditCard, 
  Award, ArrowRight, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { PageHero } from '../components/PageHero';

export const GuidelinesPage: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Create account",
      sub: "STEP 1",
      desc: "One form: department, degree level, Roll No and admission session, with your mobile and e-mail. In demo mode, initial credentials are created instantly.",
      icon: UserCheck
    },
    {
      num: "02",
      title: "Fill the form",
      sub: "STEP 2",
      desc: "Personal details, degree information, examination year, present & permanent addresses, gown size, and up to three guest details.",
      icon: FileText
    },
    {
      num: "03",
      title: "Add your photo",
      sub: "STEP 3",
      desc: "A recent passport-size photograph with white/light background. JPG, JPEG, or PNG format with max 2MB file size.",
      icon: Camera
    },
    {
      num: "04",
      title: "Pay the fee",
      sub: "STEP 4",
      desc: "Demonstration payment simulation using local bKash or Rocket QR codes. Shows dynamic breakdown with zero real financial deduction.",
      icon: CreditCard
    },
    {
      num: "05",
      title: "Download your card",
      sub: "STEP 5",
      desc: "After demonstration verification and approval, download your watermarked Convocation Card containing your ceremony entry pass and seat info.",
      icon: Award
    }
  ];

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Banner matching Original IU Design */}
      <PageHero
        title="Guidelines"
        description="Everything you need before you register"
        eyebrow="5TH CONVOCATION 2027"
      />

      {/* Main 5-Step Process */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-gold-warm uppercase tracking-widest block mb-2">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-teal-dark tracking-tight">
            Register in five steps
          </h2>
        </div>

        {/* 5 Cards Row matching Screenshot (445).png */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isLast = idx === 4;

            return (
              <div
                key={st.num}
                className={`rounded-2xl p-6 transition flex flex-col justify-between ${
                  isLast
                    ? 'bg-teal-deep text-white shadow-lg'
                    : 'bg-white text-stone-800 border border-iu-border shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-3xl font-black font-mono ${isLast ? 'text-gold-warm' : 'text-gold-warm'}`}>
                      {st.num}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isLast ? 'bg-white/10 text-white' : 'bg-teal-50 text-teal-deep'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    isLast ? 'text-emerald-300' : 'text-gold-warm'
                  }`}>
                    {st.sub}
                  </div>

                  <h3 className={`text-lg font-bold mb-2.5 ${isLast ? 'text-white' : 'text-teal-dark'}`}>
                    {st.title}
                  </h3>

                  <p className={`text-xs leading-relaxed ${isLast ? 'text-stone-200' : 'text-stone-600'}`}>
                    {st.desc}
                  </p>
                </div>

                <div className={`mt-6 pt-3 border-t text-[11px] font-semibold ${
                  isLast ? 'border-white/20 text-emerald-200' : 'border-stone-100 text-teal-secondary'
                }`}>
                  Phase {idx + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold-warm hover:bg-gold-hover text-stone-900 font-bold rounded-xl shadow-lg transition transform hover:-translate-y-0.5 text-base"
          >
            <span>Start registration</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>

      {/* Detailed Checklists & Requirements */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-2xl p-6 border border-iu-border shadow-sm">
            <h3 className="text-lg font-bold text-teal-dark mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>What to Keep Ready</span>
            </h3>
            <ul className="space-y-3 text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-deep">•</span>
                <span><strong>Academic Identifiers:</strong> University Roll Number, Registration Number, Department Name, and Admission Session.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-deep">•</span>
                <span><strong>Photograph:</strong> High quality digital passport photograph with formal background (JPG/PNG under 2MB).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-deep">•</span>
                <span><strong>Guest Details:</strong> If bringing guests, have their full names, relationship, and ages ready. Children under 5 require birth age info for exemption.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-teal-deep">•</span>
                <span><strong>Active Mobile & Email:</strong> Needed for login, application tracking, and verification notifications.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-iu-border shadow-sm">
            <h3 className="text-lg font-bold text-teal-dark mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gold-warm" />
              <span>Important Rules & Notes</span>
            </h3>
            <ul className="space-y-3 text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span><strong>Original Certificate Policy:</strong> If you have already received your original certificate from the university, you will not be charged certificate fee.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span><strong>Guest Exemption:</strong> Maximum of 3 guests allowed. Children under 5 years old are free under convocation policy.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span><strong>Demonstration Disclaimer:</strong> This portal is an educational demonstration. All payment steps and verifications are simulations. Do not send actual money.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
};
