import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Users, FileText, CheckCircle2, XCircle, 
  Clock, DollarSign, Search, Filter, Download, Plus, 
  Trash2, Edit3, Eye, ArrowUpDown, RefreshCw, X, AlertTriangle,
  RotateCcw, Check, ExternalLink, Calendar, MapPin, Award
} from 'lucide-react';
import { api, getCurrentUser, clearAuthToken } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Authentication & RBAC (verified once on mount)
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<any | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'notices'>('overview');

  // Overview Stats
  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Applications Tab State
  const [applications, setApplications] = useState<any[]>([]);
  const [totalApps, setTotalApps] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [loadingApps, setLoadingApps] = useState(false);
  const [isRefreshingApps, setIsRefreshingApps] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const appRequestCounter = useRef(0);

  // Application Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAppId, setReviewAppId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string | null>(null);

  // Review Action Sub-Modals
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');

  const quickRejectionReasons = [
    'Academic credentials could not be verified',
    'Photo does not meet passport specifications',
    'Degree information does not match university records',
    'Duplicate application detected',
  ];

  const quickCorrectionNotes = [
    'Photo blurry or invalid, please re-upload a clear passport photo',
    'Incorrect exam year or session entered, please verify',
    'Gown size not selected properly',
  ];

  // Notices Tab State
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    id: null as number | null,
    title: '',
    category: 'Registration',
    description: '',
    date: '09 Nov 2026',
    is_published: true,
    is_new: true,
  });

  // 1. RBAC Guard: Run once on component mount
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/admin/login', { replace: true });
      return;
    }
    setAdminUser(user);
    setAuthorized(true);
  }, [navigate]);

  // 2. Overview Stats Fetcher (stable, controlled)
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch admin stats:', err);
      setStatsError(err.message || 'Failed to load administrative overview statistics.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 3. Applications Fetcher (with request-id to prevent race conditions and zero blinking)
  const fetchApplications = useCallback(async (isBackgroundRefresh: boolean = false) => {
    const requestId = ++appRequestCounter.current;
    
    if (isBackgroundRefresh) {
      setIsRefreshingApps(true);
    } else {
      setLoadingApps(true);
    }
    setAppsError(null);

    try {
      const res = await api.getAdminApplications({
        search: appliedSearch.trim() || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
        payment_status: paymentFilter === 'All' ? undefined : paymentFilter,
        page: currentPage,
        page_size: 10,
      });

      // Ignore if a newer request was dispatched
      if (requestId === appRequestCounter.current) {
        setApplications(res.items || []);
        setTotalApps(res.total || 0);
      }
    } catch (err: any) {
      if (requestId === appRequestCounter.current) {
        console.error('Failed to fetch applications:', err);
        setAppsError(err.message || 'Failed to fetch application records from the database.');
      }
    } finally {
      if (requestId === appRequestCounter.current) {
        setLoadingApps(false);
        setIsRefreshingApps(false);
      }
    }
  }, [appliedSearch, statusFilter, paymentFilter, currentPage]);

  // 4. Notices Fetcher (stable, controlled)
  const fetchNotices = useCallback(async () => {
    setLoadingNotices(true);
    try {
      const data = await api.getNotices();
      setNotices(data || []);
    } catch (err: any) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoadingNotices(false);
    }
  }, []);

  // 5. Tab-Activated Fetching: Only fetch data for the active tab when authorized
  useEffect(() => {
    if (!authorized) return;

    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'applications') {
      fetchApplications(applications.length > 0);
    } else if (activeTab === 'notices') {
      fetchNotices();
    }
  }, [authorized, activeTab, fetchStats, fetchApplications, fetchNotices]);

  // 6. Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  // 7. Review Modal: Fetch individual application details
  const handleOpenAppDetail = async (appId: string) => {
    setReviewAppId(appId);
    setReviewModalOpen(true);
    setReviewLoading(true);
    setReviewError(null);
    setSelectedApp(null);
    setStatusSuccessMessage(null);

    try {
      const detail = await api.getAdminApplicationDetail(appId);
      setSelectedApp(detail);
    } catch (err: any) {
      console.error('Failed to fetch application profile:', err);
      setReviewError(err.message || 'Could not load application details. Please verify your connection.');
    } finally {
      setReviewLoading(false);
    }
  };

  // 8. Execute Application Status Decision (Approve, Reject, Request Correction, Keep Under Review)
  const handleExecuteStatusChange = async (targetStatus: string, note: string) => {
    if (!selectedApp) return;

    setUpdatingStatus(true);
    setStatusSuccessMessage(null);

    try {
      await api.updateAdminApplicationStatus(selectedApp.app_id, targetStatus, note);
      
      // Update local modal record
      setSelectedApp((prev: any) => ({
        ...prev,
        status: targetStatus,
        review_note: note,
        status_history: [
          ...(prev.status_history || []),
          {
            previous_status: prev.status,
            new_status: targetStatus,
            admin_identifier: adminUser?.email || 'Demo Admin',
            review_note: note || `Status updated to ${targetStatus}`,
            timestamp: 'Just now'
          }
        ]
      }));

      // Update in local table array without full reload
      setApplications(prev => prev.map(a => 
        a.app_id === selectedApp.app_id ? { ...a, status: targetStatus, review_note: note } : a
      ));

      setStatusSuccessMessage(`Application ${selectedApp.app_id} status updated to "${targetStatus}".`);
      setConfirmApproveOpen(false);
      setRejectModalOpen(false);
      setCorrectionModalOpen(false);

      // Refresh overview stats in the background
      fetchStats();
    } catch (err: any) {
      console.error('Status update failed:', err);
      alert(err.message || 'Failed to update application status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 9. Notice Handlers
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (noticeForm.id) {
        await api.updateNotice(noticeForm.id, noticeForm);
      } else {
        await api.createNotice(noticeForm);
      }
      setShowNoticeModal(false);
      fetchNotices();
    } catch (err: any) {
      alert(err.message || 'Failed to save notice.');
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm('Are you sure you want to delete this demonstration notice?')) return;
    try {
      await api.deleteNotice(id);
      fetchNotices();
    } catch (err: any) {
      alert(err.message || 'Failed to delete notice.');
    }
  };

  // 10. Manual Logout
  const handleLogout = () => {
    clearAuthToken();
    navigate('/admin/login', { replace: true });
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-iu-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#075C55] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-stone-600">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Admin Header Bar */}
      <header className="bg-[#153A37] text-white py-6 border-b border-teal-deep shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-deep text-gold-warm flex items-center justify-center font-bold shadow-md shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                DEMO ADMIN PANEL — SECURE CONSOLE
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Convocation Administrative Console
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={api.getExportUrl('applications')}
              download="applications.csv"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-deep hover:bg-teal-hover text-white rounded-xl text-xs font-semibold transition shadow-sm"
              title="Export all database records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 border border-white/25 text-stone-200 hover:text-white rounded-xl text-xs font-semibold hover:bg-white/10 transition"
              title="Terminate current administrator session"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 gap-6 text-sm font-semibold mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-b-2 border-teal-deep text-teal-deep font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 transition flex items-center gap-2 ${
              activeTab === 'applications'
                ? 'border-b-2 border-teal-deep text-teal-deep font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>
              Application Management {totalApps > 0 ? `(${totalApps})` : ''}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`pb-3 transition flex items-center gap-2 ${
              activeTab === 'notices'
                ? 'border-b-2 border-teal-deep text-teal-deep font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Notice Management</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW                                                */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {loadingStats && !stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white p-5 rounded-2xl border border-stone-200 animate-pulse h-28" />
                ))}
              </div>
            ) : statsError ? (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
                <span>{statsError}</span>
                <button
                  onClick={fetchStats}
                  className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition"
                >
                  Retry
                </button>
              </div>
            ) : stats ? (
              <>
                {/* Stat Counters Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-iu-border shadow-sm">
                    <span className="text-xs text-stone-500 font-semibold block">Total Applications</span>
                    <span className="text-3xl font-black text-teal-dark font-mono mt-1 block">
                      {stats.total_applications}
                    </span>
                    <span className="text-[11px] text-teal-secondary font-medium">Recorded in DB</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-iu-border shadow-sm">
                    <span className="text-xs text-stone-500 font-semibold block">Approved (Demo)</span>
                    <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">
                      {stats.approved_demo}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">Ready for card printing</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-iu-border shadow-sm">
                    <span className="text-xs text-stone-500 font-semibold block">Pending Review</span>
                    <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">
                      {stats.pending_review}
                    </span>
                    <span className="text-[11px] text-amber-700 font-medium">Awaiting admin review</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-iu-border shadow-sm">
                    <span className="text-xs text-stone-500 font-semibold block">Simulated Revenue</span>
                    <span className="text-2xl font-black text-teal-deep font-mono mt-1 block">
                      {stats.formatted_simulated_amount}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">{stats.simulated_payments_count} demo payments</span>
                  </div>
                </div>

                {/* Department & Degree Breakdown Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-teal-dark text-base">
                      Applications by Department
                    </h3>
                    <div className="space-y-3">
                      {stats.department_distribution?.map((d: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-stone-700">
                            <span className="line-clamp-1">{d.department}</span>
                            <span className="font-mono text-teal-deep">{d.count}</span>
                          </div>
                          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-deep rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (d.count / (stats.total_applications || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-teal-dark text-base">
                      Applications by Degree Level
                    </h3>
                    <div className="space-y-3">
                      {stats.degree_distribution?.map((deg: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-stone-700">
                            <span>{deg.degree}</span>
                            <span className="font-mono text-teal-deep">{deg.count}</span>
                          </div>
                          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold-warm rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (deg.count / (stats.total_applications || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CSV Export Links */}
                <div className="p-6 bg-white rounded-2xl border border-iu-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-teal-dark text-sm">Download Administrative Data (CSV)</h4>
                    <p className="text-xs text-stone-500">Export database summaries for auditing and demonstration analysis.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={api.getExportUrl('applications')}
                      download="applications.csv"
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition"
                    >
                      Applications CSV
                    </a>
                    <a
                      href={api.getExportUrl('payments')}
                      download="payments.csv"
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition"
                    >
                      Payments CSV
                    </a>
                    <a
                      href={api.getExportUrl('departments')}
                      download="departments.csv"
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition"
                    >
                      Departments CSV
                    </a>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: APPLICATIONS MANAGEMENT (Zero Blinking, Stable States)  */}
        {/* ============================================================== */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-6">
            
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search App ID, Roll, Name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-deep"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              <div className="flex flex-wrap items-center gap-2.5 text-xs w-full sm:w-auto justify-end">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700"
                >
                  <option value="All">All Applications</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Payment Due">Payment Due</option>
                  <option value="Demo Payment Completed">Demo Payment Completed</option>
                </select>

                {/* Payment Filter */}
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700"
                >
                  <option value="All">All Payments</option>
                  <option value="DEMO SUCCESS">DEMO SUCCESS</option>
                  <option value="NOT PAID">NOT PAID</option>
                </select>

                {/* Background Refresh Indicator / Button */}
                <button
                  type="button"
                  onClick={() => fetchApplications(true)}
                  disabled={loadingApps || isRefreshingApps}
                  className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-600 disabled:opacity-50 transition"
                  title="Refresh records from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingApps ? 'animate-spin text-teal-deep' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error State */}
            {appsError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
                <span>{appsError}</span>
                <button
                  onClick={() => fetchApplications(false)}
                  className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Table Area: Skeletons vs Empty vs Loaded Rows */}
            <div className="overflow-x-auto relative">
              {isRefreshingApps && (
                <div className="absolute top-0 right-0 py-1 px-2.5 bg-teal-50 border border-teal-200 text-teal-deep text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Updating...</span>
                </div>
              )}

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5">App ID</th>
                    <th className="py-2.5">Candidate Name</th>
                    <th className="py-2.5">Department</th>
                    <th className="py-2.5">Degree / Roll</th>
                    <th className="py-2.5">Payment</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loadingApps && applications.length === 0 ? (
                    // Initial Loading Skeleton (5 subtle rows)
                    [1, 2, 3, 4, 5].map(n => (
                      <tr key={n} className="animate-pulse">
                        <td className="py-3.5"><div className="h-4 bg-stone-200 rounded w-28" /></td>
                        <td className="py-3.5"><div className="h-4 bg-stone-200 rounded w-36" /></td>
                        <td className="py-3.5"><div className="h-4 bg-stone-200 rounded w-44" /></td>
                        <td className="py-3.5"><div className="h-4 bg-stone-200 rounded w-24" /></td>
                        <td className="py-3.5"><div className="h-4 bg-stone-200 rounded w-20" /></td>
                        <td className="py-3.5"><div className="h-4 bg-stone-200 rounded w-24" /></td>
                        <td className="py-3.5 text-right"><div className="h-6 bg-stone-200 rounded w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : applications.length === 0 ? (
                    // Empty State
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-stone-500">
                        <p className="font-semibold text-stone-700 text-sm">No applications found.</p>
                        <p className="text-xs text-stone-400 mt-1">Try adjusting your search criteria or resetting filters.</p>
                        {(statusFilter !== 'All' || paymentFilter !== 'All' || appliedSearch) && (
                          <button
                            onClick={() => {
                              setStatusFilter('All');
                              setPaymentFilter('All');
                              handleClearSearch();
                            }}
                            className="mt-3 px-3.5 py-1.5 bg-teal-50 text-teal-deep font-bold rounded-lg hover:bg-teal-100 transition text-xs"
                          >
                            Reset Filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    // Success State: Render Applications
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-stone-50 transition">
                        <td className="py-3 font-mono font-bold text-teal-dark">{app.app_id}</td>
                        <td className="py-3 font-semibold text-stone-800">{app.student_name}</td>
                        <td className="py-3 text-stone-600 line-clamp-1">{app.department}</td>
                        <td className="py-3 text-stone-500">{app.degree_level} · {app.roll_number}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.payment_status === 'DEMO SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                          }`}>
                            {app.payment_status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.status.includes('Approved') ? 'bg-emerald-100 text-emerald-800' :
                            app.status.includes('Rejected') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenAppDetail(app.app_id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-deep font-bold rounded-lg hover:bg-teal-100 transition text-xs border border-teal-200"
                            title="Inspect full candidate record and update review status"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-stone-100 text-xs text-stone-500">
              <span>
                Showing {applications.length} of {totalApps} total records (Page {currentPage} of {Math.max(1, Math.ceil(totalApps / 10))})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loadingApps}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 font-semibold"
                >
                  Previous
                </button>
                <span className="px-2 font-mono font-bold text-stone-700">{currentPage}</span>
                <button
                  type="button"
                  disabled={currentPage * 10 >= totalApps || loadingApps}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: NOTICES MANAGEMENT                                      */}
        {/* ============================================================== */}
        {activeTab === 'notices' && (
          <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-teal-dark text-base">Demonstration Circulars & Notices</h3>
                <p className="text-xs text-stone-500">Create, edit, or publish announcements displayed to students.</p>
              </div>
              <button
                onClick={() => {
                  setNoticeForm({
                    id: null,
                    title: '',
                    category: 'Registration',
                    description: '',
                    date: '09 Nov 2026',
                    is_published: true,
                    is_new: true,
                  });
                  setShowNoticeModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-deep text-white font-bold rounded-xl text-xs hover:bg-teal-hover transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Create Notice</span>
              </button>
            </div>

            {loadingNotices ? (
              <div className="space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="p-4 rounded-xl border border-stone-100 bg-stone-50 animate-pulse h-20" />
                ))}
              </div>
            ) : notices.length === 0 ? (
              <p className="text-center py-10 text-xs text-stone-500">No notices found.</p>
            ) : (
              <div className="space-y-3">
                {notices.map((n) => (
                  <div key={n.id} className="p-4 rounded-xl border border-stone-200 flex items-center justify-between gap-4 hover:border-teal-300 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-deep">
                          {n.category}
                        </span>
                        <span className="text-xs text-stone-400">{n.date}</span>
                      </div>
                      <h4 className="font-bold text-teal-dark text-sm">{n.title}</h4>
                      <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{n.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setNoticeForm(n);
                          setShowNoticeModal(true);
                        }}
                        className="p-1.5 text-stone-500 hover:text-teal-deep rounded-lg hover:bg-stone-100"
                        title="Edit notice"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(n.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                        title="Delete notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* APPLICATION REVIEW MODAL (Real End-to-End Database Integration)*/}
      {/* ============================================================== */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl relative border border-stone-200 my-6 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#153A37] text-white px-6 py-4 flex items-center justify-between border-b border-teal-deep">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                  ADMINISTRATIVE VERIFICATION & REVIEW
                </span>
                <h3 className="text-base font-bold font-mono">
                  {reviewAppId} {selectedApp?.full_name ? `— ${selectedApp.full_name}` : ''}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              
              {reviewLoading ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-teal-deep border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-semibold text-stone-600">Retrieving application profile from database...</p>
                </div>
              ) : reviewError ? (
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Failed to retrieve application details</span>
                  </div>
                  <p className="text-xs text-stone-600">{reviewError}</p>
                  <button
                    onClick={() => reviewAppId && handleOpenAppDetail(reviewAppId)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
                  >
                    Retry Fetch
                  </button>
                </div>
              ) : selectedApp ? (
                <>
                  {statusSuccessMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{statusSuccessMessage}</span>
                    </div>
                  )}

                  {/* Photo & Core Information Grid */}
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-28 h-36 rounded-xl overflow-hidden border border-stone-300 bg-stone-100 shrink-0 shadow-sm flex items-center justify-center">
                      {selectedApp.photo_url ? (
                        <img src={selectedApp.photo_url} alt="Candidate" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-10 h-10 text-stone-300" />
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-stone-400 block text-[11px]">Candidate Name:</span>
                        <strong className="text-teal-dark font-bold text-sm">{selectedApp.full_name}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Department:</span>
                        <strong className="text-stone-800 font-semibold">{selectedApp.department_name}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Faculty:</span>
                        <strong className="text-stone-700">{selectedApp.faculty}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Degree & Category:</span>
                        <strong className="text-stone-700">{selectedApp.degree_level} ({selectedApp.registration_category || 'Regular'})</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Roll & Reg:</span>
                        <strong className="text-stone-700">{selectedApp.roll_number} / {selectedApp.registration_number || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Admission Session:</span>
                        <strong className="text-stone-700">{selectedApp.admission_session}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Contact (Protected):</span>
                        <strong className="text-stone-700 font-mono">
                          {selectedApp.mobile_masked || selectedApp.mobile} · {selectedApp.email_masked || selectedApp.email}
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Gown & Guests:</span>
                        <strong className="text-teal-deep font-bold">
                          Size {selectedApp.gown_size} · {selectedApp.guest_count} Guest(s)
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Application Date:</span>
                        <strong className="text-stone-600">{selectedApp.created_at}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Certificate Held:</span>
                        <strong className="text-stone-600">{selectedApp.original_certificate_held ? 'Yes (Waived)' : 'No (Fee Applicable)'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Fee & Payment Breakdown */}
                  <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                    <div className="flex justify-between font-bold text-teal-dark text-xs sm:text-sm">
                      <span>Total Payable Fee:</span>
                      <span className="font-mono">৳ {selectedApp.fee_breakdown?.total_payable?.toFixed(2)}</span>
                    </div>
                    <div className="text-stone-600 flex flex-wrap justify-between text-[11px] pt-1 border-t border-teal-100">
                      <span>Payment Status: <strong className={selectedApp.payment_status === 'DEMO SUCCESS' ? 'text-emerald-700 font-bold' : 'text-stone-500'}>{selectedApp.payment_status}</strong></span>
                      {selectedApp.payments && selectedApp.payments[0] && (
                        <span>
                          Method: <strong>{selectedApp.payments[0].payment_method}</strong> · Ref: <strong className="font-mono">{selectedApp.payments[0].reference_id}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Decision Panel — 4 Distinct Action Buttons */}
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-teal-dark uppercase text-[11px] tracking-wider">
                        Administrative Decision
                      </h4>
                      <span className="text-xs font-semibold text-stone-500">
                        Current: <strong className="text-teal-dark font-bold">{selectedApp.status}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Button 1: Approve Application */}
                      <button
                        type="button"
                        onClick={() => setConfirmApproveOpen(true)}
                        disabled={updatingStatus || selectedApp.status === 'Approved' || selectedApp.status === 'APPROVED'}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Application</span>
                      </button>

                      {/* Button 2: Reject Application */}
                      <button
                        type="button"
                        onClick={() => {
                          setRejectionReason(selectedApp.review_note || '');
                          setRejectModalOpen(true);
                        }}
                        disabled={updatingStatus || selectedApp.status === 'Rejected' || selectedApp.status === 'REJECTED'}
                        className="px-4 py-3 border-2 border-rose-500 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Application</span>
                      </button>

                      {/* Button 3: Request Correction */}
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectionNote('');
                          setCorrectionModalOpen(true);
                        }}
                        disabled={updatingStatus}
                        className="px-4 py-3 border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Request Correction</span>
                      </button>

                      {/* Button 4: Keep Under Review */}
                      <button
                        type="button"
                        onClick={() => handleExecuteStatusChange('PENDING_REVIEW', 'Application retained under administrative review.')}
                        disabled={updatingStatus}
                        className="px-4 py-3 border border-stone-300 text-stone-600 hover:bg-stone-100 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Keep Under Review</span>
                      </button>
                    </div>

                    {updatingStatus && (
                      <p className="text-center text-xs text-teal-deep font-semibold animate-pulse pt-1">
                        Updating status in database...
                      </p>
                    )}
                  </div>

                  {/* Status History Audit Trail */}
                  {selectedApp.status_history && selectedApp.status_history.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                        Status History & Audit Trail
                      </span>
                      <div className="space-y-1.5 divide-y divide-stone-100 border border-stone-200 rounded-xl p-3 bg-white">
                        {selectedApp.status_history.map((h: any, i: number) => (
                          <div key={i} className="pt-1.5 first:pt-0 flex justify-between text-[11px] text-stone-600">
                            <div>
                              <span className="font-semibold text-teal-dark">{h.new_status}</span>
                              {h.review_note && <span className="text-stone-500 italic ml-2">— {h.review_note}</span>}
                            </div>
                            <span className="text-stone-400 font-mono text-[10px] shrink-0">{h.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 border border-stone-300 rounded-xl font-semibold text-xs text-stone-700 hover:bg-stone-100 transition"
              >
                Close Panel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sub-Modal 1: Confirm Approval */}
      {confirmApproveOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-teal-dark">
                Approve Convocation Application?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Approve application for <strong>{selectedApp.full_name}</strong> (<code className="font-mono text-teal-deep">{selectedApp.app_id}</code>)?
              </p>
              <p className="text-xs text-emerald-800 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                This will set status to <strong>APPROVED</strong> and enable the candidate to proceed with payment on their Student Dashboard.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmApproveOpen(false)}
                disabled={updatingStatus}
                className="w-1/2 py-2.5 border border-stone-300 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleExecuteStatusChange('APPROVED', 'Application verified and approved by the Convocation Committee.')}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
              >
                {updatingStatus ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal 2: Reject Application */}
      {rejectModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">
                  Reject Application — {selectedApp.app_id}
                </h3>
                <p className="text-xs text-stone-500">Candidate: {selectedApp.full_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">Quick Reason Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {quickRejectionReasons.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">
                Reason for Rejection <span className="text-stone-400 font-normal">(visible to candidate)</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                maxLength={500}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify the verification failure reason (minimum 20 characters)..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>{rejectionReason.length < 20 ? `${20 - rejectionReason.length} more characters required` : '✓ Minimum length satisfied'}</span>
                <span>{rejectionReason.length}/500 chars</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={updatingStatus}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectionReason.trim().length < 20 || updatingStatus}
                onClick={() => handleExecuteStatusChange('REJECTED', rejectionReason.trim())}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
              >
                {updatingStatus ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal 3: Request Correction */}
      {correctionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-950">
                  Request Correction — {selectedApp.app_id}
                </h3>
                <p className="text-xs text-stone-500">Candidate: {selectedApp.full_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">Quick Correction Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {quickCorrectionNotes.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCorrectionNote(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">
                Correction Instructions <span className="text-stone-400 font-normal">(visible to candidate)</span>
              </label>
              <textarea
                rows={3}
                value={correctionNote}
                maxLength={500}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="Explain what the candidate needs to rectify..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCorrectionModalOpen(false)}
                disabled={updatingStatus}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!correctionNote.trim() || updatingStatus}
                onClick={() => handleExecuteStatusChange('CORRECTION_REQUIRED', correctionNote.trim())}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
              >
                {updatingStatus ? 'Sending...' : 'Send Correction Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Create/Edit Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-teal-dark mb-4">
              {noticeForm.id ? 'Edit Notice' : 'Create Demonstration Notice'}
            </h3>

            <form onSubmit={handleSaveNotice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="Registration">Registration</option>
                    <option value="Guidelines">Guidelines</option>
                    <option value="Schedule">Schedule</option>
                    <option value="Demonstration">Demonstration</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={noticeForm.date}
                    onChange={(e) => setNoticeForm({ ...noticeForm, date: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={noticeForm.description}
                  onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-deep text-white font-bold rounded-lg hover:bg-teal-hover transition shadow"
                >
                  Save Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
