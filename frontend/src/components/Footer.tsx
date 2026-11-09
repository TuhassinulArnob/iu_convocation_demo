import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, ExternalLink, ShieldAlert, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#153A37] text-white pt-12 pb-8 border-t border-teal-deep/50 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-10 border-b border-white/10">
          
          {/* Col 1: University Identity (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/logo/iuLogo.png" 
                alt="IU Logo" 
                className="h-12 w-auto object-contain bg-white/10 p-1 rounded-md"
              />
              <div>
                <h3 className="font-bold text-base sm:text-[17px] text-white leading-tight">
                  Islamic University Bangladesh
                </h3>
                <p className="font-bengali text-xs sm:text-[13px] text-stone-300 mt-0.5">
                  ইসলামী বিশ্ববিদ্যালয় বাংলাদেশ
                </p>
              </div>
            </div>

            <div className="text-xs text-stone-300 space-y-1.5 pt-1">
              <p className="font-medium text-[#F3A052]">
                Convocation Cell, Office of the Registrar
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#F3A052] shrink-0" />
                <span>Kushtia - 7003, Bangladesh</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <a href="mailto:convocation@iu.ac.bd" className="hover:text-white underline text-stone-400 transition">
                  convocation@iu.ac.bd
                </a>
                <span className="text-[10px] text-stone-400">(Official Ref)</span>
              </p>
            </div>

            {/* Developer Section (GitHub Integration) */}
            <div className="pt-2.5 border-t border-white/10 mt-3 text-xs">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 block">
                Developer
              </span>
              <p className="font-bold text-white text-[13px] mt-0.5">Arnob</p>
              <a
                href="https://github.com/TuhassinulArnob"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#F3A052] hover:text-[#E08E41] font-semibold mt-1 transition"
                title="View GitHub Profile of Developer Arnob"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub Profile ↗</span>
              </a>
            </div>
          </div>

          {/* Col 2: Registration Links (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3A052] mb-3">
              Registration
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] text-stone-300">
              <li>
                <Link to="/register" className="hover:text-[#F3A052] transition">
                  Create account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#F3A052] transition">
                  Graduate sign in
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-[#F3A052] transition">
                  Guidelines
                </Link>
              </li>
              <li>
                <Link to="/fees" className="hover:text-[#F3A052] transition">
                  Fees & calculator
                </Link>
              </li>
              <li>
                <Link to="/track-application" className="hover:text-[#F3A052] transition font-medium text-amber-200">
                  Track Application
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Information & Help (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F3A052] mb-3">
              Help & Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] text-stone-300">
              <li>
                <Link to="/notices" className="hover:text-[#F3A052] transition">
                  Official notices
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="hover:text-[#F3A052] transition">
                  Schedule
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#F3A052] transition">
                  Contact office
                </Link>
              </li>
              <li>
                <a 
                  href="https://convocation.iu.ac.bd/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 hover:text-[#F3A052] transition text-stone-400"
                >
                  <span>IU Convocation</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a 
                  href="https://iu.ac.bd/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 hover:text-[#F3A052] transition text-stone-400"
                >
                  <span>IU Main Portal</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Ceremony Details (3 cols on lg) */}
          <div className="lg:col-span-3 bg-[#0b2422]/70 p-4 rounded-xl border border-white/10 text-xs text-stone-300 space-y-2.5">
            <div className="flex items-center gap-2 text-[#F3A052] font-bold uppercase tracking-wider text-xs">
              <Award className="w-4 h-4 text-[#F3A052]" />
              <span>5th Convocation 2027</span>
            </div>
            <p className="leading-relaxed text-[12px] text-stone-300">
              <strong className="text-white">Registration:</strong> Started (Deadline: 25 Nov 2026)<br />
              <strong className="text-white">Ceremony Date:</strong> Tuesday, 02 Feb 2027<br />
              <strong className="text-white">Venue:</strong> Central Playground, IU Campus
            </p>
            <div className="pt-2 border-t border-white/10">
              <Link 
                to="/admin/login" 
                className="text-[11px] text-stone-400 hover:text-stone-200 transition underline"
              >
                University Staff / Admin Login
              </Link>
            </div>
          </div>

        </div>

        {/* Compact, Restrained Demonstration Notice (Not a heavy card) */}
        <div className="my-6 py-2.5 px-3.5 bg-black/25 border border-white/10 rounded-lg text-xs text-stone-300 leading-relaxed flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400/90 shrink-0" />
          <span className="text-[11.5px]">
            <strong className="text-amber-300/90 font-semibold uppercase tracking-wider text-[10.5px] mr-1.5">Educational Demo:</strong>
            Independent academic demonstration inspired by Islamic University 5th Convocation 2027. Not affiliated with or endorsed by Islamic University Bangladesh. No real payments or official registrations occur.
          </span>
        </div>

        {/* Copyright and Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-2">
          <p>
            © 2027 Islamic University Bangladesh 5th Convocation — Educational Demonstration.
          </p>
          <p className="text-[11px] text-stone-400">
            Kushtia - 7003, Bangladesh.
          </p>
        </div>

      </div>
    </footer>
  );
};
