import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../services/api';

export const AdminLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('admin@convocation.iu.ac.bd');
  const [password, setPassword] = useState('AdminIU@2027');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({
        identifier: identifier.trim(),
        password: password
      });

      if (res.role !== 'admin') {
        throw new Error('Access denied. Ordinary student accounts cannot access administrative panels.');
      }

      setAuthToken(res.access_token);
      setCurrentUser({
        user_id: res.user_id,
        role: res.role,
        app_id: res.app_id,
        name: res.student_name,
      });

      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Administrative authentication failed.');
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

          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-warm" />
              <span>Pre-Filled Demo Admin Credentials:</span>
            </div>
            <p className="font-mono text-stone-700">admin@convocation.iu.ac.bd / AdminIU@2027</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Admin Email / Identifier
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
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
