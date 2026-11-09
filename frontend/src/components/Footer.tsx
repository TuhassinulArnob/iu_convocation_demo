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
                <Mail className="w-3.5 h-3.5 text-[#F3A052] shrink-0" />
                <a href="mailto:arnob.ict.iu@gmail.com" className="hover:text-[#F3A052] underline text-stone-200 transition">
                  arnob.ict.iu@gmail.com
                </a>
                <span className="text-[10px] text-[#F3A052]/90 font-semibold">(Demo Support)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <a href="mailto:convocation@iu.ac.bd" className="hover:text-white underline text-stone-400 transition">
                  convocation@iu.ac.bd
                </a>
                <span className="text-[10px] text-stone-400">(Official Ref)</span>
              </p>
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
              <strong className="text-white">Date:</strong> Tuesday, 02 Feb 2027<br />
              <strong className="text-white">Time:</strong> 09:00 AM BST<br />
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
