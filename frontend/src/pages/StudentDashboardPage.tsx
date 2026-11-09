import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, GraduationCap, CreditCard, Award, Printer, 
  Download, Clock, CheckCircle, CheckCircle2, AlertTriangle, FileText, 
  ExternalLink, Sparkles, RefreshCw, X, Lock, AlertCircle, Edit3, 
  Upload, Save, Send, ShieldCheck, Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

  // Application Correction Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editResubmitting, setEditResubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setRefreshing(true);
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
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppData();

    // Auto-poll every 6 seconds to immediately reflect status changes without manual refresh
    const pollInterval = setInterval(() => {
      fetchAppData(true);
    }, 6000);

    return () => clearInterval(pollInterval);
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

  // Open Edit Modal and pre-populate
  const handleOpenEditModal = async () => {
    if (!appData) return;

    if (departments.length === 0) {
      try {
        const res = await api.getDepartments();
        setDepartments(res.departments || []);
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    }

    setEditFormData({
      full_name: appData.full_name || '',
      father_name: appData.father_name || '',
      mother_name: appData.mother_name || '',
      date_of_birth: appData.date_of_birth || '',
      gender: appData.gender || 'Male',
      mobile: appData.mobile || '',
      email: appData.email || '',
      present_address: appData.present_address || '',
      permanent_address: appData.permanent_address || '',
      department_id: appData.department_id || 1,
      degree_level: appData.degree_level || 'Honours',
      registration_category: appData.registration_category || 'Regular',
      admission_session: appData.admission_session || '',
      roll_number: appData.roll_number || '',
      registration_number: appData.registration_number || '',
      gown_size: appData.gown_size || 'L',
      photo_url: appData.photo_url || '',
      original_certificate_held: appData.original_certificate_held || false,
      guest_count: appData.guest_count || 0,
      guest_details: appData.guest_details || [],
    });

    setEditError(null);
    setEditSuccessMessage(null);
    setShowEditModal(true);
  };

  // Handle saving changes as draft without resubmitting
  const handleSaveChanges = async () => {
    setEditSaving(true);
    setEditError(null);
    setEditSuccessMessage(null);
    try {
      await api.updateMyApplication(editFormData);
      setEditSuccessMessage("Changes saved successfully to database! You can review and resubmit whenever ready.");
      // Refresh background app data
      const updated = await api.getMyApplication();
      setAppData(updated);
    } catch (err: any) {
      setEditError(err.message || "Failed to save application changes.");
    } finally {
      setEditSaving(false);
    }
  };

  // Handle photo upload within edit modal
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    setPhotoUploadError(null);
    try {
      const uploadRes = await api.uploadPhoto(file);
      setEditFormData((prev: any) => ({ ...prev, photo_url: uploadRes.photo_url }));
    } catch (err: any) {
      setPhotoUploadError(err.message || "Failed to upload photograph. Ensure format is JPG/PNG and under 2MB.");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Handle final resubmission
  const handleResubmitApplication = async () => {
    // Validation
    if (!editFormData.full_name?.trim()) {
      setEditError("Full candidate name is required.");
      return;
    }
    if (!editFormData.department_id) {
      setEditError("Academic department is required.");
      return;
    }
    if (!editFormData.roll_number?.trim()) {
      setEditError("Roll number is required.");
      return;
    }
    if (!editFormData.photo_url) {
      setEditError("A passport photograph is required before resubmission.");
      return;
    }

    setEditResubmitting(true);
    setEditError(null);
    setEditSuccessMessage(null);

    try {
      // 1. Save all updated fields
      await api.updateMyApplication(editFormData);

      // 2. Trigger resubmission endpoint
      const res = await api.resubmitMyApplication();

      // 3. Refresh app data
      const updated = await api.getMyApplication();
      setAppData(updated);
      setShowEditModal(false);
      alert(res.message || "Your application has been successfully resubmitted and is now under administrative review!");
    } catch (err: any) {
      setEditError(err.message || "Resubmission failed. Please check all fields.");
    } finally {
      setEditResubmitting(false);
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

  const statusLower = (appData.status || '').toLowerCase().trim();
  const isCorrectionRequired = Boolean(
    appData.is_correction_required || 
    statusLower.includes('correct') ||
    Boolean(appData.correction_instructions && !appData.is_approved)
  );
  const isApproved = !isCorrectionRequired && Boolean(
    appData.is_approved || 
    statusLower === 'approved' || 
    statusLower === 'approved (demo)'
  );
  const isRejected = !isCorrectionRequired && !isApproved && Boolean(
    appData.is_rejected || 
    statusLower.includes('reject')
  );
  const hasPaid = Boolean(appData.has_paid);
  const canEdit = Boolean(
    appData.can_edit || 
    isCorrectionRequired || 
    statusLower === 'draft' || 
    statusLower === 'form incomplete' || 
    statusLower === 'account created'
  );
  const isUnderReview = Boolean(!isApproved && !isRejected && !isCorrectionRequired);

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
            <button
              onClick={() => fetchAppData(false)}
              disabled={refreshing}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition border border-white/20"
              title="Refresh latest status from university records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
            </button>

            {canEdit && (
              <button
                onClick={handleOpenEditModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold rounded-xl text-xs sm:text-sm shadow flex items-center gap-2 transition"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Application</span>
              </button>
            )}

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
            {isCorrectionRequired ? (
              /* A. CORRECTION REQUIRED BANNER */
              <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wide border border-amber-300 w-fit">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Correction Required
                  </span>
                  {appData.correction_requested_at && (
                    <span className="text-[11px] font-semibold text-amber-800">
                      Requested on: {appData.correction_requested_at}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-amber-950">
                    Correction Required — Please update the requested information.
                  </h3>
                  
                  {/* Exact Admin Correction Instructions */}
                  <div className="mt-2.5 p-4 bg-white rounded-xl border border-amber-300 text-xs text-amber-950 space-y-1.5">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                      Administrative Correction Instructions:
                    </span>
                    <p className="leading-relaxed font-semibold text-stone-800 whitespace-pre-line">
                      {appData.correction_instructions || appData.review_note || "Please review and rectify the requested application information."}
                    </p>
                  </div>
                </div>

                {/* Requested Categories */}
                {appData.correction_categories?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                      Categories Requiring Attention:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {appData.correction_categories.map((cat: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 rounded-lg bg-amber-200/90 border border-amber-400 text-amber-950 font-bold text-xs flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>{cat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap gap-3 items-center">
                  <button
                    onClick={handleOpenEditModal}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Application & Resubmit</span>
                  </button>
                  <span className="text-xs text-amber-800 font-medium">
                    Application editing is enabled. Update details and click Resubmit to return to review.
                  </span>
                </div>
              </div>
            ) : hasPaid ? (
              /* B. PAYMENT VERIFIED & COMPLETED */
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
              /* C. REJECTED */
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
              /* D. APPROVED (PAYMENT DUE) */
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
                  The Convocation Committee has verified your academic credentials. Application editing is locked. 
                  Please proceed to payment to confirm your ceremony registration and gown allocation.
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
              /* E. UNDER REVIEW */
              <div className="bg-sky-50 border-2 border-sky-300 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-extrabold uppercase tracking-wide border border-sky-300 w-fit">
                    <Clock className="w-4 h-4 text-sky-600" />
                    Application Under Review
                  </span>
                  {appData.resubmitted_at && (
                    <span className="text-[11px] font-semibold text-sky-800">
                      Resubmitted on: {appData.resubmitted_at}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-sky-950">
                  Verification in Progress
                </h3>
                <p className="text-xs sm:text-sm text-sky-900 leading-relaxed">
                  Your application has been submitted and is currently being reviewed by the Convocation Committee. 
                  Editing is disabled while under administrative review. You will be able to proceed with payment once your application is approved.
                </p>
                <div className="p-3 bg-white border border-sky-200 rounded-xl text-xs text-stone-600 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                    <span><strong>Editing Disabled:</strong> Changes cannot be submitted while your application is under active review.</span>
                  </div>
                  <button
                    disabled
                    className="px-3 py-1.5 bg-stone-100 text-stone-400 rounded-lg text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Edit Disabled</span>
                  </button>
                </div>
              </div>
            )}

            {/* Academic & Personal Profile Card */}
            <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-deep" />
                  <h3 className="font-bold text-teal-dark text-base">Candidate Profile & Registration</h3>
                </div>
                
                {/* Action button inside profile card */}
                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      Correction Active
                    </span>
                    <button
                      onClick={handleOpenEditModal}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Information</span>
                    </button>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500 text-xs font-medium flex items-center gap-1.5 border border-stone-200 w-fit">
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Editing Locked</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Photo Preview */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-40 rounded-xl overflow-hidden border-2 border-stone-200 bg-stone-100 shadow flex items-center justify-center mb-2 relative">
                    {appData.photo_url ? (
                      <img src={appData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-stone-300" />
                    )}
                    {canEdit && (
                      <div className="absolute top-1.5 right-1.5 bg-amber-500 text-stone-950 p-1 rounded-md shadow" title="Photo can be changed">
                        <Edit3 className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500 font-semibold">Official Passport Photo</span>
                  {canEdit ? (
                    <button
                      onClick={handleOpenEditModal}
                      className="mt-2 w-full max-w-[130px] px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-700" />
                      <span>Change Photo</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-medium flex items-center justify-center gap-1 mt-1">
                      <Lock className="w-3 h-3" /> Photo Locked
                    </span>
                  )}
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
                    <span className="text-stone-500">Roll / Reg Number:</span>
                    <span className="font-mono font-bold text-stone-800">{appData.roll_number} / {appData.registration_number || 'N/A'}</span>
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

              {/* Bottom Card Action Bar based on Correction Status */}
              {canEdit ? (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-amber-950 font-bold text-sm">
                        Admin Requested Application Corrections
                      </strong>
                      <p className="text-amber-900 leading-relaxed text-xs mt-0.5 font-medium">
                        {appData.correction_instructions || appData.review_note || "Please review and rectify the requested application information."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenEditModal}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit & Resubmit Application</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-stone-500">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>Application data is locked. Edits can only be submitted if university staff explicitly requests correction.</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold uppercase text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded shrink-0">
                    Status: {appData.status}
                  </span>
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
                  ? "Your application is approved and fee paid! You can now view, verify, and print your official Convocation Entry Card with cryptographic QR code."
                  : isApproved && !hasPaid
                  ? "Application approved! Complete your registration fee payment to unlock and generate your official Convocation Card."
                  : isCorrectionRequired
                  ? "Application requires correction. Complete the corrections and resubmit to unlock verification."
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
                    ? 'Open Digitally Signed Card'
                    : isApproved
                    ? 'Payment Required to Unlock'
                    : isCorrectionRequired
                    ? 'Correction Required'
                    : 'Pending Admin Approval'}
                </span>
              </button>

              {isCorrectionRequired && (
                <button
                  onClick={handleOpenEditModal}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update & Correct Application</span>
                </button>
              )}
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
                    {h.new_status === 'CORRECTION_REQUIRED' && canEdit && (
                      <button
                        onClick={handleOpenEditModal}
                        className="mt-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition shadow-2xs"
                      >
                        <Edit3 className="w-3 h-3 text-amber-700" />
                        <span>Edit Requested Details</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. APPLICATION CORRECTION MODAL / EDITOR */}
      {/* ============================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl relative border border-stone-200 my-6 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#153A37] text-white px-6 py-4 flex items-center justify-between border-b border-teal-deep">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                  APPLICATION CORRECTION & EDITING WORKFLOW
                </span>
                <h3 className="text-base font-bold font-mono">
                  Edit Application — {appData.app_id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">

              {/* Prominent Admin Instruction Box */}
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Requested Corrections from Administration</span>
                </div>
                <p className="font-semibold text-stone-800 leading-relaxed bg-white p-3 rounded-xl border border-amber-200">
                  {appData.correction_instructions || appData.review_note || "Please review and rectify the highlighted sections below before resubmitting."}
                </p>
                {appData.correction_categories?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-amber-900">Categories to rectify:</span>
                    {appData.correction_categories.map((c: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-amber-200 font-bold rounded text-[11px] text-amber-950">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status alerts */}
              {editSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{editSuccessMessage}</span>
                </div>
              )}
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{editError}</span>
                </div>
              )}

              {/* Section 1: Passport Photograph */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-teal-dark uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-teal-deep" />
                  <span>1. Passport Photograph (Max 2MB · JPG/PNG)</span>
                </h4>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-teal-deep bg-stone-100 shrink-0 shadow-sm flex items-center justify-center">
                    {editFormData.photo_url ? (
                      <img src={editFormData.photo_url} alt="Candidate" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-stone-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handlePhotoUpload}
                      disabled={photoUploading}
                      className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-deep file:text-white hover:file:bg-teal-hover cursor-pointer"
                    />
                    <p className="text-[11px] text-stone-500">
                      Upload a recent colored passport-size photograph with light background.
                    </p>
                    {photoUploading && (
                      <p className="text-xs font-semibold text-teal-deep flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading image to secure storage...</span>
                      </p>
                    )}
                    {photoUploadError && (
                      <p className="text-xs font-semibold text-rose-600">{photoUploadError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Personal Information */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-teal-dark uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-deep" />
                  <span>2. Candidate Personal Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Full Name (English)</label>
                    <input
                      type="text"
                      required
                      value={editFormData.full_name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={editFormData.father_name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, father_name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      value={editFormData.mother_name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, mother_name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={editFormData.date_of_birth || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={editFormData.mobile || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Present Address</label>
                    <textarea
                      rows={2}
                      value={editFormData.present_address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, present_address: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Permanent Address</label>
                    <textarea
                      rows={2}
                      value={editFormData.permanent_address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, permanent_address: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Details */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-teal-dark uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-teal-deep" />
                  <span>3. Academic & Degree Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Department</label>
                    <select
                      value={editFormData.department_id || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, department_id: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.faculty})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Degree Level</label>
                    <select
                      value={editFormData.degree_level || 'Honours'}
                      onChange={(e) => setEditFormData({ ...editFormData, degree_level: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    >
                      <option value="Honours">Honours</option>
                      <option value="Masters">Masters</option>
                      <option value="M.Phil">M.Phil</option>
                      <option value="PhD">PhD</option>
                      <option value="Masters (Professional/Evening)">Masters (Professional/Evening)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={editFormData.roll_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, roll_number: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={editFormData.registration_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, registration_number: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Admission Session</label>
                    <input
                      type="text"
                      value={editFormData.admission_session || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, admission_session: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Gown Size</label>
                    <select
                      value={editFormData.gown_size || 'L'}
                      onChange={(e) => setEditFormData({ ...editFormData, gown_size: e.target.value })}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-bold"
                    >
                      <option value="S">S (Small)</option>
                      <option value="M">M (Medium)</option>
                      <option value="L">L (Large)</option>
                      <option value="XL">XL (Extra Large)</option>
                      <option value="XXL">XXL (Double Extra Large)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer with Two Clear Action Buttons */}
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-stone-500">
                You can save draft progress or resubmit directly when corrections are complete.
              </span>
              
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={editSaving || editResubmitting}
                  className="px-4 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-stone-500" />
                  <span>{editSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResubmitApplication}
                  disabled={editSaving || editResubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{editResubmitting ? 'Resubmitting...' : 'Resubmit Application'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

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

      {/* Convocation Card Modal with QR Code and Digital Signature Section */}
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
                
                {/* Photo & Dynamic QR Section */}
                <div className="sm:col-span-4 flex flex-col items-center text-center space-y-2.5">
                  <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-teal-deep bg-stone-100 shadow">
                    {convocationCard.photo_url ? (
                      <img src={convocationCard.photo_url} alt="Candidate" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-stone-400 m-auto mt-10" />
                    )}
                  </div>
                  
                  {/* Dynamic Sharp QR Code */}
                  <div className="p-2 bg-white rounded-xl border-2 border-stone-200 shadow-sm flex flex-col items-center">
                    <QRCodeSVG
                      value={`${window.location.origin}${convocationCard.verification_url || `/verify/${convocationCard.card_id}`}`}
                      size={100}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="text-[9px] font-black text-teal-dark uppercase tracking-wider mt-1">
                      SCAN TO VERIFY CARD
                    </span>
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
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Convocation Card ID</span>
                      <strong className="font-mono text-teal-deep font-bold">{convocationCard.card_id}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Roll / Reg Number</span>
                      <strong className="font-mono text-stone-800">{convocationCard.roll_number} / {convocationCard.registration_number || 'N/A'}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Department & Faculty</span>
                    <strong className="text-stone-800">{convocationCard.department}</strong>
                    <span className="text-stone-500 block text-[11px]">{convocationCard.faculty}</span>
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

              {/* Digital Signature & Cryptographic Verification Box */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-teal-deep font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-teal-deep shrink-0" />
                    <span>{convocationCard.digital_signature_indicator || "Digitally Verified — Educational Demonstration"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">Card v{convocationCard.version || 1}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px]">
                  <span className="text-stone-500">Digital Signature: <code className="font-mono text-teal-dark font-bold">{convocationCard.digital_signature}</code></span>
                  <span className="text-stone-500 font-medium">Issued: {convocationCard.issued_at}</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-tight">
                  Verification URL: <Link to={convocationCard.verification_url} target="_blank" className="text-teal-deep underline font-mono">{`${window.location.origin}${convocationCard.verification_url}`}</Link>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap justify-between items-center gap-2 no-print">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl text-xs transition shadow"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Card</span>
                  </button>
                  <a
                    href={api.getConvocationCardPdfUrl()}
                    download={`IU27_Card_${convocationCard.card_id}.pdf`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition border border-stone-300"
                  >
                    <Download className="w-4 h-4 text-stone-600" />
                    <span>Download PDF</span>
                  </a>
                  <Link
                    to={convocationCard.verification_url}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-teal-deep hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Verify Online</span>
                  </Link>
                </div>
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
