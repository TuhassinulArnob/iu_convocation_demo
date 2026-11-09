import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserCheck, User, GraduationCap, Camera, Shirt, 
  CreditCard, CheckCircle2, ArrowRight, ArrowLeft, 
  Plus, Trash2, Upload, AlertCircle, Info, Eye, EyeOff,
  Copy, Check, ShieldAlert, Award, FileText, ChevronRight, CheckCircle 
} from 'lucide-react';
import { api, setAuthToken, setCurrentUser, getAuthToken, clearAuthToken } from '../services/api';
import { PageHero } from '../components/PageHero';
import { getRegistrationStatus } from '../config/registrationConfig';

export const RegisterWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const regStatus = getRegistrationStatus();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [facultyGroups, setFacultyGroups] = useState<Record<string, any[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Completion State
  const [isCompleted, setIsCompleted] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState(false);

  // Form State — strictly empty defaults for new applicants
  const [formData, setFormData] = useState<any>({
    // Step 1: Account
    department_id: '',
    degree_level: '',
    roll_number: '',
    admission_session: '',
    mobile: '',
    email: '',
    full_name: '',
    password: '',
    confirm_password: '',

    // Step 2: Personal
    father_name: '',
    mother_name: '',
    date_of_birth: '',
    gender: 'Male',
    present_address: '',
    permanent_address: '',
    registration_number: '',

    // Step 3: Academic Degrees
    original_certificate_held: false,
    degrees: [
      {
        degree_type: '',
        department: '',
        session: '',
        exam_year: '',
        roll_number: '',
        has_certificate: false
      }
    ],

    // Step 4: Photo
    photo_url: '',

    // Step 5: Gown & Guests
    gown_size: 'L',
    guest_count: 0,
    guests: [] as any[],

    // Generated ID
    app_id: '',
  });

  // Dynamic fee calculation result
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);

  // Photo upload specific state
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Load departments and check draft on mount
  useEffect(() => {
    // 1. Fetch departments
    api.getDepartments()
      .then(res => {
        setDepartments(res.departments);
        setFacultyGroups(res.by_faculty);
      })
      .catch(err => console.error("Error fetching departments:", err));

    // 2. Check if returning student with active session/draft
    const token = getAuthToken();
    if (token) {
      api.getDraft()
        .then(draft => {
          if (draft && draft.has_draft) {
            setFormData((prev: any) => ({
              ...prev,
              department_id: draft.department_id || prev.department_id,
              degree_level: draft.degree_level || prev.degree_level,
              roll_number: draft.roll_number || prev.roll_number,
              admission_session: draft.admission_session || prev.admission_session,
              mobile: draft.mobile || prev.mobile,
              email: draft.email || prev.email,
              full_name: draft.full_name || prev.full_name,
              father_name: draft.father_name || prev.father_name,
              mother_name: draft.mother_name || prev.mother_name,
              date_of_birth: draft.date_of_birth || prev.date_of_birth,
              gender: draft.gender || prev.gender,
              present_address: draft.present_address || prev.present_address,
              permanent_address: draft.permanent_address || prev.permanent_address,
              registration_number: draft.registration_number || prev.registration_number,
              gown_size: draft.gown_size || prev.gown_size,
              original_certificate_held: draft.original_certificate_held ?? prev.original_certificate_held,
              degrees: (draft.degrees && draft.degrees.length > 0) ? draft.degrees : prev.degrees,
              photo_url: draft.photo_url || prev.photo_url,
              guest_count: draft.guest_count ?? prev.guest_count,
              guests: draft.guests || prev.guests,
              app_id: draft.app_id || prev.app_id,
            }));
            if (draft.current_step && draft.current_step > 1) {
              setCurrentStep(draft.current_step);
            }
          }
        })
        .catch(err => console.warn("Draft check note:", err));
    }
  }, []);

  // Update dynamic fees whenever relevant fee fields change
  useEffect(() => {
    if (!formData.degree_level) return;
    const isEvening = formData.degree_level.toLowerCase().includes('evening');
    api.calculateFees({
      registration_category: isEvening ? 'Evening' : 'Regular',
      primary_degree_level: formData.degree_level,
      original_certificate_held: formData.original_certificate_held,
      degrees: formData.degrees,
      guests: formData.guests
    })
      .then(res => setFeeBreakdown(res))
      .catch(err => console.error("Fee calc error:", err));
  }, [
    formData.degree_level, 
    formData.original_certificate_held, 
    formData.degrees, 
    formData.guests
  ]);

  // Password strength calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, text: 'Medium', color: 'bg-amber-500' };
    return { score: 3, text: 'Strong', color: 'bg-emerald-600' };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  // Step 1 Validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};

    if (!formData.department_id || Number(formData.department_id) <= 0) {
      errs.department_id = "Please choose your department from the dropdown.";
    }
    if (!formData.degree_level || formData.degree_level.trim() === '') {
      errs.degree_level = "Please choose your degree level.";
    }
    if (!formData.roll_number || formData.roll_number.trim() === '') {
      errs.roll_number = "Roll or Registration number is required.";
    }
    if (!formData.admission_session || formData.admission_session.trim() === '') {
      errs.admission_session = "Admission session is required.";
    }
    if (!formData.mobile || formData.mobile.trim() === '') {
      errs.mobile = "Mobile number is required.";
    } else if (!/^01[3-9]\d{8}$/.test(formData.mobile.trim())) {
      errs.mobile = "Enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).";
    }
    if (!formData.email || formData.email.trim() === '') {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Enter a valid email address.";
    }
    if (!formData.password) {
      errs.password = "Password is required.";
    } else if (formData.password.length < 8) {
      errs.password = "Password must be at least 8 characters long.";
    }
    if (!formData.confirm_password) {
      errs.confirm_password = "Confirm password is required.";
    } else if (formData.password !== formData.confirm_password) {
      errs.confirm_password = "Passwords do not match.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1 Submission: Creates User Account & Initial Application in Database
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateStep1()) {
      return;
    }

    setLoading(true);

    try {
      const selectedDept = departments.find(d => Number(d.id) === Number(formData.department_id));
      const res = await api.registerStep1({
        department_id: Number(formData.department_id),
        degree_level: formData.degree_level,
        roll_number: formData.roll_number.trim(),
        admission_session: formData.admission_session.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim() || `Student ${formData.roll_number}`,
        password: formData.password,
        confirm_password: formData.confirm_password
      });

      // Save auth token
      setAuthToken(res.access_token);
      setCurrentUser({
        user_id: res.user_id,
        role: res.role,
        app_id: res.app_id,
        name: res.student_name,
      });

      setFormData((prev: any) => ({
        ...prev,
        app_id: res.app_id,
        full_name: res.student_name || prev.full_name,
        degrees: [
          {
            degree_type: prev.degree_level,
            department: selectedDept ? selectedDept.name : '',
            session: prev.admission_session,
            exam_year: '2023',
            roll_number: prev.roll_number,
            has_certificate: false
          }
        ]
      }));

      // Advance to Step 2
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to initialize demonstration account.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 & onward sync to backend
  const syncApplicationData = async (targetStep?: number) => {
    try {
      await api.updateMyApplication({
        full_name: formData.full_name,
        father_name: formData.father_name,
        mother_name: formData.mother_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        present_address: formData.present_address,
        permanent_address: formData.permanent_address,
        registration_number: formData.registration_number || `${formData.roll_number}-IU`,
        gown_size: formData.gown_size,
        guest_count: formData.guests.length,
        guest_details: formData.guests,
        original_certificate_held: formData.original_certificate_held,
        degrees: formData.degrees,
        photo_url: formData.photo_url,
        current_step: targetStep || currentStep
      });
    } catch (err) {
      console.warn("Application data sync warning:", err);
    }
  };

  // Photo Upload Handler with safe client validation & error reporting
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setPhotoError(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedTypes.includes(file.type.toLowerCase()) && !['jpg', 'jpeg', 'png'].includes(ext)) {
      setPhotoError("Invalid image format. Only JPG, JPEG, and PNG files are accepted.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("File size exceeds 2 MB limit. Please select a passport-size photo under 2 MB.");
      return;
    }

    try {
      setPhotoUploading(true);
      const res = await api.uploadPhoto(file);
      setFormData((prev: any) => ({ ...prev, photo_url: res.photo_url }));
      await syncApplicationData(4);
    } catch (err: any) {
      setPhotoError(err.message || "Failed to upload photo. Please check your connection and try again.");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Add another degree
  const addDegree = () => {
    setFormData((prev: any) => ({
      ...prev,
      degrees: [
        ...prev.degrees,
        {
          degree_type: 'Masters',
          department: departments.length > 0 ? departments[0].name : '',
          session: '2021-22',
          exam_year: '2024',
          roll_number: prev.roll_number,
          has_certificate: false
        }
      ]
    }));
  };

  // Remove a degree
  const removeDegree = (index: number) => {
    if (formData.degrees.length <= 1) return;
    const updated = [...formData.degrees];
    updated.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, degrees: updated }));
  };

  // Add a guest
  const addGuest = () => {
    if (formData.guests.length >= 3) {
      alert("Maximum 3 guests allowed under university convocation policy.");
      return;
    }
    setFormData((prev: any) => ({
      ...prev,
      guests: [
        ...prev.guests,
        { name: '', relation: 'Parent', age: 45, under_five: false }
      ]
    }));
  };

  // Remove a guest
  const removeGuest = (index: number) => {
    const updated = [...formData.guests];
    updated.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, guests: updated }));
  };

  // Step 8: Final Submission Action
  const handleFinalSubmit = async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      await syncApplicationData(8);
      await api.submitMyApplication();

      // Show completion screen
      setIsCompleted(true);
      // Clear token so user logs in manually with their new password as requested
      clearAuthToken();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setGeneralError(err.message || "Error submitting demonstration application.");
    } finally {
      setLoading(false);
    }
  };

  const copyAppId = () => {
    if (formData.app_id) {
      navigator.clipboard.writeText(formData.app_id);
      setCopiedAppId(true);
      setTimeout(() => setCopiedAppId(false), 2000);
    }
  };

  const stepsList = [
    { num: 1, title: 'Account' },
    { num: 2, title: 'Personal' },
    { num: 3, title: 'Academic' },
    { num: 4, title: 'Photograph' },
    { num: 5, title: 'Gown & Guests' },
    { num: 6, title: 'Fee Summary' },
    { num: 7, title: 'Payment Preview' },
    { num: 8, title: 'Final Review' },
  ];

  // ==============================================================
  // REGISTRATION COMPLETION SCREEN
  // ==============================================================
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-iu-bg py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              REGISTRATION SUBMITTED
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-teal-dark pt-2">
              Application Submitted Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-medium">
              Your application is now under administrative review.
            </p>
          </div>

          {/* Status Badge */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-bold text-xs uppercase tracking-wide">
                Status: Pending Review
              </span>
              <span className="text-xs text-amber-800 font-medium">(Verification in progress)</span>
            </div>
          </div>

          {/* Generated Application ID Box */}
          <div className="p-4 bg-teal-50 border-2 border-dashed border-teal-300 rounded-2xl flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest block">
                Your Application ID
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-teal-dark">
                {formData.app_id}
              </span>
            </div>
            <button
              onClick={copyAppId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-200 rounded-xl text-xs font-bold text-teal-deep hover:bg-teal-100 transition shadow-sm"
              title="Copy Application ID"
            >
              {copiedAppId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAppId ? 'Copied!' : 'Copy ID'}</span>
            </button>
          </div>

          {/* Confirmation Instructions */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left text-xs text-stone-700 space-y-2.5">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Your account was created with your user-defined password.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Use your Email/Mobile (<strong>{formData.email || formData.mobile}</strong>) and password to sign in.</span>
            </div>
            <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-stone-200 text-stone-800 font-medium">
              <Info className="w-4 h-4 text-teal-deep shrink-0 mt-0.5" />
              <span><strong>Next Step:</strong> Once university staff approves your application, the fee payment option will be enabled on your dashboard. You will then be able to pay via bKash, Rocket, or Nagad.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="w-full sm:w-1/2 py-3.5 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={`/track-application?app_id=${formData.app_id}`}
              className="w-full sm:w-1/2 py-3.5 border border-stone-300 text-stone-700 font-bold rounded-xl text-xs sm:text-sm hover:bg-stone-50 flex items-center justify-center gap-2 transition"
            >
              <span>Track Application</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Banner matching Original IU Design */}
      <PageHero
        title="Registration"
        description="Official candidate online enrollment process"
        eyebrow="5TH CONVOCATION 2027"
      />

      {/* Stepper Bar */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-2xl border border-iu-border p-4 shadow-sm mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] px-2">
            {stepsList.map((st) => (
              <div key={st.num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === st.num
                    ? 'bg-teal-deep text-white ring-4 ring-teal-100'
                    : currentStep > st.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-stone-400'
                }`}>
                  {currentStep > st.num ? '✓' : st.num}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${
                  currentStep === st.num ? 'text-teal-dark font-bold' : 'text-stone-500'
                }`}>
                  {st.title}
                </span>
                {st.num < 8 && <div className="w-4 h-0.5 bg-stone-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Global Error Notification */}
        {generalError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: CREATE ACCOUNT (Matching Reference Screenshots)        */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                🎓 5th Convocation 2027
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-teal-dark">
                Create your account
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Only graduates in the official list can create an account.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4 text-xs">
                {regStatus.isOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 uppercase tracking-wide">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {regStatus.status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-300 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    {regStatus.status}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-bold border border-amber-300">
                  <span>⏰ Registration Deadline:</span>
                  <span className="text-amber-950 font-extrabold">{regStatus.deadlineText}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-deep font-semibold border border-teal-100">
                  🏛️ Ceremony 02 Feb 2027, 09:00 AM
                </span>
              </div>
            </div>

            {!regStatus.isOpen && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold">Online Registration is Closed</p>
                  <p className="text-stone-600 mt-0.5">The deadline for convocation registration was {regStatus.deadlineText}. New submissions are no longer accepted.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleStep1Submit} className="space-y-5" noValidate>
              
              {/* Department Dropdown — no numerical prefix, grouped by faculty, sorted alphabetically */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Department *
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => {
                    setFormData({ ...formData, department_id: e.target.value });
                    if (fieldErrors.department_id) {
                      setFieldErrors({ ...fieldErrors, department_id: '' });
                    }
                  }}
                  className={`w-full p-3 bg-stone-50 border rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep ${
                    fieldErrors.department_id ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200'
                  }`}
                >
                  <option value="">Choose your department</option>
                  {Object.entries(facultyGroups).map(([faculty, depts]) => (
                    <optgroup key={faculty} label={faculty} className="font-bold text-teal-dark">
                      {depts.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {fieldErrors.department_id && (
                  <p className="text-rose-600 text-xs mt-1 font-semibold">{fieldErrors.department_id}</p>
                )}
              </div>

              {/* Degree Level */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Degree level *
                </label>
                <select
                  value={formData.degree_level}
                  onChange={(e) => {
                    setFormData({ ...formData, degree_level: e.target.value });
                    if (fieldErrors.degree_level) {
                      setFieldErrors({ ...fieldErrors, degree_level: '' });
                    }
                  }}
                  className={`w-full p-3 bg-stone-50 border rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep ${
                    fieldErrors.degree_level ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200'
                  }`}
                >
                  <option value="">Choose degree level</option>
                  <option value="Honours">Undergraduate (Honours)</option>
                  <option value="Masters">Postgraduate (Masters)</option>
                  <option value="M.Phil">M.Phil</option>
                  <option value="PhD">PhD</option>
                  <option value="Masters (Professional/Evening)">Masters (Professional/Evening)</option>
                </select>
                {fieldErrors.degree_level && (
                  <p className="text-rose-600 text-xs mt-1 font-semibold">{fieldErrors.degree_level}</p>
                )}
              </div>

              {/* Roll and Session Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Roll No / Reg No *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1812099"
                    value={formData.roll_number}
                    onChange={(e) => {
                      setFormData({ ...formData, roll_number: e.target.value });
                      if (fieldErrors.roll_number) setFieldErrors({ ...fieldErrors, roll_number: '' });
                    }}
                    className={`w-full p-3 bg-stone-50 border rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep ${
                      fieldErrors.roll_number ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200'
                    }`}
                  />
                  {fieldErrors.roll_number && (
                    <p className="text-rose-600 text-xs mt-1 font-semibold">{fieldErrors.roll_number}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Admission session *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2017-18"
                    value={formData.admission_session}
                    onChange={(e) => {
                      setFormData({ ...formData, admission_session: e.target.value });
                      if (fieldErrors.admission_session) setFieldErrors({ ...fieldErrors, admission_session: '' });
                    }}
                    className={`w-full p-3 bg-stone-50 border rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep ${
                      fieldErrors.admission_session ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200'
                    }`}
                  />
                  {fieldErrors.admission_session && (
                    <p className="text-rose-600 text-xs mt-1 font-semibold">{fieldErrors.admission_session}</p>
                  )}
                </div>
              </div>

              {/* Mobile and Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 01712000000"
                    value={formData.mobile}
                    onChange={(e) => {
                      setFormData({ ...formData, mobile: e.target.value });
                      if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: '' });
                    }}
                    className={`w-full p-3 bg-stone-50 border rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep ${
                      fieldErrors.mobile ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200'
                    }`}
                  />
                  {fieldErrors.mobile && (
                    <p className="text-rose-600 text-xs mt-1 font-semibold">{fieldErrors.mobile}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    className={`w-full p-3 bg-stone-50 border rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep ${
                      fieldErrors.email ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-rose-600 text-xs mt-1 font-semibold">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Full Name (As on Academic Certificate)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Md. Ashraful Islam"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep"
                />
              </div>

              {/* User-Defined Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Create Password * (Min 8 chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter strong password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                      }}
                      className={`w-full p-3 pr-10 bg-stone-50 border rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep ${
                        fieldErrors.password ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-600"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength Meter */}
                  {formData.password && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-stone-200 rounded-full overflow-hidden">
                        <div className={`h-full ${pwdStrength.color}`} style={{ width: `${(pwdStrength.score / 3) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-stone-500">{pwdStrength.text}</span>
                    </div>
                  )}
                  {fieldErrors.password && (
                    <p className="text-rose-600 text-xs mt-1 font-semibold">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={formData.confirm_password}
                      onChange={(e) => {
                        setFormData({ ...formData, confirm_password: e.target.value });
                        if (fieldErrors.confirm_password) setFieldErrors({ ...fieldErrors, confirm_password: '' });
                      }}
                      className={`w-full p-3 pr-10 bg-stone-50 border rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-deep ${
                        fieldErrors.confirm_password ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-600"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirm_password && (
                    <p className="text-rose-600 text-xs mt-1 font-semibold">{fieldErrors.confirm_password}</p>
                  )}
                </div>
              </div>

              {/* Informative Note */}
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-deep shrink-0 mt-0.5" />
                <span>Several degrees? Use any one here — you can add additional degrees in Step 3.</span>
              </div>

              {/* Submit Step 1 Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account & Draft...' : 'Continue to Personal Information'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-stone-500 pt-2">
                Already registered? <Link to="/login" className="font-bold text-teal-deep underline">Sign in here</Link>
              </div>

            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PERSONAL INFORMATION                                   */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">STEP 2 OF 8</span>
              <h2 className="text-2xl font-bold text-teal-dark mt-1">Personal Details</h2>
              <p className="text-xs text-stone-500">Provide details exactly as shown on your academic transcripts.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    placeholder="e.g. 1812099-IU"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={formData.mother_name}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Present Address</label>
                <textarea
                  rows={2}
                  value={formData.present_address}
                  onChange={(e) => setFormData({ ...formData, present_address: e.target.value })}
                  placeholder="Hostel, hall or local address..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Permanent Address</label>
                <textarea
                  rows={2}
                  value={formData.permanent_address}
                  onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                  placeholder="Permanent home district and address..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  await syncApplicationData(3);
                  setCurrentStep(3);
                }}
                className="px-6 py-2.5 bg-teal-deep text-white font-bold rounded-xl text-xs hover:bg-teal-hover flex items-center gap-1.5"
              >
                Next: Degree Information <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: DEGREE INFORMATION                                    */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">STEP 3 OF 8</span>
                <h2 className="text-2xl font-bold text-teal-dark mt-1">Degrees & Certificates</h2>
                <p className="text-xs text-stone-500">You can declare multiple degrees earned at Islamic University.</p>
              </div>
              <button
                type="button"
                onClick={addDegree}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-deep font-bold rounded-lg text-xs hover:bg-teal-100 border border-teal-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Degree
              </button>
            </div>

            {/* Certificate Already Held Toggle */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="certHeld"
                checked={formData.original_certificate_held}
                onChange={(e) => setFormData({ ...formData, original_certificate_held: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded text-teal-deep focus:ring-teal-deep border-stone-300"
              />
              <label htmlFor="certHeld" className="text-xs text-stone-700 cursor-pointer">
                <strong>I already collected my original certificate from IU.</strong><br />
                <span className="text-stone-500">
                  (If checked, certificate fee will be waived according to convocation fee policy).
                </span>
              </label>
            </div>

            {/* List of degrees */}
            <div className="space-y-4">
              {formData.degrees.map((deg: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3 relative">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-xs font-bold text-teal-dark">Degree #{idx + 1}</span>
                    {formData.degrees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDegree(idx)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">Degree Type</label>
                      <select
                        value={deg.degree_type}
                        onChange={(e) => {
                          const updated = [...formData.degrees];
                          updated[idx].degree_type = e.target.value;
                          setFormData({ ...formData, degrees: updated });
                        }}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                      >
                        <option value="Honours">Honours (Bachelor)</option>
                        <option value="Masters">Masters</option>
                        <option value="M.Phil">M.Phil</option>
                        <option value="PhD">PhD</option>
                        <option value="Masters (Professional/Evening)">Masters (Professional/Evening)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">Examination Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2022"
                        value={deg.exam_year}
                        onChange={(e) => {
                          const updated = [...formData.degrees];
                          updated[idx].exam_year = e.target.value;
                          setFormData({ ...formData, degrees: updated });
                        }}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  await syncApplicationData(4);
                  setCurrentStep(4);
                }}
                className="px-6 py-2.5 bg-teal-deep text-white font-bold rounded-xl text-xs hover:bg-teal-hover flex items-center gap-1.5"
              >
                Next: Photograph <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: PHOTOGRAPH UPLOAD                                     */}
        {/* ============================================================== */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">STEP 4 OF 8</span>
              <h2 className="text-2xl font-bold text-teal-dark mt-1">Upload Photograph</h2>
              <p className="text-xs text-stone-500">A clear passport-size formal photograph is required for your Convocation Card.</p>
            </div>

            {/* Photo Error Banner */}
            {photoError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 hover:bg-teal-50/30 transition text-center relative">
              {photoUploading ? (
                <div className="py-12 flex flex-col items-center space-y-3">
                  <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-deep rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-teal-dark">Uploading and validating photograph...</p>
                </div>
              ) : formData.photo_url ? (
                <div className="space-y-4">
                  <img
                    src={formData.photo_url}
                    alt="Applicant Preview"
                    className="w-36 h-44 object-cover rounded-xl shadow-md border-2 border-teal-deep mx-auto"
                  />
                  <div className="flex gap-2 justify-center">
                    <label className="cursor-pointer px-3 py-1.5 bg-teal-deep text-white text-xs font-semibold rounded-lg hover:bg-teal-hover transition shadow-sm">
                      Replace Photo
                      <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, photo_url: '' });
                        setPhotoError(null);
                      }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100 transition border border-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Photo attached successfully
                  </p>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-deep flex items-center justify-center shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-teal-dark block">Click to upload passport photo</span>
                    <span className="text-xs text-stone-500">JPG, JPEG or PNG (Max 2MB)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {!formData.photo_url && !photoUploading && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium">
                ⚠️ A passport photo is required to continue. Please upload a clear photo of yourself.
              </p>
            )}

            <div className="text-xs text-stone-500 bg-stone-100 p-3 rounded-xl">
              <strong>Photo tips:</strong> Neutral facial expression, plain light background, properly centered head and shoulders.
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                disabled={!formData.photo_url || photoUploading}
                onClick={async () => {
                  if (!formData.photo_url) {
                    setPhotoError("A passport photo is required to continue. Please upload a clear photo of yourself.");
                    return;
                  }
                  await syncApplicationData(5);
                  setCurrentStep(5);
                }}
                className={`px-6 py-2.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition ${
                  !formData.photo_url || photoUploading
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                    : 'bg-teal-deep text-white hover:bg-teal-hover shadow-sm'
                }`}
              >
                Next: Gown & Guests <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 5: GOWN & GUESTS                                          */}
        {/* ============================================================== */}
        {currentStep === 5 && (
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">STEP 5 OF 8</span>
              <h2 className="text-2xl font-bold text-teal-dark mt-1">Gown Size & Guests</h2>
              <p className="text-xs text-stone-500">Choose your ceremonial gown size and add accompanying guests (maximum 3).</p>
            </div>

            {/* Gown Size */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Select Academic Gown Size
              </label>
              <div className="grid grid-cols-5 gap-2">
                {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFormData({ ...formData, gown_size: sz })}
                    className={`py-3 rounded-xl border font-bold text-sm transition ${
                      formData.gown_size === sz
                        ? 'border-teal-deep bg-teal-50 text-teal-deep ring-2 ring-teal-deep/30'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Guests Section */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-bold text-teal-dark">Accompanying Guests</h3>
                  <p className="text-xs text-stone-500">Max 3 guests. Children under 5 years old are free of charge.</p>
                </div>
                {formData.guests.length < 3 && (
                  <button
                    type="button"
                    onClick={addGuest}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-deep font-bold rounded-lg text-xs hover:bg-teal-100 border border-teal-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Guest
                  </button>
                )}
              </div>

              {formData.guests.length === 0 ? (
                <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-500 border border-stone-200">
                  No guests added. Click "Add Guest" if you plan to bring family members.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.guests.map((g: any, idx: number) => (
                    <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-teal-dark">Guest #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeGuest(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Guest Full Name"
                          value={g.name}
                          onChange={(e) => {
                            const updated = [...formData.guests];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, guests: updated });
                          }}
                          className="p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        />
                        <select
                          value={g.relation}
                          onChange={(e) => {
                            const updated = [...formData.guests];
                            updated[idx].relation = e.target.value;
                            setFormData({ ...formData, guests: updated });
                          }}
                          className="p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Age (Years)"
                          value={g.age}
                          onChange={(e) => {
                            const updated = [...formData.guests];
                            const ageNum = Number(e.target.value);
                            updated[idx].age = ageNum;
                            updated[idx].under_five = ageNum < 5;
                            setFormData({ ...formData, guests: updated });
                          }}
                          className="p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        />
                      </div>

                      {g.age < 5 && (
                        <div className="text-[11px] text-emerald-700 font-bold">
                          ✓ Child under 5: Exempt from guest fee (৳0)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  await syncApplicationData(6);
                  setCurrentStep(6);
                }}
                className="px-6 py-2.5 bg-teal-deep text-white font-bold rounded-xl text-xs hover:bg-teal-hover flex items-center gap-1.5"
              >
                Next: Fee Calculation <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 6: FEE CALCULATION & SUMMARY                              */}
        {/* ============================================================== */}
        {currentStep === 6 && (
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">STEP 6 OF 8</span>
              <h2 className="text-2xl font-bold text-teal-dark mt-1">Demonstration Fee Calculation</h2>
              <p className="text-xs text-stone-500">Calculated dynamically according to Islamic University 5th Convocation policy.</p>
            </div>

            {feeBreakdown ? (
              <div className="p-5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-700">
                  <span>Registration Fee ({feeBreakdown.registration_category}):</span>
                  <span className="font-bold text-teal-dark">৳ {feeBreakdown.registration_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>Certificate Fee:</span>
                  <span className="font-bold text-teal-dark">
                    {feeBreakdown.certificate_fee > 0 ? `৳ ${feeBreakdown.certificate_fee.toFixed(2)}` : '৳ 0.00 (Exempt/Held)'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>Guest Fee ({feeBreakdown.chargeable_guests} chargeable):</span>
                  <span className="font-bold text-teal-dark">৳ {feeBreakdown.guest_fee.toFixed(2)}</span>
                </div>
                {feeBreakdown.exempt_guests > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Children Under 5:</span>
                    <span>{feeBreakdown.exempt_guests} exempt (৳ 0)</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-700">
                  <span>Service Charge:</span>
                  <span className="font-bold text-teal-dark">৳ {feeBreakdown.service_charge.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-teal-200 flex justify-between items-center text-base sm:text-lg font-black text-teal-dark">
                  <span>Total Payable:</span>
                  <span className="text-teal-deep text-2xl">{feeBreakdown.formatted_total}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-stone-500">Calculating fees...</div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  await syncApplicationData(7);
                  setCurrentStep(7);
                }}
                className="px-6 py-2.5 bg-teal-deep text-white font-bold rounded-xl text-xs hover:bg-teal-hover flex items-center gap-1.5"
              >
                Next: Payment Preview <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 7: PAYMENT DEMONSTRATION PREVIEW                          */}
        {/* ============================================================== */}
        {currentStep === 7 && (
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">STEP 7 OF 8</span>
              <h2 className="text-2xl font-bold text-teal-dark mt-1">Payment Process Demonstration</h2>
              <p className="text-xs text-stone-500">Preview the upcoming simulated payment process with bKash and Rocket.</p>
            </div>

            {/* Prominent DO NOT PAY warning */}
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm uppercase">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>⛔ DO NOT PAY — DEMONSTRATION ONLY</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-semibold">
                No real transactions or banking networks are connected. These QR codes are displayed exclusively to test the application interface.
              </p>
              <p className="font-bengali text-xs text-rose-900 font-bold">
                এই QR কোড শুধুমাত্র Demo প্রদর্শনের জন্য। অনুগ্রহ করে কোনো টাকা পাঠাবেন না।
              </p>
            </div>

            {/* Quick Preview of Available Methods */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 text-center space-y-2">
                <span className="px-2.5 py-1 bg-[#D12053] text-white text-xs font-bold rounded">bKash</span>
                <p className="text-xs text-stone-600 font-semibold">Merchant Bangla QR</p>
              </div>
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 text-center space-y-2">
                <span className="px-2.5 py-1 bg-[#8C3494] text-white text-xs font-bold rounded">Rocket</span>
                <p className="text-xs text-stone-600 font-semibold">DBBL Merchant QR</p>
              </div>
            </div>

            <div className="text-xs text-stone-700 bg-teal-50/70 p-4 rounded-2xl border border-teal-200 leading-relaxed space-y-2">
              <div className="font-bold text-teal-dark flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-deep shrink-0" />
                <span>Approval Workflow Notice:</span>
              </div>
              <p>
                • After submitting your application in Step 8, it will be reviewed by the Convocation Committee.
              </p>
              <p>
                • Once approved, the payment option will be enabled on your Student Dashboard.
              </p>
              <p className="font-semibold text-teal-900">
                You do NOT pay during registration. Official Workflow: Registration → Review → Approval → Payment.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  await syncApplicationData(8);
                  setCurrentStep(8);
                }}
                className="px-6 py-2.5 bg-teal-deep text-white font-bold rounded-xl text-xs hover:bg-teal-hover flex items-center gap-1.5"
              >
                Next: Final Review <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 8: FINAL REVIEW & SUBMISSION                              */}
        {/* ============================================================== */}
        {currentStep === 8 && (
          <div className="bg-white rounded-3xl border border-iu-border shadow-md p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold text-gold-warm uppercase tracking-wider">STEP 8 OF 8</span>
              <h2 className="text-2xl font-bold text-teal-dark mt-1">Final Application Review</h2>
              <p className="text-xs text-stone-500">Carefully verify your details before submitting your application for demonstration review.</p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm divide-y divide-stone-100">
              
              <div className="pt-2 grid grid-cols-2 gap-2">
                <div><span className="text-stone-400">Application ID:</span> <strong className="font-mono text-teal-dark">{formData.app_id || 'Generating on submit'}</strong></div>
                <div><span className="text-stone-400">Roll Number:</span> <strong className="font-mono text-teal-dark">{formData.roll_number}</strong></div>
              </div>

              <div className="pt-3 grid grid-cols-2 gap-2">
                <div><span className="text-stone-400">Candidate Name:</span> <strong className="text-stone-800">{formData.full_name}</strong></div>
                <div><span className="text-stone-400">Degree:</span> <strong className="text-stone-800">{formData.degree_level}</strong></div>
              </div>

              <div className="pt-3 grid grid-cols-2 gap-2">
                <div><span className="text-stone-400">Mobile:</span> <strong className="text-stone-800">{formData.mobile}</strong></div>
                <div><span className="text-stone-400">Email:</span> <strong className="text-stone-800">{formData.email}</strong></div>
              </div>

              <div className="pt-3 grid grid-cols-2 gap-2">
                <div><span className="text-stone-400">Gown Size:</span> <strong className="text-teal-deep font-bold">{formData.gown_size}</strong></div>
                <div><span className="text-stone-400">Total Guests:</span> <strong className="text-teal-deep font-bold">{formData.guests.length}</strong></div>
              </div>

              {formData.photo_url && (
                <div className="pt-3 flex items-center gap-3">
                  <span className="text-stone-400">Passport Photo:</span>
                  <img src={formData.photo_url} alt="Uploaded Photo" className="w-12 h-14 object-cover rounded-lg border border-teal-deep shadow-sm" />
                </div>
              )}

              <div className="pt-3 flex justify-between items-center text-sm font-bold bg-stone-50 p-3 rounded-xl">
                <span className="text-stone-700">Calculated Total Fee:</span>
                <span className="text-teal-deep text-lg font-black">{feeBreakdown?.formatted_total || '৳ 4,532.50'}</span>
              </div>

            </div>

            <div className="flex justify-between items-center pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCurrentStep(7)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="px-8 py-3.5 bg-gold-warm hover:bg-gold-hover text-stone-900 font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <span>{loading ? 'Submitting Application...' : 'Submit Application & Complete'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
