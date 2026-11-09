import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, CheckCircle, ShieldAlert, 
  ArrowLeft, RefreshCw, CreditCard, ExternalLink, HelpCircle 
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  applicationId: string;
  totalAmount: number;
}

export const PaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  applicationId,
  totalAmount,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Rocket'>('bKash');
  const [paymentSession, setPaymentSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initiate simulation session whenever modal opens or method changes
  useEffect(() => {
    if (isOpen) {
      initiateSession(selectedMethod);
    } else {
      setSuccessMessage(null);
      setShowConfirmDialog(false);
    }
  }, [isOpen, selectedMethod]);

  const initiateSession = async (method: string) => {
    setLoading(true);
    try {
      const data = await api.initiatePayment(method);
      setPaymentSession(data);
    } catch (err: any) {
      console.error("Payment initiation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateConfirm = async () => {
    if (!paymentSession?.reference_id) return;
    setSimulating(true);
    try {
      const res = await api.simulatePayment(paymentSession.reference_id, 'SUCCESS');
      setSuccessMessage("DEMO PAYMENT SUCCESSFUL — NO REAL MONEY WAS TRANSFERRED.");
      setShowConfirmDialog(false);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Failed to simulate payment.");
    } finally {
      setSimulating(false);
    }
  };

  const handleCancelPayment = async () => {
    if (paymentSession?.reference_id) {
      try {
        await api.simulatePayment(paymentSession.reference_id, 'CANCEL');
      } catch (err) {
        console.error(err);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden my-6 relative">
        
        {/* Top Header */}
        <div className="bg-teal-dark text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold-warm" />
            <h2 className="text-base sm:text-lg font-bold">
              Convocation Payment Demonstration Gateway
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMessage ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-teal-dark">
              Simulation Succeeded!
            </h3>
            <p className="text-base font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 py-3 px-6 rounded-2xl max-w-lg mx-auto">
              {successMessage}
            </p>
            <div className="text-xs text-stone-500 font-mono">
              Reference ID: {paymentSession?.reference_id} · App ID: {applicationId}
            </div>
            <p className="text-xs text-stone-400">
              Redirecting to your student dashboard...
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Payment Method Selector Cards */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                Select Demonstration Payment Method
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('bKash')}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition ${
                    selectedMethod === 'bKash'
                      ? 'border-[#D12053] bg-pink-50/50 shadow-md ring-2 ring-[#D12053]/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#D12053] text-white flex items-center justify-center font-black text-sm">
                    bK
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-[#D12053] text-base block">bKash</span>
                    <span className="text-[11px] text-stone-500">Bangla QR Payment</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('Rocket')}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition ${
                    selectedMethod === 'Rocket'
                      ? 'border-[#8C3494] bg-purple-50/50 shadow-md ring-2 ring-[#8C3494]/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#8C3494] text-white flex items-center justify-center font-black text-sm">
                    RC
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-[#8C3494] text-base block">Rocket</span>
                    <span className="text-[11px] text-stone-500">Dutch-Bangla Bank QR</span>
                  </div>
                </button>
              </div>
            </div>

            {/* MANDATORY RED WARNING ABOVE QR CODE */}
            <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg border-2 border-rose-700 space-y-1 text-center">
              <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-black tracking-wider uppercase">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
                <span>⛔ DO NOT PAY — FOR TESTING / DEMONSTRATION PURPOSES ONLY</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-rose-100">
                NO REAL PAYMENT GATEWAY IS CONNECTED.
              </p>
              <p className="font-bengali text-xs sm:text-sm text-yellow-200 font-medium pt-1 border-t border-rose-500/80">
                এই QR কোড শুধুমাত্র ওয়েবসাইটের Demo প্রদর্শনের জন্য। অনুগ্রহ করে কোনো টাকা পাঠাবেন না।
              </p>
            </div>

            {/* QR Payment View: Desktop 2-Column Grid / Mobile Stacked */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Left Panel: QR Code Display */}
              <div className="md:col-span-5 bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-stone-600 mb-2">
                  {selectedMethod} Demonstration QR
                </span>

                <div className="bg-white p-3 rounded-2xl border-2 border-stone-200 shadow-md max-w-[240px] w-full">
                  <img
                    src={selectedMethod === 'bKash' ? '/assets/payment/BKash.jpg' : '/assets/payment/Rocket.jpg'}
                    alt={`${selectedMethod} Bangla QR Code`}
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>

                <p className="text-[11px] text-stone-500 mt-3 leading-snug">
                  Original reference QR asset from repository. Displayed exclusively to demonstrate UI layout.
                </p>
              </div>

              {/* Right Panel: Payment Summary & Functional Action Buttons */}
              <div className="md:col-span-7 space-y-4">
                
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Payment Method:</span>
                    <span className="font-bold text-teal-dark">{selectedMethod}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Application ID:</span>
                    <span className="font-mono font-bold text-teal-dark">{applicationId}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Demo Reference ID:</span>
                    <span className="font-mono font-bold text-teal-deep">
                      {paymentSession?.reference_id || 'Generating...'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Transaction Type:</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                      DEMONSTRATION ONLY
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-base font-extrabold text-teal-dark">
                    <span>Payable Amount:</span>
                    <span className="text-2xl font-black text-teal-deep">
                      {paymentSession?.formatted_amount || `৳${totalAmount.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* MANDATORY RED WARNING BELOW QR */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                  ⚠️ <strong>Notice:</strong> Clicking "Simulate Payment Success" will record a mock payment record in the local database. No bank accounts or cards are involved.
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDialog(true)}
                    className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Simulate Payment Success</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelPayment}
                    className="py-3.5 px-5 border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold rounded-xl transition text-sm text-center"
                  >
                    Cancel / Return
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmDialog && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-teal-dark">
                Confirm Simulated Payment
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                You are about to simulate a demonstration payment of{' '}
                <strong className="text-teal-deep">{paymentSession?.formatted_amount}</strong> via{' '}
                <strong>{selectedMethod}</strong>. No money will be charged.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulateConfirm}
                  disabled={simulating}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {simulating ? 'Recording...' : 'Yes, Confirm Simulation'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
