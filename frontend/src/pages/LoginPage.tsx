import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../services/api';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdent, setForgotIdent] = useState('');
  const [forgotMsg, setForgotMsg] = useState<any | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.login({
        identifier: identifier.trim(),
        password: password
      });

      setAuthToken(res.access_token);
      setCurrentUser({
        user_id: res.user_id,
        role: res.role,
        app_id: res.app_id,
        name: res.student_name,
      });

      if (res.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPasswordDemo(forgotIdent);
      setForgotMsg(res);
    } catch (err: any) {
      alert(err.message || 'Failed to simulate password recovery.');
    }
  };

  return (
    <div className="min-h-screen bg-iu-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        {/* Main Sign In Card matching Screenshot (449).png */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-iu-border">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <img
              src="/assets/logo/iuLogo.png"
              alt="Islamic University Logo"
              className="h-16 w-auto mx-auto object-contain mb-3"
            />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-warm block mb-1">
              5TH CONVOCATION 2027
            </span>
            <h1 className="text-3xl font-extrabold text-teal-dark">
              Sign in
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-600">
              Use your mobile number, e-mail or Roll No and your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            
            {/* Identifier */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Mobile, e-mail or Roll No
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Roll No 1812045 or student email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-deep focus:bg-white transition"
                />
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-teal-deep hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-deep focus:bg-white transition"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button matching Screenshot (449).png */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#075C55] hover:bg-[#096E66] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Divider matching Screenshot (449).png */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-stone-400 font-bold">OR</span>
            </div>
          </div>

          {/* New graduate register link */}
          <div className="text-center text-xs sm:text-sm text-stone-600">
            <span>New graduate? </span>
            <Link to="/register" className="font-bold text-teal-deep hover:underline">
              Create your account →
            </Link>
          </div>

          {/* Staff Login Link */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <Link
              to="/admin/login"
              className="text-xs text-stone-500 hover:text-teal-deep inline-flex items-center gap-1.5 transition font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>University staff login</span>
            </Link>
          </div>

        </div>

      </div>

      {/* Forgot Password Demo Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-teal-dark mb-2">
              Forgot Password (Demo Simulation)
            </h3>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              In this educational demonstration portal, no live SMS or email service is hooked up. You can view demo recovery details directly below.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mobile, Email or Roll Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roll No 1812045"
                  value={forgotIdent}
                  onChange={(e) => setForgotIdent(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMsg(null);
                  }}
                  className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-deep text-white font-bold rounded-lg text-xs"
                >
                  Simulate Reset
                </button>
              </div>
            </form>

            {forgotMsg && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold">{forgotMsg.message}</p>
                <p>Code: <code className="font-mono bg-white px-1 rounded">{forgotMsg.simulated_reset_code}</code></p>
                <p className="text-[11px] text-stone-600">{forgotMsg.instructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
