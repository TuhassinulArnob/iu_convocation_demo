// Central API client for IU Convocation 2027 Demo Portal

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('iu_convocation_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('iu_convocation_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('iu_convocation_token');
  localStorage.removeItem('iu_convocation_user');
}

export function getCurrentUser(): any | null {
  const data = localStorage.getItem('iu_convocation_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: any): void {
  localStorage.setItem('iu_convocation_user', JSON.stringify(user));
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
    let errorDetail = 'An error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = await response.text() || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
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
    const token = getAuthToken();
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
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload photo');
    }
    return res.json();
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
