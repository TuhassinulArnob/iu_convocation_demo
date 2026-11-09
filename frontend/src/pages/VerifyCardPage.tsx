import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, 
  XCircle, ArrowLeft, RefreshCw, FileText, Lock
} from 'lucide-react';
import { api } from '../services/api';

export const VerifyCardPage: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || undefined;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any | null>(null);
  const [manualInput, setManualInput] = useState(cardId || '');

  const verify = async (idToVerify: string, tokenVal?: string) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    try {
      const data = await api.verifyCard(idToVerify.trim(), tokenVal);
      setResult(data);
    } catch (err: any) {
      console.error('Card verification error:', err);
      setResult({
        valid: false,
        status: 'INVALID',
        status_label: 'Invalid Demo Card',
        digital_signature_verification: 'Invalid',
        verification_message: err.message || 'Verification failed. Card record could not be confirmed.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cardId) {
      verify(cardId, token);
    } else {
      setLoading(false);
    }
  }, [cardId, token]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      verify(manualInput.trim());
    }
  };

  const isValid = result?.valid && result?.status === 'VALID';
  const isRevoked = result?.status === 'REVOKED';
  const isInvalid = !isValid && !isRevoked;

  return (
    <div className="min-h-screen bg-[#F4F8F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-teal-deep hover:text-teal-dark transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Convocation Portal</span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            QR Digital Verification Service
          </span>
        </div>

        {/* Mandatory Educational Demonstration Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>UNOFFICIAL DEMONSTRATION VERIFIER — EDUCATIONAL PURPOSES ONLY</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-amber-800">
            This verification service confirms digitally signed convocation entry cards issued exclusively within the 
            Islamic University Bangladesh 5th Convocation 2027 educational demonstration project. It does not represent an official university credential.
          </p>
        </div>

        {/* Main Verification Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#153A37] text-white p-6 sm:p-8 text-center relative border-b-4 border-[#F3A052]">
            <img 
              src="/assets/logo/iuLogo.png" 
              alt="IU Emblem" 
              className="h-16 w-auto mx-auto mb-3 drop-shadow" 
            />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Islamic University Bangladesh
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#F3A052] mt-0.5 font-bengali">
              পঞ্চম সমাবর্তন ২০২৭ · ডিজিটাল সনদ ও প্রবেশপত্র যাচাই
            </p>
            <p className="text-[11px] text-stone-300 uppercase tracking-widest mt-1">
              CONVOCATION CARD AUTHENTICITY VALIDATOR
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">

            {/* Manual Card ID Lookup Form if needed */}
            <form onSubmit={handleManualSearch} className="flex gap-2 text-xs">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter Convocation Card ID (e.g. IU27-CARD-000101-V1)"
                className="flex-1 p-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-deep font-mono uppercase"
              />
              <button
                type="submit"
                disabled={loading || !manualInput.trim()}
                className="px-5 py-3 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl transition shadow disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verify</span>
              </button>
            </form>

            {loading ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-teal-deep animate-spin mx-auto" />
                <p className="text-xs font-semibold text-stone-600">
                  Validating cryptographic signature and registry records against backend...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-6 animate-in fade-in duration-200">

                {/* Status Badge Box */}
                {isValid ? (
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <span className="inline-block px-3 py-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-sm">
                      VALID DEMO CARD
                    </span>
                    <h3 className="text-base font-extrabold text-emerald-950">
                      Digitally Verified Convocation Entry Pass
                    </h3>
                    <p className="text-xs text-emerald-800 leading-relaxed max-w-lg mx-auto">
                      {result.verification_message}
                    </p>
                  </div>
                ) : isRevoked ? (
                  <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                      <XCircle className="w-7 h-7" />
                    </div>
                    <span className="inline-block px-3 py-1 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-sm">
                      INVALID / REVOKED
                    </span>
                    <h3 className="text-base font-extrabold text-rose-950">
                      Convocation Card No Longer Valid
                    </h3>
                    <p className="text-xs text-rose-800 leading-relaxed max-w-lg mx-auto">
                      {result.verification_message}
                    </p>
                    {result.revocation_reason && (
                      <div className="p-2.5 bg-white border border-rose-200 rounded-xl text-xs font-medium text-rose-900 mt-2">
                        <strong>Reason:</strong> {result.revocation_reason}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <span className="inline-block px-3 py-1 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-sm">
                      INVALID DEMO CARD
                    </span>
                    <h3 className="text-base font-extrabold text-rose-950">
                      Verification Failed
                    </h3>
                    <p className="text-xs text-rose-800 leading-relaxed max-w-lg mx-auto">
                      {result.verification_message || 'The specified Convocation Card ID could not be verified or the verification token has been tampered.'}
                    </p>
                  </div>
                )}

                {/* Verification Attributes Table (Privacy Preserved: Minimum Required Only) */}
                <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <h4 className="font-bold text-teal-dark uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-deep" />
                      <span>Card Verification Details</span>
                    </h4>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {result.convocation_year || '2027'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Verification Status</span>
                      <strong className={isValid ? 'text-emerald-700 font-bold' : isRevoked ? 'text-rose-700 font-bold' : 'text-stone-600'}>
                        {result.status_label || result.status}
                      </strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Convocation Card ID</span>
                      <strong className="font-mono text-teal-dark font-bold">{result.card_id || cardId || 'N/A'}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Candidate Name</span>
                      <strong className="text-stone-800 font-semibold">{result.candidate_name || 'N/A'}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Degree Level</span>
                      <strong className="text-stone-800">{result.degree_level || 'N/A'}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Academic Department</span>
                      <strong className="text-stone-800">{result.department || 'N/A'}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Convocation Year</span>
                      <strong className="text-stone-800">{result.convocation_year || '5th Convocation 2027'}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Card Issuance Date</span>
                      <strong className="text-stone-800">{result.issued_at || 'N/A'}</strong>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Demo Payment Status</span>
                      <strong className="text-emerald-700 font-bold">{result.payment_confirmation_status || 'Verified (Demo)'}</strong>
                    </div>
                  </div>

                  {/* Digital Signature Box */}
                  <div className="mt-3 pt-3 border-t border-stone-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-stone-200">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Digital Signature Verification</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck className={`w-4 h-4 ${result.digital_signature_verification === 'Valid' ? 'text-teal-deep' : 'text-rose-500'}`} />
                          <span className={`font-bold ${result.digital_signature_verification === 'Valid' ? 'text-teal-dark' : 'text-rose-600'}`}>
                            {result.digital_signature_verification === 'Valid' ? 'Valid (HMAC-SHA256 Authenticated)' : 'Invalid Signature'}
                          </span>
                        </div>
                      </div>
                      {result.digital_signature && (
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block">Signature Indicator</span>
                          <code className="text-[11px] font-mono text-teal-deep font-bold">{result.digital_signature}</code>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Privacy Assurance Notice */}
                  <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-500 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Protected:</strong> Student phone numbers, email addresses, passwords, full residential addresses, 
                      and guest personal records are strictly withheld from public verification displays.
                    </span>
                  </div>

                </div>

              </div>
            ) : null}

          </div>

          {/* Footer Strip */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500">
            Islamic University Bangladesh · Kushtia-7003 · 5th Convocation 2027 Educational Demonstration
          </div>

        </div>

      </div>
    </div>
  );
};
