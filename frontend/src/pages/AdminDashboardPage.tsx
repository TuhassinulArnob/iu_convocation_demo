import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Users, FileText, CheckCircle2, XCircle, 
  Clock, DollarSign, Search, Filter, Download, Plus, 
  Trash2, Edit3, Eye, ArrowUpDown, RefreshCw, X, AlertTriangle 
} from 'lucide-react';
import { api, getCurrentUser, clearAuthToken } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'notices'>('overview');
  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Applications Tab State
  const [applications, setApplications] = useState<any[]>([]);
  const [totalApps, setTotalApps] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [loadingApps, setLoadingApps] = useState(false);

  // Application Detail Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Notices Tab State
  const [notices, setNotices] = useState<any[]>([]);
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

  const currentUser = getCurrentUser();

  // Check RBAC
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchStats();
    fetchApplications();
    fetchNotices();
  }, [currentUser]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await api.getAdminApplications({
        search: search.trim() || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
        payment_status: paymentFilter === 'All' ? undefined : paymentFilter,
        page: currentPage,
        page_size: 10,
      });
      setApplications(res.items);
      setTotalApps(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchNotices = async () => {
    try {
      const data = await api.getNotices();
      setNotices(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab, currentPage, statusFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplications();
  };

  const handleOpenAppDetail = async (appId: string) => {
    try {
      const detail = await api.getAdminApplicationDetail(appId);
      setSelectedApp(detail);
      setNewStatus(detail.status);
      setReviewNote(detail.review_note || '');
    } catch (err: any) {
      alert(err.message || 'Failed to fetch application profile.');
    }
  };

  const handleStatusChange = async () => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      await api.updateAdminApplicationStatus(selectedApp.app_id, newStatus, reviewNote);
      alert(`Application ${selectedApp.app_id} status updated to ${newStatus}`);
      setSelectedApp(null);
      fetchApplications();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-iu-bg pb-20">
      
      {/* Top Banner */}
      <div className="bg-[#153A37] text-white py-8 border-b border-teal-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-deep text-gold-warm flex items-center justify-center font-bold shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest block">
                DEMO ADMIN PANEL — UNOFFICIAL PROJECT
              </span>
              <h1 className="text-2xl font-black">
                Convocation Administrative Console
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={api.getExportUrl('applications')}
              download="applications.csv"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-deep hover:bg-teal-hover text-white rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <button
              onClick={() => {
                clearAuthToken();
                navigate('/login');
              }}
              className="px-3.5 py-2 border border-white/20 text-stone-300 hover:text-white rounded-xl text-xs font-semibold hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
            <span>Application Management ({stats?.total_applications || 0})</span>
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            
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

            {/* Department & Degree Breakdown Charts (HTML/Tailwind Bar Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Department Distribution */}
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
                          className="h-full bg-teal-deep rounded-full"
                          style={{ width: `${Math.min(100, (d.count / (stats.total_applications || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Degree Level Distribution */}
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
                          className="h-full bg-gold-warm rounded-full"
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

          </div>
        )}

        {/* TAB 2: APPLICATIONS MANAGEMENT */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-iu-border shadow-sm p-6 space-y-6">
            
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search App ID, Roll, Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-deep"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved (Demo)">Approved (Demo)</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Awaiting Payment">Awaiting Payment</option>
                  <option value="Account Created">Account Created</option>
                  <option value="Rejected (Demo)">Rejected (Demo)</option>
                </select>

                {/* Payment Filter */}
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                >
                  <option value="All">All Payments</option>
                  <option value="DEMO SUCCESS">DEMO SUCCESS</option>
                  <option value="NOT PAID">NOT PAID</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loadingApps ? (
              <div className="text-center py-12 text-stone-500 text-xs">Loading application records...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-xs">No applications match your criteria.</div>
            ) : (
              <div className="overflow-x-auto">
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
                    {applications.map((app) => (
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
                            onClick={() => handleOpenAppDetail(app.app_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-deep font-bold rounded-lg hover:bg-teal-100 transition text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-stone-100 text-xs text-stone-500">
              <span>Showing {applications.length} of {totalApps} total records</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 border border-stone-200 rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={applications.length < 10}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border border-stone-200 rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: NOTICES MANAGEMENT */}
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

            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="p-4 rounded-xl border border-stone-200 flex items-center justify-between gap-4">
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
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Application Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl relative border border-stone-200 my-6 overflow-hidden">
            
            <div className="bg-teal-dark text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gold-warm uppercase tracking-widest block">ADMIN REVIEW PROFILE</span>
                <h3 className="text-base font-bold font-mono">{selectedApp.app_id} — {selectedApp.full_name}</h3>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-stone-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* Photo & Core Information */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-28 h-36 rounded-xl overflow-hidden border border-stone-300 bg-stone-100 shrink-0">
                  {selectedApp.photo_url ? (
                    <img src={selectedApp.photo_url} alt="Candidate" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-10 h-10 text-stone-300 m-auto mt-10" />
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div><span className="text-stone-400">Department:</span> <strong className="block text-teal-dark">{selectedApp.department_name}</strong></div>
                  <div><span className="text-stone-400">Faculty:</span> <strong className="block text-stone-700">{selectedApp.faculty}</strong></div>
                  <div><span className="text-stone-400">Degree & Session:</span> <strong className="block text-stone-700">{selectedApp.degree_level} · {selectedApp.admission_session}</strong></div>
                  <div><span className="text-stone-400">Roll / Reg:</span> <strong className="block text-stone-700">{selectedApp.roll_number} / {selectedApp.registration_number}</strong></div>
                  <div><span className="text-stone-400">Mobile & Email:</span> <strong className="block text-stone-700">{selectedApp.mobile} · {selectedApp.email}</strong></div>
                  <div><span className="text-stone-400">Gown & Guests:</span> <strong className="block text-teal-deep font-bold">{selectedApp.gown_size} · {selectedApp.guest_count} guests</strong></div>
                </div>
              </div>

              {/* Fee & Payment Breakdown */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                <div className="flex justify-between font-bold text-teal-dark">
                  <span>Fee Calculation Breakdown:</span>
                  <span>Total: ৳ {selectedApp.fee_breakdown?.total_payable?.toFixed(2)}</span>
                </div>
                <div className="text-stone-600 flex justify-between text-[11px]">
                  <span>Payment Status: <strong className="text-emerald-700">{selectedApp.payment_status}</strong></span>
                  <span>Simulated Records: {selectedApp.payments?.length || 0}</span>
                </div>
              </div>

              {/* Status Transition & Review Note Form */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <h4 className="font-bold text-teal-dark uppercase text-[11px] tracking-wider">
                  Update Application Status (Demo)
                </h4>
                
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Select New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs font-bold text-teal-dark"
                  >
                    <option value="Under Review">Under Review</option>
                    <option value="Approved (Demo)">Approved (Demo) — Activates Convocation Card</option>
                    <option value="Rejected (Demo)">Rejected (Demo)</option>
                    <option value="Correction Required">Correction Required</option>
                    <option value="Submitted">Submitted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Administrative Review Note</label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter verification remarks..."
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={updatingStatus}
                  className="w-full py-2.5 bg-teal-deep hover:bg-teal-hover text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating Status...' : 'Save Status Change & Log History'}
                </button>
              </div>

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
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
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
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
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
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-deep text-white font-bold rounded-lg hover:bg-teal-hover"
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
