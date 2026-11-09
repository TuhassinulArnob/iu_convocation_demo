import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, GraduationCap, LayoutDashboard, 
  ShieldCheck, LogOut, Search, AlertTriangle, ChevronRight
} from 'lucide-react';
import { getAuthToken, getCurrentUser, clearAuthToken } from '../services/api';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const token = getAuthToken();
  const user = getCurrentUser();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Notices', path: '/notices' },
    { name: 'Guidelines', path: '/guidelines' },
    { name: 'Fees', path: '/fees' },
    { name: 'Schedule', path: '/schedule' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white select-none shadow-sm">
      {/* Top Demo Announcement Bar & Track Application Access */}
      <div className="bg-amber-400 text-stone-900 text-[11px] sm:text-xs font-semibold py-1 px-4 text-center flex items-center justify-between sm:justify-center gap-2 border-b border-amber-500/30">
        <div className="flex items-center gap-1.5 mx-auto sm:mx-0 overflow-hidden">
          <AlertTriangle className="w-3.5 h-3.5 text-stone-900 shrink-0" />
          <span className="truncate">
            DEMO WEBSITE — For educational and testing purposes only. No real registration or payment is processed.
          </span>
        </div>
        <Link
          to="/track-application"
          className="hidden sm:inline-flex items-center gap-1 font-bold text-stone-900 bg-amber-500/70 hover:bg-amber-500 px-2.5 py-0.5 rounded-full text-[11px] transition shrink-0"
          title="Track an existing application"
        >
          <Search className="w-3 h-3" />
          <span>Track Application</span>
        </Link>
      </div>

      {/* Main Navbar Row (Refined height 78-84px) */}
      <div className="border-b border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3 sm:gap-6 min-w-0">
            
            {/* Left: University Logo & Typography Branding (23-25px target) */}
            <Link 
              to="/" 
              className="flex items-center gap-3 sm:gap-3.5 group focus:outline-none min-w-0 shrink"
              title="Islamic University Bangladesh - 5th Convocation 2027"
            >
              <img 
                src="/assets/logo/iuLogo.png" 
                alt="Islamic University Logo" 
                className="h-11 sm:h-12 lg:h-[52px] w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[15px] sm:text-[19px] lg:text-[22px] xl:text-[24px] font-bold text-[#153A37] tracking-tight leading-none truncate sm:whitespace-nowrap">
                  Islamic University Bangladesh
                </span>
                <span className="text-[9.5px] sm:text-[11px] xl:text-[11.5px] font-semibold text-[#F3A052] tracking-wider uppercase mt-1 truncate sm:whitespace-nowrap">
                  5TH CONVOCATION 2027 · REGISTRATION
                </span>
              </div>
            </Link>

            {/* Center: Desktop Navigation Links (Refined 15-16px, balanced gaps) */}
            <div className="hidden xl:flex items-center gap-4 2xl:gap-6 shrink-0">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-[15px] 2xl:text-[16px] transition-colors whitespace-nowrap pb-1 ${
                      active
                        ? 'text-[#075C55] font-semibold border-b-2 border-[#117A78]'
                        : 'text-stone-700 font-medium hover:text-[#075C55] border-b-2 border-transparent'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Right: Desktop Action Buttons (Refined 42-44px height, balanced padding) */}
            <div className="hidden xl:flex items-center gap-2.5 2xl:gap-3 shrink-0">
              {token ? (
                <div className="flex items-center gap-2 shrink-0">
                  {user?.role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-[#117A78] text-[#075C55] bg-teal-50 hover:bg-teal-100 text-sm font-bold whitespace-nowrap transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-[#117A78] text-[#075C55] bg-teal-50 hover:bg-teal-100 text-sm font-bold whitespace-nowrap transition"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 h-10 px-3 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-full text-sm font-medium whitespace-nowrap transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center h-10 rounded-full border border-[#117A78] text-[#075C55] hover:bg-teal-50 px-4.5 py-2 font-semibold text-[14.5px] transition-all whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-[#F3A052] hover:bg-[#E08E41] text-stone-900 px-5 py-2 font-bold shadow-sm transition-all whitespace-nowrap text-[14.5px]"
                  >
                    <GraduationCap className="w-4 h-4 text-stone-900" />
                    <span>Registration</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Hamburger Toggle */}
            <div className="flex xl:hidden items-center shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-stone-700 hover:text-[#075C55] hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-[#075C55]"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-stone-800" /> : <Menu className="w-6 h-6 text-stone-800" />}
              </button>
            </div>

          </div>
        </nav>
      </div>

      {/* Mobile / Tablet Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div 
          className="xl:hidden border-t border-stone-200 bg-white px-5 pt-4 pb-6 space-y-1 shadow-xl animate-in slide-in-from-top-2 duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 py-1">
            Menu Navigation
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] font-semibold transition ${
                isActive(link.path)
                  ? 'text-[#075C55] font-bold bg-teal-50 border-l-4 border-[#075C55]'
                  : 'text-stone-700 hover:text-[#075C55] hover:bg-stone-50'
              }`}
            >
              <span>{link.name}</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </Link>
          ))}

          {/* Track Application link in mobile drawer */}
          <Link
            to="/track-application"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] font-semibold transition ${
              isActive('/track-application')
                ? 'bg-amber-100 text-amber-950 font-bold'
                : 'bg-amber-50/70 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-800" />
              <span>Track Application</span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600" />
          </Link>

          {/* Auth section in mobile drawer */}
          <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
            {token ? (
              <>
                {user?.role === 'admin' ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 px-4 rounded-full bg-[#075C55] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 px-4 rounded-full bg-[#075C55] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Student Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-full border border-rose-300 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-full border border-[#117A78] text-[#075C55] hover:bg-teal-50 font-semibold text-sm flex items-center justify-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-full bg-[#F3A052] hover:bg-[#E08E41] text-stone-900 font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <GraduationCap className="w-4 h-4 text-stone-900" />
                  <span>Registration</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
