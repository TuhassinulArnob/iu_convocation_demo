// Central API client for IU Convocation 2027 Demo Portal
import { isSupabaseConfigured, uploadToSupabaseStorage } from './supabase';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export function getAuthToken(): string | null {
  // Check session storage first (for manual admin sessions), then persistent local storage for students
  return sessionStorage.getItem('iu_convocation_admin_token') || localStorage.getItem('iu_convocation_token');
}

export function setAuthToken(token: string, isAdmin: boolean = false): void {
  if (isAdmin) {
    sessionStorage.setItem('iu_convocation_admin_token', token);
  } else {
    localStorage.setItem('iu_convocation_token', token);
  }
}

export function clearAuthToken(): void {
  sessionStorage.removeItem('iu_convocation_admin_token');
  sessionStorage.removeItem('iu_convocation_admin_user');
  localStorage.removeItem('iu_convocation_token');
  localStorage.removeItem('iu_convocation_user');
}

export function getCurrentUser(): any | null {
  const adminData = sessionStorage.getItem('iu_convocation_admin_user');
  if (adminData) {
    try {
      return JSON.parse(adminData);
    } catch {
      // ignore
    }
  }

  const data = localStorage.getItem('iu_convocation_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: any, isAdmin: boolean = false): void {
  if (isAdmin || user?.role === 'admin') {
    sessionStorage.setItem('iu_convocation_admin_user', JSON.stringify(user));
  } else {
    localStorage.setItem('iu_convocation_user', JSON.stringify(user));
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || errorDetail;
      } else {
        const text = await response.text();
        errorDetail = text.trim() || errorDetail;
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export const api = {
  // Public
  getConfig: () => request<any>('/config'),
  getDepartments: () => request<any>('/departments'),
  getNotices: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    return request<any[]>(`/notices?${params.toString()}`);
  },
  getNoticeDetail: (id: number) => request<any>(`/notices/${id}`),
  getFeeStructure: () => request<any>('/fees/structure'),
  calculateFees: (data: any) => request<any>('/fees/calculate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  trackApplication: (appId: string) => request<any>(`/applications/track/${appId}`),

  // Auth
  registerStep1: (data: any) => request<any>('/auth/register-step1', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data: any) => request<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  forgotPasswordDemo: (identifier: string) => request<any>('/auth/forgot-password-demo', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  }),
  getMe: () => request<any>('/auth/me'),
  getDraft: () => request<any>('/auth/draft'),

  // Student Application
  getMyApplication: () => request<any>('/applications/my'),
  updateMyApplication: (data: any) => request<any>('/applications/my', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  submitMyApplication: () => request<any>('/applications/my/submit', {
    method: 'POST',
  }),
  getMyConvocationCard: () => request<any>('/applications/my/card'),

  // Payments
  initiatePayment: (method: string) => request<any>('/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({ payment_method: method }),
  }),
  simulatePayment: (referenceId: string, action: string = 'SUCCESS') => request<any>('/payments/simulate', {
    method: 'POST',
    body: JSON.stringify({ reference_id: referenceId, action }),
  }),
  getPaymentHistory: () => request<any[]>('/payments/history'),
  getPaymentReceipt: (referenceId: string) => request<any>(`/payments/receipt/${referenceId}`),

  // File Upload
  uploadPhoto: async (file: File) => {
    // 1. Client-side validation: format & max 2MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedTypes.includes(file.type.toLowerCase()) && !['jpg', 'jpeg', 'png'].includes(ext)) {
      throw new Error('Invalid format: Only JPG, JPEG, and PNG images are accepted.');
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error('File size exceeds the 2 MB limit. Please upload a smaller passport photo.');
    }

    const token = getAuthToken();
    const currentUser = getCurrentUser();

    // 2. If Supabase is configured and we have an authenticated user ID, upload to Supabase Storage first
    if (isSupabaseConfigured() && currentUser?.id) {
      try {
        const supaResult = await uploadToSupabaseStorage(String(currentUser.id), file);
        // Also sync photo_url to backend application
        try {
          await api.updateMyApplication({ photo_url: supaResult.photo_url });
        } catch {
          // ignore sync failure
        }
        return supaResult;
      } catch (err: any) {
        console.warn('Supabase upload attempt failed, falling back to backend storage:', err);
      }
    }

    // 3. Backend upload fallback
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/upload/photo`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      let errorMsg = `Upload failed with status ${res.status}`;
      try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const err = await res.json();
          errorMsg = err.detail || err.message || errorMsg;
        } else {
          const text = await res.text();
          errorMsg = text.trim() || errorMsg;
        }
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }

    try {
      return await res.json();
    } catch {
      throw new Error('Invalid response received from upload server.');
    }
  },

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getAdminApplications: (params: Record<string, any>) => {
    const q = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        q.append(k, params[k]);
      }
    });
    return request<any>(`/admin/applications?${q.toString()}`);
  },
  getAdminApplicationDetail: (idOrAppId: string) => request<any>(`/admin/applications/${idOrAppId}`),
  updateAdminApplicationStatus: (appId: string, newStatus: string, reviewNote?: string) => request<any>(`/admin/applications/${appId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ new_status: newStatus, review_note: reviewNote }),
  }),
  createNotice: (data: any) => request<any>('/admin/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateNotice: (id: number, data: any) => request<any>(`/admin/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteNotice: (id: number) => request<any>(`/admin/notices/${id}`, {
    method: 'DELETE',
  }),
  getExportUrl: (dataType: string) => `${API_BASE}/admin/export/csv?data_type=${dataType}`,
};
