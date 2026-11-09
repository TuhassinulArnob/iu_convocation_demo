import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../services/api';

export const AdminLoginPage: React.FC = () => {
  // Manual authentication only — strictly empty initial state, no prefilled credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter both administrator identifier and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login({
        identifier: identifier.trim(),
        password: password,
      });

      if (res.role !== 'admin') {
        throw new Error('Access denied. Ordinary student accounts cannot access administrative panels.');
      }

      // Store token and user session strictly for this browser session (manual login only)
      setAuthToken(res.access_token, true);
      setCurrentUser({
        user_id: res.user_id,
        role: res.role,
        app_id: res.app_id,
        name: res.student_name || 'Administrator',
      }, true);

      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Administrative authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-iu-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-iu-border">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-dark text-gold-warm flex items-center justify-center mx-auto mb-3 shadow-md">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold-warm block">
              OFFICIAL CONVOCATION CELL (DEMO)
            </span>
            <h1 className="text-2xl font-black text-teal-dark mt-1">
              Demonstration Staff Login
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Administrative access for application review, verification, and notice publication.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Admin Email / Identifier
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter administrator identifier"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-deep"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-deep"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-dark hover:bg-teal-deep text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Admin Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <Link to="/login" className="text-xs text-stone-500 hover:text-teal-deep">
              ← Return to Student Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
