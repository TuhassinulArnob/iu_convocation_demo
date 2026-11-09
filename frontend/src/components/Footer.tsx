import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, ExternalLink, ShieldAlert, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#153A37] text-white pt-14 pb-8 border-t border-teal-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: University Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/logo/iuLogo.png" 
                alt="IU Logo" 
                className="h-14 w-auto object-contain bg-white/10 p-1 rounded-md"
              />
              <div>
                <h3 className="font-bold text-lg text-white leading-tight">
                  Islamic University Bangladesh
                </h3>
                <p className="font-bengali text-sm text-stone-300">
                  ইসলামী বিশ্ববিদ্যালয় বাংলাদেশ
                </p>
              </div>
            </div>

            <div className="text-xs text-stone-300 space-y-1.5 pt-2">
              <p className="font-semibold text-gold-warm">
                Convocation Cell, Office of the Registrar
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gold-warm shrink-0" />
                <span>Kushtia - 7003, Bangladesh</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gold-warm shrink-0" />
                <a href="mailto:arnob.ict.iu@gmail.com" className="hover:text-gold-warm underline text-stone-200">
                  arnob.ict.iu@gmail.com
                </a>
                <span className="text-[10px] text-gold-warm/90 font-semibold">(Demo Support)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <a href="mailto:convocation@iu.ac.bd" className="hover:text-white underline text-stone-400">
                  convocation@iu.ac.bd
                </a>
                <span className="text-[10px] text-stone-400">(Official Ref)</span>
              </p>
            </div>
          </div>

          {/* Col 2: Registration Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gold-warm mb-4">
              Registration
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-300">
              <li>
                <Link to="/register" className="hover:text-gold-warm transition">
                  Create an account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-gold-warm transition">
                  Graduate sign in
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-gold-warm transition">
                  Registration guidelines
                </Link>
              </li>
              <li>
                <Link to="/fees" className="hover:text-gold-warm transition">
                  Fees & calculator
                </Link>
              </li>
              <li>
                <Link to="/track-application" className="hover:text-gold-warm transition font-medium text-amber-200">
                  Track Application Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Information & Help */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gold-warm mb-4">
              Help & Resources
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-300">
              <li>
                <Link to="/notices" className="hover:text-gold-warm transition">
                  Official notices
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="hover:text-gold-warm transition">
                  Schedule & programme
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-gold-warm transition">
                  Contact convocation cell
                </Link>
              </li>
              <li>
                <a 
                  href="https://convocation.iu.ac.bd/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 hover:text-gold-warm transition text-stone-400"
                >
                  <span>Original Convocation Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://iu.ac.bd/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 hover:text-gold-warm transition text-stone-400"
                >
                  <span>Islamic University Main Site</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Ceremony Details */}
          <div className="bg-[#0b2422]/60 p-4 rounded-xl border border-white/10 text-xs text-stone-300 space-y-3">
            <div className="flex items-center gap-2 text-gold-warm font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>5th Convocation 2027</span>
            </div>
            <p>
              <strong>Date:</strong> Tuesday, 02 February 2027<br />
              <strong>Time:</strong> 09:00 AM BST<br />
              <strong>Venue:</strong> Central Playground, IU Campus, Kushtia
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

        {/* Prominent Educational Demonstration Disclaimer */}
        <div className="my-8 p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold tracking-wide uppercase text-amber-300 block mb-1">
              UNOFFICIAL DEMONSTRATION PROJECT
            </span>
            This website is an independently developed educational UI/UX and software demonstration inspired by the public-facing Islamic University Bangladesh 5th Convocation 2027 portal. It is <strong>NOT</strong> the official university website and is <strong>NOT</strong> affiliated with, endorsed by, or operated by Islamic University Bangladesh. No real registrations or payments are accepted.
          </div>
        </div>

        {/* Copyright and Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>
            © 2027 Islamic University Bangladesh 5th Convocation — Educational Demonstration.
          </p>
          <p className="text-[11px] text-stone-400">
            Kushtia - 7003, Bangladesh. Built for showcase and UI/UX demonstration.
          </p>
        </div>

      </div>
    </footer>
  );
};
