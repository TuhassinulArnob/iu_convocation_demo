import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  CreditCard, ShieldAlert, CheckCircle2, AlertTriangle, 
  ArrowLeft, ArrowRight, Clock, RefreshCw, XCircle, 
  HelpCircle, CheckCircle, Receipt, ExternalLink, QrCode, Lock 
} from 'lucide-react';
import { api, getAuthToken, clearAuthToken } from '../services/api';
import { PageHero } from '../components/PageHero';

export const PaymentPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState<any | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Rocket'>('bKash');
  
  // Gateway Demonstration State
  const [inGateway, setInGateway] = useState(false);
  const [activePayment, setActivePayment] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load application and fee details
  const loadData = async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login?redirect=/payment');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyApplication();
      setAppData(data);

      // Check if already paid
      if (data.has_paid) {
        // Look up the successful payment simulation
        const successful = data.payments.find((p: any) => p.status === 'DEMO SUCCESS');
        if (successful) {
          setSimulationResult({
            status: 'DEMO SUCCESS',
            reference_id: successful.reference_id,
            amount: successful.amount,
            message: 'DEMONSTRATION PAYMENT ALREADY COMPLETED.',
          });
        }
      }
    } catch (err: any) {
      console.error("Payment load error:", err);
      if (err.message.includes('credential') || err.message.includes('token') || err.message.includes('401')) {
        clearAuthToken();
        navigate('/login?redirect=/payment');
      } else {
        setError(err.message || "Failed to load application payment details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler: Proceed to Pay
  const handleProceedToPay = async () => {
    if (!selectedMethod) {
      alert("Please select a payment method (bKash or Rocket).");
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      const res = await api.initiatePayment(selectedMethod);
      setActivePayment(res);
      setInGateway(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || "Failed to initiate demonstration payment.");
    } finally {
      setProcessing(false);
    }
  };

  // Handler: Confirm Simulation
  const handleConfirmSimulation = async () => {
    setShowConfirmModal(false);
    if (!activePayment?.reference_id) return;

    setProcessing(true);
    setError(null);
    try {
      const res = await api.simulatePayment(activePayment.reference_id, 'SUCCESS');
      setSimulationResult(res);
      // Reload application data to synchronize status across app
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to simulate payment success.");
    } finally {
      setProcessing(false);
    }
  };

  // Handler: Cancel Payment
  const handleCancelPayment = async () => {
    if (activePayment?.reference_id) {
      try {
        await api.simulatePayment(activePayment.reference_id, 'CANCEL');
      } catch (err) {
        console.warn("Cancel signal error:", err);
      }
    }
    setInGateway(false);
    setActivePayment(null);
    setShowConfirmModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iu-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-deep animate-spin mx-auto" />
          <p className="text-sm font-semibold text-stone-600">Connecting to demonstration payment portal...</p>
        </div>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="min-h-screen bg-iu-bg p-8 text-center max-w-lg mx-auto pt-20">
        <div className="bg-white p-8 rounded-3xl border border-iu-border shadow-md space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-stone-800">No Application Found</h2>
          <p className="text-xs text-stone-500">
            Please register your convocation application before initiating fee payment.
          </p>
          <Link to="/register" className="inline-block px-5 py-2.5 bg-teal-deep text-white font-bold rounded-xl text-xs hover:bg-teal-hover">
            Register Application
          </Link>
        </div>
      </div>
    );
  }

  const isApproved = Boolean(appData.is_approved ?? (appData.status === 'Approved' || appData.status === 'Approved (Demo)'));
  const isAlreadyPaid = Boolean(appData.has_paid);
  const fee = appData.fee_breakdown;

  // APPROVAL GUARD: If not already paid and not approved, display approval required card
  if (!isAlreadyPaid && !isApproved) {
    return (
      <div className="min-h-screen bg-iu-bg pb-20">
        <PageHero
          title="Payment Portal"
          description="Fee payment is available following administrative approval"
          eyebrow="5TH CONVOCATION 2027"
        />
        <div className="max-w-xl mx-auto px-4 pt-10">
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wide border border-amber-300 inline-block">
                {appData.status.toLowerCase().includes('reject') ? 'Application Rejected' : 'Application Under Review'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-teal-dark pt-1">
                Payment Not Available
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                {appData.status.toLowerCase().includes('reject')
                  ? 'Your application was rejected during administrative verification. Fee payment cannot be initiated.'
                  : 'Your application is currently under review by the Convocation Committee. Fee payment will be enabled on your Student Dashboard once university staff approves your application.'}
              </p>
            </div>

            {appData.review_note && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 text-left">
                <strong>Review Note:</strong> {appData.review_note}
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl text-xs sm:text-sm shadow inline-flex items-center justify-center gap-2 transition"
              >
                <span>Return to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iu-bg pb-20 overflow-x-hidden w-full">
      
      {/* Top Banner */}
      <PageHero
        title={inGateway ? 'Payment Gateway' : 'Fee Payment'}
        description={inGateway 
          ? 'Scan simulated QR code with mobile banking app or click simulation button' 
          : 'Select your preferred mobile financial service to complete convocation enrollment.'}
        eyebrow="5TH CONVOCATION 2027 · SECURE PAYMENT PORTAL"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 w-full">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* CASE A: ALREADY PAID OR SIMULATION SUCCESS VIEW */}
        {/* ============================================================== */}
        {(simulationResult && simulationResult.status === 'DEMO SUCCESS') ? (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                DEMO TRANSACTION RECORDED
              </span>
              <h2 className="text-2xl font-black text-teal-dark pt-2">
                DEMONSTRATION PAYMENT COMPLETED
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                NO REAL MONEY WAS TRANSFERRED.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-left space-y-3 text-xs sm:text-sm font-mono break-words">
              <div className="flex justify-between border-b border-stone-200 pb-2 font-sans font-bold">
                <span className="text-stone-500">Application ID:</span>
                <span className="text-teal-dark">{appData.app_id}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-sans">Payment Reference:</span>
                <span className="text-stone-900 font-bold">{simulationResult.reference_id}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2 font-sans font-bold">
                <span className="text-stone-500">Amount Paid:</span>
                <span className="text-teal-deep text-base">৳ {simulationResult.amount ? simulationResult.amount.toFixed(2) : fee?.total_payable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-stone-500">Transaction Status:</span>
                <span className="text-emerald-700 font-bold">DEMO SUCCESS ✓</span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 text-left">
              <strong>Registration Confirmed:</strong> Your convocation seat and attendance have been secured in the university database.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition"
              >
                <span>Go to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={`/track-application?app_id=${appData.app_id}`}
                className="w-full sm:w-auto px-6 py-3 border border-stone-300 text-stone-700 font-bold rounded-xl text-xs sm:text-sm hover:bg-stone-50 flex items-center justify-center gap-2 transition"
              >
                <span>Track Application</span>
              </Link>
            </div>
          </div>
        ) : inGateway && activePayment ? (
          
          /* ============================================================== */
          /* STAGE 2: DEDICATED PAYMENT DEMONSTRATION GATEWAY PAGE           */
          /* ============================================================== */
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200 w-full">
            
            {/* Gateway Window */}
            <div className="bg-white rounded-3xl border-2 border-iu-border shadow-2xl overflow-hidden w-full">
              
              {/* Gateway Top Bar */}
              <div className={`p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                activePayment.payment_method === 'bKash' 
                  ? 'bg-gradient-to-r from-[#D12053] to-[#A0143E]' 
                  : 'bg-gradient-to-r from-[#8C3494] to-[#5C1B63]'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg shrink-0">
                    {activePayment.payment_method === 'bKash' ? 'bK' : 'RC'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black leading-tight truncate">
                      {activePayment.payment_method} Merchant Checkout
                    </h2>
                    <p className="text-[11px] text-white/80">
                      IU 5th Convocation 2027 (Demo)
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-white/70 block">Total Amount</span>
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {activePayment.formatted_amount}
                  </span>
                </div>
              </div>

              {/* CRITICAL PROMINENT RED WARNING */}
              <div className="bg-rose-50 border-y-2 border-rose-300 p-4 text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 text-rose-700 font-black text-sm uppercase tracking-wide">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>⛔ DO NOT PAY — DEMONSTRATION ONLY</span>
                </div>
                <p className="text-xs text-rose-900 font-semibold max-w-xl mx-auto leading-relaxed">
                  NO REAL TRANSACTION WILL OCCUR. Do NOT transfer real money. These QR codes are displayed exclusively to test the application interface.
                </p>
                <p className="font-bengali text-xs text-rose-900 font-bold">
                  এই QR কোড শুধুমাত্র Demo প্রদর্শনের জন্য। অনুগ্রহ করে কোনো টাকা পাঠাবেন না।
                </p>
              </div>

              {/* Main Gateway Body */}
              <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* Left: Original Local QR Code Display */}
                <div className="md:col-span-6 flex flex-col items-center justify-center text-center space-y-3 w-full">
                  <div className="p-3 bg-stone-50 border-2 border-stone-200 rounded-2xl shadow-inner max-w-[260px] sm:max-w-[280px] w-full">
                    <img
                      src={activePayment.qr_image}
                      alt={`${activePayment.payment_method} QR Demonstration`}
                      className="w-full h-auto object-contain rounded-xl shadow-sm"
                    />
                  </div>
                  <span className="text-[11px] text-stone-500 font-semibold">
                    Original {activePayment.payment_method} Bangla QR Image
                  </span>
                </div>

                {/* Right: Payment Metadata & Simulator Actions */}
                <div className="md:col-span-6 space-y-5 w-full">
                  
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2.5 text-xs font-mono break-words">
                    <div className="flex justify-between border-b border-stone-200 pb-1.5 font-sans">
                      <span className="text-stone-500">Application ID:</span>
                      <strong className="text-teal-dark">{activePayment.application_id}</strong>
                    </div>
                    <div className="flex justify-between border-b border-stone-200 pb-1.5">
                      <span className="text-stone-500 font-sans">Invoice Ref:</span>
                      <strong className="text-stone-900">{activePayment.reference_id}</strong>
                    </div>
                    <div className="flex justify-between border-b border-stone-200 pb-1.5 font-sans">
                      <span className="text-stone-500">Status:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold uppercase text-[10px]">
                        {activePayment.status}
                      </span>
                    </div>
                    <div className="flex justify-between font-sans">
                      <span className="text-stone-500">Transaction Type:</span>
                      <span className="text-teal-deep font-bold text-[10px]">DEMONSTRATION</span>
                    </div>
                  </div>

                  {/* Step Instructions */}
                  <div className="space-y-2 text-xs text-stone-600">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-deep font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                      <p>In production, you scan this QR using the official {activePayment.payment_method} app.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-deep font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                      <p>For this evaluation demo, simulate payment success by clicking below.</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={processing}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{processing ? 'Processing Simulation...' : 'Simulate Payment Success'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelPayment}
                      disabled={processing}
                      className="w-full py-2.5 border border-stone-300 text-stone-600 hover:text-stone-800 hover:bg-stone-50 font-bold rounded-xl text-xs transition"
                    >
                      Cancel Payment
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>

        ) : (

          /* ============================================================== */
          /* STAGE 1: PAYMENT GATEWAY SELECTION PAGE                        */
          /* ============================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            
            {/* Left Column: Method Selection (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-8 space-y-6 w-full">
              <div>
                <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">PAYMENT STEP</span>
                <h2 className="text-xl sm:text-2xl font-black text-teal-dark mt-1">
                  Select Payment Method
                </h2>
                <p className="text-xs text-stone-500">
                  Select a mobile banking service to simulate convocation fee payment.
                </p>
              </div>

              {/* Method Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                
                {/* bKash Card */}
                <div
                  onClick={() => setSelectedMethod('bKash')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    selectedMethod === 'bKash'
                      ? 'border-[#D12053] bg-rose-50/40 ring-2 ring-[#D12053]/30 shadow-md'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-[#D12053] text-white">
                      bKash
                    </span>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMethod === 'bKash'}
                      onChange={() => setSelectedMethod('bKash')}
                      className="w-4 h-4 text-[#D12053] focus:ring-[#D12053]"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-stone-800">bKash QR Merchant</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Pay using official bKash Bangla QR interface</p>
                  </div>

                  <span className="text-[11px] text-stone-400 font-mono">Instant Demo Simulation</span>
                </div>

                {/* Rocket Card */}
                <div
                  onClick={() => setSelectedMethod('Rocket')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    selectedMethod === 'Rocket'
                      ? 'border-[#8C3494] bg-purple-50/40 ring-2 ring-[#8C3494]/30 shadow-md'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-[#8C3494] text-white">
                      Rocket
                    </span>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMethod === 'Rocket'}
                      onChange={() => setSelectedMethod('Rocket')}
                      className="w-4 h-4 text-[#8C3494] focus:ring-[#8C3494]"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-stone-800">Rocket DBBL</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Dutch-Bangla Bank Rocket QR gateway simulation</p>
                  </div>

                  <span className="text-[11px] text-stone-400 font-mono">Instant Demo Simulation</span>
                </div>

              </div>

              {/* Security & Disclaimer Note */}
              <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-xs text-teal-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-dark">
                  <ShieldAlert className="w-4 h-4 text-teal-deep shrink-0" />
                  <span>Educational Sandbox Environment</span>
                </div>
                <p className="leading-relaxed">
                  Clicking "Proceed to Pay" generates an official demonstration transaction record and opens the simulation payment gateway with original university QR demonstration assets.
                </p>
              </div>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={handleProceedToPay}
                disabled={processing || isAlreadyPaid}
                className="w-full py-4 bg-teal-deep hover:bg-teal-hover text-white font-extrabold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <span>{processing ? 'Connecting Gateway...' : isAlreadyPaid ? 'Fee Already Paid (Demo)' : 'Proceed to Pay'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

            {/* Right Column: Fee Summary Panel (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-8 space-y-6 w-full min-w-0">
              <div className="border-b border-stone-100 pb-3 min-w-0">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Candidate Details</span>
                <h3 className="text-lg font-bold text-teal-dark mt-0.5 break-words">{appData.full_name}</h3>
                <p className="text-xs text-stone-500 font-mono break-words">ID: {appData.app_id} · Roll: {appData.roll_number}</p>
              </div>

              {/* Fee Breakdown Details */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Registration Fee ({appData.registration_category || 'Regular'}):</span>
                  <span className="font-bold text-stone-800">৳ {fee?.registration_fee ? fee.registration_fee.toFixed(2) : '4,500.00'}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Original Certificate Fee:</span>
                  <span className="font-bold text-stone-800">
                    {fee?.certificate_fee > 0 ? `৳ ${fee.certificate_fee.toFixed(2)}` : '৳ 0.00 (Waived/Held)'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Guest Fee ({fee?.chargeable_guests || 0} chargeable):</span>
                  <span className="font-bold text-stone-800">৳ {fee?.guest_fee ? fee.guest_fee.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Online Service Charge:</span>
                  <span className="font-bold text-stone-800">৳ {fee?.service_charge ? fee.service_charge.toFixed(2) : '32.50'}</span>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-base sm:text-lg font-black text-teal-dark">
                  <span>Total Payable:</span>
                  <span className="text-teal-deep text-2xl font-mono">
                    {fee?.formatted_total || `৳ ${fee?.total_payable ? fee.total_payable.toFixed(2) : '4,532.50'}`}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-semibold">Payment Status:</span>
                <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[11px] ${
                  isAlreadyPaid 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {isAlreadyPaid ? 'DEMO SUCCESS' : 'PAYMENT DUE'}
                </span>
              </div>

            </div>

          </div>

        )}

      </div>

      {/* Confirmation Modal for Simulation */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-teal-dark">
                Confirm Simulated Payment?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                This is a testing simulation. Clicking confirm will record a <strong>DEMO SUCCESS</strong> status in the database without transferring actual money.
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 text-xs font-mono text-stone-700 text-left space-y-1 border border-stone-200 break-words">
              <div>Method: <strong>{activePayment?.payment_method}</strong></div>
              <div>Reference: <strong>{activePayment?.reference_id}</strong></div>
              <div>Amount: <strong>{activePayment?.formatted_amount}</strong></div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2.5 border border-stone-300 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-50 transition"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSimulation}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow"
              >
                Yes, Simulate Success
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
