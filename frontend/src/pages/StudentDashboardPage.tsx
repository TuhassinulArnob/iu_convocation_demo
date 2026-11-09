import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, GraduationCap, CreditCard, Award, Printer, 
  Download, Clock, CheckCircle, CheckCircle2, AlertTriangle, FileText, 
  ExternalLink, Sparkles, RefreshCw, X, Lock, AlertCircle 
} from 'lucide-react';
import { api, getAuthToken, clearAuthToken } from '../services/api';
import { PaymentModal } from '../components/PaymentModal';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [appData, setAppData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<any | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [convocationCard, setConvocationCard] = useState<any | null>(null);

  const fetchAppData = async () => {
    setLoading(true);
    try {
      const data = await api.getMyApplication();
      setAppData(data);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      if (err.message.includes('credential') || err.message.includes('token') || err.message.includes('401')) {
        clearAuthToken();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleOpenConvocationCard = async () => {
    try {
      const card = await api.getMyConvocationCard();
      setConvocationCard(card);
      setShowCardModal(true);
    } catch (err: any) {
      alert(err.message || "Failed to load convocation card.");
    }
  };

  const handleOpenReceipt = async (referenceId: string) => {
    try {
      const rec = await api.getPaymentReceipt(referenceId);
      setShowReceiptModal(rec);
    } catch (err: any) {
      alert(err.message || "Failed to load receipt.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iu-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-deep animate-spin mx-auto" />
          <p className="text-sm font-semibold text-stone-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="min-h-screen bg-iu-bg p-8 text-center">
        <h2 className="text-lg font-bold text-stone-700">No application found.</h2>
        <Link to="/register" className="mt-4 inline-block text-teal-deep underline">
          Create an application
        </Link>
      </div>
    );
  }

  const isApproved = Boolean(appData.is_approved ?? (appData.status === 'Approved' || appData.status === 'Approved (Demo)'));
  const hasPaid = Boolean(appData.has_paid);
  const isRejected = Boolean(appData.status?.toLowerCase().includes('reject'));
  const isPending = !isApproved && !isRejected;
  const canPay = Boolean(appData.can_pay ?? (isApproved && !hasPaid));

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Header */}
      <div className="bg-teal-dark text-white py-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-gold-warm uppercase tracking-widest block mb-1">
              STUDENT DEMONSTRATION DASHBOARD
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome, {appData.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 mt-1 font-mono">
              Application ID: {appData.app_id} · Roll: {appData.roll_number}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isApproved && hasPaid && (
              <button
                onClick={handleOpenConvocationCard}
                className="px-4 py-2 bg-gold-warm hover:bg-gold-hover text-stone-900 font-bold rounded-xl text-xs sm:text-sm shadow flex items-center gap-2 transition"
              >
                <Award className="w-4 h-4" />
                <span>View Convocation Card</span>
              </button>
            )}
            <Link
              to={`/track-application?app_id=${appData.app_id}`}
              className="px-4 py-2 border border-white/30 text-white rounded-xl text-xs sm:text-sm hover:bg-white/10 transition"
            >
              Public Tracking
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Status Banner according to Official Workflow */}
            {hasPaid ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wide border border-emerald-300 w-fit">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Registration Complete
                  </span>
                  <span className="text-xs font-bold text-emerald-800">Demo Payment Verified</span>
                </div>
                <h3 className="text-lg font-bold text-emerald-950">
                  Payment received. Your convocation registration is confirmed.
                </h3>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                  Your seat and ceremony attendance credentials are confirmed. You can now download or print your official Convocation Card and keep your payment receipt for records.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={handleOpenConvocationCard}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow flex items-center gap-2 transition"
                  >
                    <Award className="w-4 h-4" />
                    <span>Download / Print Convocation Card</span>
                  </button>
                  {appData.payments && appData.payments.length > 0 && (
                    <button
                      onClick={() => handleOpenReceipt(appData.payments[0].reference_id)}
                      className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Payment Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            ) : isRejected ? (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold uppercase tracking-wide border border-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Application Rejected
                  </span>
                </div>
                <h3 className="text-lg font-bold text-rose-950">
                  Application Verification Unsuccessful
                </h3>
                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                  {appData.review_note 
                    ? `Reason: ${appData.review_note}`
                    : "Your application could not be verified against the university graduation registry. Please review your details or contact the convocation helpdesk."}
                </p>
                <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Payment is not available for rejected applications.</span>
                </div>
              </div>
            ) : isApproved ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wide border border-emerald-300 w-fit">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Application Approved
                  </span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Payment Due
                  </span>
                </div>
                <h3 className="text-lg font-bold text-emerald-950">
                  Congratulations! Your convocation application has been approved.
                </h3>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                  The Convocation Committee has verified your academic credentials. Please proceed to payment to confirm your ceremony registration and gown allocation.
                </p>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-stone-500 block">Total Amount Payable</span>
                    <span className="text-xl font-black text-teal-dark font-mono">
                      {appData.fee_breakdown?.formatted_total || '৳ 4,532.50'}
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">Registration Deadline: 25 November 2026</span>
                  </div>
                  <Link
                    to="/payment"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Now (Simulate Gateway)</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wide border border-amber-300">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Application Under Review
                  </span>
                </div>
                <h3 className="text-lg font-bold text-amber-950">
                  Verification in Progress
                </h3>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                  Your application has been submitted and is currently being reviewed by the Convocation Committee. You will be able to proceed with payment once your application is approved.
                </p>
                <div className="p-3.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                  <span><strong>Payment Locked:</strong> Payment will be enabled after your application is approved by university staff.</span>
                </div>
              </div>
            )}

            {/* Academic & Personal Profile Card */}
            <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="font-bold text-teal-dark text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-deep" />
                  <span>Candidate Profile & Registration</span>
                </h3>
                <span className="text-xs font-mono text-stone-400">{appData.registration_number || 'REG-PENDING'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Photo Preview */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-40 rounded-xl overflow-hidden border-2 border-stone-200 bg-stone-100 shadow flex items-center justify-center mb-2">
                    {appData.photo_url ? (
                      <img src={appData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-stone-300" />
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500 font-semibold">Official Passport Photo</span>
                </div>

                {/* Details list */}
                <div className="sm:col-span-2 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Department:</span>
                    <span className="font-bold text-teal-dark">{appData.department_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Degree Level:</span>
                    <span className="font-semibold text-stone-800">{appData.degree_level} ({appData.registration_category})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Admission Session:</span>
                    <span className="font-semibold text-stone-800">{appData.admission_session}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Gown Size:</span>
                    <span className="font-bold text-teal-deep">{appData.gown_size}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Registered Guests:</span>
                    <span className="font-bold text-teal-deep">{appData.guest_count} guests</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Mobile & Email:</span>
                    <span className="font-medium text-stone-700">{appData.mobile} · {appData.email}</span>
                  </div>
                </div>
              </div>

              {/* Guests List if any */}
              {appData.guest_details?.length > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <span className="text-xs font-bold text-stone-600 block mb-2">Guest Information:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {appData.guest_details.map((g: any, i: number) => (
                      <div key={i} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                        <strong className="block text-teal-dark">{g.name || `Guest ${i+1}`}</strong>
                        <span className="text-stone-500">{g.relation} · {g.age} yrs</span>
                        {g.under_five && (
                          <span className="block text-[10px] text-emerald-700 font-bold mt-0.5">Under 5 (Free)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Demonstration History */}
            <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h3 className="font-bold text-teal-dark text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-deep" />
                  <span>Demonstration Payment History</span>
                </h3>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="text-xs text-teal-deep font-bold hover:underline"
                >
                  + New Simulation
                </button>
              </div>

              {appData.payments?.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
                  No payment records found. Click "Simulate Payment Now" to test the QR gateway.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px]">
                        <th className="py-2">Reference ID</th>
                        <th className="py-2">Method</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {appData.payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-2.5 font-mono font-bold text-teal-dark">{p.reference_id}</td>
                          <td className="py-2.5">{p.payment_method}</td>
                          <td className="py-2.5 font-bold">৳ {p.amount.toFixed(2)}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'DEMO SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <button
                              onClick={() => handleOpenReceipt(p.reference_id)}
                              className="text-teal-deep hover:underline font-semibold"
                            >
                              View Demo Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right Column (4 cols): Fee Breakdown & Timeline */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Fee Breakdown Card */}
            <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-teal-dark text-sm uppercase tracking-wider mb-2">
                Fee Breakdown
              </h3>
              
              {appData.fee_breakdown ? (
                <div className="space-y-2 text-xs divide-y divide-stone-100">
                  <div className="flex justify-between pt-1">
                    <span className="text-stone-500">Registration Fee:</span>
                    <span className="font-bold">৳ {appData.fee_breakdown.registration_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-stone-500">Certificate Fee:</span>
                    <span className="font-bold">৳ {appData.fee_breakdown.certificate_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-stone-500">Guest Fee:</span>
                    <span className="font-bold">৳ {appData.fee_breakdown.guest_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-stone-500">Service Charge:</span>
                    <span className="font-bold">৳ {appData.fee_breakdown.service_charge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-3 text-sm font-black text-teal-dark">
                    <span>Total Payable:</span>
                    <span className="text-teal-deep text-lg">{appData.fee_breakdown.formatted_total}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500">Fee not yet calculated.</p>
              )}
            </div>

            {/* Convocation Card Action */}
            <div className="bg-gradient-to-br from-[#075C55] to-[#153A37] text-white rounded-2xl p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-gold-warm font-bold text-sm">
                <Award className="w-5 h-5" />
                <span>Ceremony Convocation Card</span>
              </div>
              <p className="text-xs text-stone-200 leading-relaxed">
                {isApproved && hasPaid
                  ? "Your application is approved and fee paid! You can now view and print your official Convocation Entry Card."
                  : isApproved && !hasPaid
                  ? "Application approved! Complete your registration fee payment to unlock and generate your official Convocation Card."
                  : "Convocation card is issued after university staff approval and confirmed fee payment."}
              </p>
              <button
                onClick={handleOpenConvocationCard}
                disabled={!(isApproved && hasPaid)}
                className="w-full py-2.5 px-4 bg-gold-warm hover:bg-gold-hover text-stone-900 font-bold rounded-xl text-xs transition disabled:opacity-40 disabled:cursor-not-allowed shadow flex items-center justify-center gap-1.5"
              >
                {!(isApproved && hasPaid) && <Lock className="w-3.5 h-3.5" />}
                <span>
                  {isApproved && hasPaid
                    ? 'Open Convocation Card'
                    : isApproved
                    ? 'Payment Required to Unlock'
                    : 'Pending Admin Approval'}
                </span>
              </button>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-3">
              <h3 className="font-bold text-teal-dark text-xs uppercase tracking-wider">
                Application History Log
              </h3>
              <div className="relative border-l-2 border-stone-200 ml-2 pl-4 space-y-3 text-xs">
                {appData.status_history?.map((h: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-deep" />
                    <span className="font-bold text-stone-700 block">{h.new_status}</span>
                    <span className="text-[10px] text-stone-400">{h.admin_identifier}</span>
                    {h.review_note && (
                      <p className="text-[11px] text-stone-500 mt-0.5">{h.review_note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          fetchAppData();
        }}
        applicationId={appData.app_id}
        totalAmount={appData.fee_breakdown?.total_payable || 4532.50}
      />

      {/* Demonstration Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-stone-200">
            <button
              onClick={() => setShowReceiptModal(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Watermark Banner */}
            <div className="bg-amber-100 text-amber-900 border border-amber-300 p-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider mb-4">
              DEMO ONLY — NOT A VALID PAYMENT RECEIPT.
            </div>

            <div className="text-center pb-4 border-b border-stone-200">
              <img src="/assets/logo/iuLogo.png" alt="IU Logo" className="h-12 mx-auto mb-2" />
              <h3 className="font-bold text-teal-dark text-base">Islamic University Bangladesh</h3>
              <p className="text-xs text-stone-500">5th Convocation 2027 · Demonstration Receipt</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Receipt Ref:</span>
                <span className="font-mono font-bold text-teal-dark">{showReceiptModal.reference_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Application ID:</span>
                <span className="font-mono font-bold text-teal-dark">{showReceiptModal.application_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Candidate Name:</span>
                <span className="font-bold text-stone-800">{showReceiptModal.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Method:</span>
                <span className="font-bold text-stone-800">{showReceiptModal.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Transaction Status:</span>
                <span className="font-bold text-emerald-700">{showReceiptModal.status}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-100 text-sm font-black text-teal-dark">
                <span>Amount Paid:</span>
                <span className="text-teal-deep text-lg">{showReceiptModal.formatted_amount}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-deep text-white text-xs font-bold rounded-xl"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(null)}
                className="px-4 py-2 border border-stone-200 text-xs font-medium rounded-xl text-stone-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convocation Card Modal matching Section 13 */}
      {showCardModal && convocationCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl relative border-4 border-teal-deep my-6 overflow-hidden">
            
            {/* Watermark Banner */}
            <div className="bg-rose-600 text-white text-center py-2 px-4 text-xs font-black tracking-wider uppercase">
              {convocationCard.watermark}
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-teal-deep/30">
                <div className="flex items-center gap-3">
                  <img src="/assets/logo/iuLogo.png" alt="IU Logo" className="h-16 w-auto" />
                  <div>
                    <h2 className="text-xl font-black text-teal-dark leading-tight">
                      Islamic University Bangladesh
                    </h2>
                    <p className="font-bengali text-sm text-gold-warm font-semibold">
                      পঞ্চম সমাবর্তন ২০২৭ · সমাবর্তন কার্ড
                    </p>
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">
                      OFFICIAL CONVOCATION ENTRY PASS (DEMO)
                    </p>
                  </div>
                </div>
                <img src="/assets/logo/convoLogo.png" alt="Convo Logo" className="h-16 w-auto" />
              </div>

              {/* Main Card Body */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                
                {/* Photo & QR */}
                <div className="sm:col-span-4 flex flex-col items-center text-center space-y-2">
                  <div className="w-28 h-36 rounded-lg overflow-hidden border-2 border-teal-deep bg-stone-100 shadow">
                    {convocationCard.photo_url ? (
                      <img src={convocationCard.photo_url} alt="Candidate" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-stone-400 m-auto mt-10" />
                    )}
                  </div>
                  <div className="p-1 bg-stone-100 rounded border border-stone-200 text-[10px] font-mono text-stone-600 w-full">
                    {convocationCard.qr_demo_code}
                  </div>
                </div>

                {/* Candidate Information */}
                <div className="sm:col-span-8 space-y-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Candidate Name</span>
                    <strong className="text-base text-teal-dark">{convocationCard.student_name}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Application ID</span>
                      <strong className="font-mono text-teal-deep">{convocationCard.app_id}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Roll / Reg Number</span>
                      <strong className="font-mono text-stone-800">{convocationCard.roll_number}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Department</span>
                    <strong className="text-stone-800">{convocationCard.department}</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Degree</span>
                      <strong className="text-stone-800">{convocationCard.degree}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Session</span>
                      <strong className="text-stone-800">{convocationCard.session}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Gown Size</span>
                      <strong className="text-teal-deep font-bold">{convocationCard.gown_size}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Ceremony Details Strip */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-teal-dark">Ceremony Date & Time:</span>
                  <span className="font-semibold text-stone-800">{convocationCard.ceremony_date} · {convocationCard.ceremony_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-teal-dark">Venue:</span>
                  <span className="font-semibold text-stone-800">{convocationCard.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-teal-dark">Registered Guests:</span>
                  <span className="font-semibold text-stone-800">{convocationCard.guest_count} persons</span>
                </div>
              </div>

              {/* Print and Close Buttons */}
              <div className="pt-2 flex justify-between items-center no-print">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl text-xs transition shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Convocation Card</span>
                </button>
                <button
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-50"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
