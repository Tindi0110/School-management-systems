import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Network Resilience (Axios Retry) ---
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on 5xx errors or network errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response?.status ? error.response.status >= 500 : false);
  }
});

// --- Fine-Grained In-Memory Cache Setup ---
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
interface CacheEntry { data: any; timestamp: number; tag?: string }
let apiCache = new Map<string, CacheEntry>();

/**
 * Clears the API cache. 
 * If a tag is provided, only entries matching that tag prefix are cleared.
 */
export const clearApiCache = (tag?: string) => {
  if (!tag) {
    apiCache.clear();
  } else {
    // Collect keys to delete to avoid iteration issues
    const keysToDelete: string[] = [];
    apiCache.forEach((value, key) => {
      if (value.tag === tag || (value.tag && value.tag.startsWith(`${tag}/`))) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => apiCache.delete(key));
  }
};

/**
 * Helper to determine a cache tag from a URL
 */
const getUrlTag = (url?: string): string | undefined => {
  if (!url) return undefined;
  const parts = url.split('/').filter(Boolean);
  return parts[0]; // e.g. 'students', 'staff', 'finance'
};
// ------------------------------------------

// Request interceptor to add auth token AND handle caching for GET
api.interceptors.request.use(
  (config) => {
    // 1. Auth Headers
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // 2. Cache Strategy
    const method = config.method?.toLowerCase();

    // Clear specific tag on mutation
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      const url = config.url || '';
      const tag = getUrlTag(url);
      
      // Clear the primary tag
      clearApiCache(tag);
      
      // Cross-module invalidations
      if (['hostels', 'rooms', 'beds', 'hostel-allocations', 'hostel-attendance', 'hostel-discipline', 'hostel-assets'].some(t => url.includes(t))) {
        clearApiCache('hostels');
        clearApiCache('rooms');
        clearApiCache('beds');
        clearApiCache('hostel-allocations');
      }

      // Crucial: Clear stats/dashboard if anything sensitive changes
      if (tag === 'finance' || tag === 'students' || tag === 'staff' || tag?.startsWith('hostel') || tag === 'hostels') {
        clearApiCache('stats');
      }

      if (tag === 'academics' || url.includes('classes') || url.includes('subjects') || url.includes('exams')) {
        clearApiCache('students'); // Classes/Subjects change affects students
      }
    }

    // If it's a GET request, check the cache (Temporarily disabled for debugging)
    if (method === 'get' && !config.url?.includes('classes') && !config.url?.includes('academic-years')) {
      const key = `${config.url}?${new URLSearchParams(config.params as any || {}).toString()}`;
      const cachedResponse = apiCache.get(key);

      // If cache exists and isn't expired, override the adapter to return it instantly
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_EXPIRY) {
        config.adapter = () => Promise.resolve({
          data: cachedResponse.data,
          status: 200,
          statusText: 'OK',
          headers: {} as any,
          config,
          request: {}
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and cache saving
api.interceptors.response.use(
  (response) => {
    // Save successful GET requests to cache
    const method = response.config?.method?.toLowerCase();
    if (method === 'get' && response.status === 200) {
      const key = `${response.config.url}?${new URLSearchParams(response.config.params as any || {}).toString()}`;
      apiCache.set(key, {
        data: response.data,
        timestamp: Date.now(),
        tag: getUrlTag(response.config.url)
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    const serverError = error.response?.data?.detail || 
                        error.response?.data?.error || 
                        (typeof error.response?.data === 'string' && error.response.data.length < 100 ? error.response.data : null);

    if (serverError) {
      return Promise.reject({ ...error, message: serverError });
    }

    let message = 'An unexpected error occurred';

    if (error.response?.status === 400 && typeof error.response.data === 'object') {
      const data = error.response.data;
      const stringified = JSON.stringify(data).toLowerCase();

      // Check for common unique constraint keywords
      if (stringified.includes('unique') || stringified.includes('already exists') || stringified.includes('duplicate')) {
        message = "This record may exist already.";
      } else {
        // Fallback to grabbing the first error array if possible
        const firstKey = Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey])) {
          message = `${firstKey}: ${data[firstKey][0]}`;
        } else {
          message = data.detail || data.error || data.non_field_errors?.[0] || 'Bad Request: Please check your inputs.';
        }
      }
    } else if (error.response?.status === 404) {
      message = "The requested resource could not be found or may have been deleted.";
    } else if (error.response?.status >= 500) {
      message = "A server error occurred. Please try again later.";
    } else {
      message = error.response?.data?.detail ||
        error.response?.data?.error ||
        (typeof error.response?.data === 'string' ? error.response?.data : null) ||
        error.message || 'An unexpected error occurred.';
    }

    return Promise.reject({ ...error, message });
  }
);

// Helper configs for different data needs
export const ALL = { params: { nopage: 'true' } };
export const allWith = (extra?: Record<string, any>) => {
  const params: any = { ...extra };
  // If neither page nor nopage is specified, default to nopage=true for small datasets/dropdowns
  // but we should be careful with Students and Staff.
  if (params.page === undefined && params.nopage === undefined) {
    params.nopage = 'true';
  }
  return { params };
};
export const recentWith = (extra?: Record<string, any>) => ({ params: { page_size: 10, ...extra } });
export const summaryWith = (extra?: Record<string, any>) => ({ params: { page_size: 50, ...extra } });

// API endpoints
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/login/`, credentials),
  register: (data: any) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/register/`, data),
  resetPassword: (email: string) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/password-reset/`, { email }),
  resetPasswordConfirm: (uidb64: string, token: string, data: any) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/password-reset-confirm/${uidb64}/${token}/`, data),
  resendVerificationPublic: (email: string) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/resend-verification/public/`, { email }),
  verifyEmailOTP: (email: string, otp: string) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/verify-email-otp/`, { email, otp }),
  
  staffApproval: {
    getPending: () => api.get(`${API_BASE_URL.replace('/api', '')}/api/auth/staff-approval/`),
    approve: (userId: number) => api.post(`${API_BASE_URL.replace('/api', '')}/api/auth/staff-approval/${userId}/`),
    reject: (userId: number) => api.delete(`${API_BASE_URL.replace('/api', '')}/api/auth/staff-approval/${userId}/`),
    resendVerification: (userId: number) => api.post(`${API_BASE_URL.replace('/api', '')}/api/auth/resend-verification/${userId}/`),
  }
};

export const statsAPI = {
  getDashboard: () => api.get('stats/'),
};

export const studentsAPI = {
  getAll: (params?: Record<string, any>) => api.get('students/', allWith(params)),
  getPage: (page = 1) => api.get('students/', { params: { page } }),
  getOne: (id: number) => api.get(`students/${id}/`),
  create: (data: any) => api.post('students/', data),
  update: (id: number, data: any) => api.put(`students/${id}/`, data),
  patch: (id: number, data: any) => api.patch(`students/${id}/`, data),
  delete: (id: number) => api.delete(`students/${id}/`),
  forceDelete: (id: number) => api.delete(`students/${id}/force_delete/`),
  linkUser: (id: number) => api.post(`students/${id}/link_user/`),
  minimalSearch: (params?: Record<string, any>) => api.get('students/minimal_search/', allWith(params)),
  syncAllBalances: () => api.post('students/sync_all_balances/'),
  linkParent: (studentId: number, data: { phone?: string, parent_id?: number }) => api.post(`students/${studentId}/link_parent/`, data),
  unlinkParent: (studentId: number, data: { parent_id: number }) => api.post(`students/${studentId}/unlink_parent/`, data),

  parents: {
    getAll: (params?: Record<string, any>) => api.get('parents/', allWith(params)),
    create: (data: any) => api.post('parents/', data),
    update: (id: number, data: any) => api.put(`parents/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`parents/${id}/`, data),
    delete: (id: number) => api.delete(`parents/${id}/`),
    getForStudent: (studentId: number) => api.get('parents/', allWith({ student_id: studentId })),
  },
  admissions: {
    getAll: () => api.get('admissions/', ALL),
    create: (data: any) => api.post('admissions/', data),
    getOne: (id: number) => api.get(`admissions/${id}/`),
  },
  discipline: {
    getAll: (studentId?: number) => api.get('discipline/', allWith({ student_id: studentId })),
    create: (data: any) => api.post('discipline/', data),
    update: (id: number, data: any) => api.put(`discipline/${id}/`, data),
    delete: (id: number) => api.delete(`discipline/${id}/`),
  },
  health: {
    getOne: (studentId: number) => api.get('health/', allWith({ student_id: studentId })),
    create: (data: any) => api.post('health/', data),
    update: (id: number, data: any) => api.put(`health/${id}/`, data),
    delete: (id: number) => api.delete(`health/${id}/`),
  },
  activities: {
    getAll: (studentId: number) => api.get('activities/', allWith({ student_id: studentId })),
    create: (data: any) => api.post('activities/', data),
    update: (id: number, data: any) => api.put(`activities/${id}/`, data),
    delete: (id: number) => api.delete(`activities/${id}/`),
  },
  documents: {
    getAll: (studentId: number) => api.get('student-documents/', allWith({ student_id: studentId })),
    create: (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      return api.post('student-documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    delete: (id: number) => api.delete(`student-documents/${id}/`),
  }
};

export const staffAPI = {
  getAll: (params?: Record<string, any>) => api.get('staff/', allWith(params)),
  getOne: (id: number) => api.get(`staff/${id}/`),
  create: (data: any) => api.post('staff/', data),
  update: (id: number, data: any) => api.put(`staff/${id}/`, data),
  delete: (id: number) => api.delete(`staff/${id}/`),
  sync: () => api.post('staff/sync_staff/'),
  departments: {
    getAll: () => api.get('departments/', ALL),
    create: (data: { name: string, description?: string }) => api.post('departments/', data),
    update: (id: number, data: any) => api.put(`departments/${id}/`, data),
    delete: (id: number) => api.delete(`departments/${id}/`),
  }
};

export const academicsAPI = {
  years: {
    getAll: (params?: any) => api.get('academic-years/', allWith(params)),
    create: (data: any) => api.post('academic-years/', data),
    update: (id: number, data: any) => api.put(`academic-years/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`academic-years/${id}/`, data),
    delete: (id: number) => api.delete(`academic-years/${id}/`),
  },
  terms: {
    getAll: (params?: any) => api.get('terms/', allWith(params)),
    create: (data: any) => api.post('terms/', data),
    update: (id: number, data: any) => api.put(`terms/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`terms/${id}/`, data),
    delete: (id: number) => api.delete(`terms/${id}/`),
  },
  classes: {
    getAll: (params?: any) => api.get('classes/', allWith(params)),
    getOne: (id: number) => api.get(`classes/${id}/`),
    create: (data: any) => api.post('classes/', data),
    update: (id: number, data: any) => api.put(`classes/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`classes/${id}/`, data),
    delete: (id: number) => api.delete(`classes/${id}/`),
  },
  subjectGroups: {
    getAll: (params?: any) => api.get('subject-groups/', allWith(params)),
    create: (data: any) => api.post('subject-groups/', data),
    update: (id: number, data: any) => api.put(`subject-groups/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`subject-groups/${id}/`, data),
    delete: (id: number) => api.delete(`subject-groups/${id}/`),
  },
  subjects: {
    getAll: (params?: any) => api.get('subjects/', allWith(params)),
    create: (data: any) => api.post('subjects/', data),
    update: (id: number, data: any) => api.put(`subjects/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`subjects/${id}/`, data),
    delete: (id: number) => api.delete(`subjects/${id}/`),
  },
  gradeSystems: {
    getAll: (params?: any) => api.get('grade-systems/', allWith(params)),
    create: (data: any) => api.post('grade-systems/', data),
    update: (id: number, data: any) => api.put(`grade-systems/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`grade-systems/${id}/`, data),
    delete: (id: number) => api.delete(`grade-systems/${id}/`),
  },
  gradeBoundaries: {
    getAll: (params?: any) => api.get('grade-boundaries/', allWith(params)),
    create: (data: any) => api.post('grade-boundaries/', data),
    update: (id: number, data: any) => api.put(`grade-boundaries/${id}/`, data),
    delete: (id: number) => api.delete(`grade-boundaries/${id}/`),
  },
  exams: {
    getAll: (params?: any) => api.get('exams/', allWith(params)),
    getOne: (id: number) => api.get(`exams/${id}/`),
    create: (data: any) => api.post('exams/', data),
    update: (id: number, data: any) => api.put(`exams/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`exams/${id}/`, data),
    delete: (id: number) => api.delete(`exams/${id}/`),
  },
  results: {
    getAll: (params?: any) => api.get('student-results/', allWith(params)),
    create: (data: any) => api.post('student-results/', data),
    update: (id: number, data: any) => api.put(`student-results/${id}/`, data),
    delete: (id: number) => api.delete(`student-results/${id}/`),
    syncGrades: () => api.post('student-results/sync_grades/'),
  },
  attendance: {
    getAll: (params?: any) => api.get('attendance/', allWith(params)),
    create: (data: any) => api.post('attendance/', data),
    update: (id: number, data: any) => api.put(`attendance/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`attendance/${id}/`, data),
    delete: (id: number) => api.delete(`attendance/${id}/`),
  },
  resources: {
    getAll: () => api.get('learning-resources/', ALL),
    create: (data: any) => api.post('learning-resources/', data),
    update: (id: number, data: any) => api.put(`learning-resources/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`learning-resources/${id}/`, data),
    delete: (id: number) => api.delete(`learning-resources/${id}/`),
  },
  events: {
    getAll: (params?: any) => api.get('school-events/', allWith(params)),
    create: (data: any) => api.post('school-events/', data),
  },
  syllabus: {
    getAll: () => api.get('syllabus-coverage/', ALL),
    create: (data: any) => api.post('syllabus-coverage/', data),
    update: (id: number, data: any) => api.put(`syllabus-coverage/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`syllabus-coverage/${id}/`, data),
    delete: (id: number) => api.delete(`syllabus-coverage/${id}/`),
  },
  classSubjects: {
    list: (params: any) => api.get('class-subjects/', allWith(params)),
    create: (data: any) => api.post('class-subjects/', data),
    update: (id: number, data: any) => api.put(`class-subjects/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`class-subjects/${id}/`, data),
    delete: (id: number) => api.delete(`class-subjects/${id}/`),
    sync: (id: number) => api.post(`class-subjects/${id}/sync_students/`),
  },
  studentSubjects: {
    list: (params: any) => api.get('student-subjects/', allWith(params)),
    create: (data: any) => api.post('student-subjects/', data),
    update: (id: number, data: any) => api.put(`student-subjects/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`student-subjects/${id}/`, data),
    delete: (id: number) => api.delete(`student-subjects/${id}/`),
  },
};

export const classesAPI = academicsAPI.classes;
export const subjectsAPI = academicsAPI.subjects;

export const timetableAPI = {
  getAll: (params?: any) => api.get('timetable/', allWith(params)),
  create: (data: any) => api.post('timetable/', data),
  update: (id: number, data: any) => api.put(`timetable/${id}/`, data),
  delete: (id: number) => api.delete(`timetable/${id}/`),
};

export const financeAPI = {
  feeStructures: {
    getAll: (params?: any) => api.get('fee-structures/', allWith(params)),
    create: (data: any) => api.post('fee-structures/', data),
    update: (id: number, data: any) => api.put(`fee-structures/${id}/`, data),
    delete: (id: number) => api.delete(`fee-structures/${id}/`),
  },
  invoices: {
    getAll: (params?: any) => api.get('invoices/', allWith(params)),
    getOne: (id: number) => api.get(`invoices/${id}/`),
    generateBatch: (data: { level: string, class_id: any, term: number, year_id: number }) => api.post('invoices/generate_batch/', data),
    syncAll: () => api.post('invoices/sync_all/'),
    dashboardStats: (params?: any) => api.get('invoices/dashboard_stats/', { params }),
    sendReminders: (data: { selected_ids: number[], message_template: string, send_sms: boolean, send_email: boolean }) =>
      api.post('invoices/send_reminders/', data),
  },
  payments: {
    getAll: (params?: any) => api.get('payments/', allWith(params)),
    create: (data: any) => api.post('payments/', data),
    getOne: (id: number) => api.get(`payments/${id}/`),
  },
  adjustments: {
    getAll: (params?: any) => api.get('adjustments/', allWith(params)),
    create: (data: any) => api.post('adjustments/', data),
  },
  expenses: {
    getAll: (params?: any) => api.get('expenses/', allWith(params)),
    create: (data: any) => api.post('expenses/', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
    update: (id: number, data: any) => api.put(`expenses/${id}/`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
    patch: (id: number, data: any) => api.patch(`expenses/${id}/`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
    delete: (id: number) => api.delete(`expenses/${id}/`),
    approve: (id: number) => api.post(`expenses/${id}/approve/`),
    decline: (id: number) => api.post(`expenses/${id}/decline/`),
  }
};

export const hostelAPI = {
  hostels: {
    getAll: (params?: Record<string, any>) => api.get('hostels/', allWith(params)),
    create: (data: any) => api.post('hostels/', data),
    update: (id: number, data: any) => api.put(`hostels/${id}/`, data),
    delete: (id: number) => api.delete(`hostels/${id}/`),
    getStats: () => api.get('hostels/dashboard_stats/'),
  },
  rooms: {
    getAll: (params?: Record<string, any>) => api.get('rooms/', allWith(params)),
    create: (data: any) => api.post('rooms/', data),
    update: (id: number, data: any) => api.put(`rooms/${id}/`, data),
    delete: (id: number) => api.delete(`rooms/${id}/`),
  },
  beds: {
    getAll: (params?: Record<string, any>) => api.get('beds/', allWith(params)),
    create: (data: any) => api.post('beds/', data),
    update: (id: number, data: any) => api.put(`beds/${id}/`, data),
    delete: (id: number) => api.delete(`beds/${id}/`),
  },
  allocations: {
    getAll: (params?: Record<string, any>) => api.get('hostel-allocations/', allWith(params)),
    create: (data: any) => api.post('hostel-allocations/', data),
    update: (id: number, data: any) => api.put(`hostel-allocations/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-allocations/${id}/`),
    transfer: (id: number, newBedId: number) => api.post(`hostel-allocations/${id}/transfer/`, { new_bed_id: newBedId }),
  },
  attendance: {
    getAll: (params?: Record<string, any>) => api.get('hostel-attendance/', allWith(params)),
    create: (data: any) => api.post('hostel-attendance/', data),
    update: (id: number, data: any) => api.put(`hostel-attendance/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-attendance/${id}/`),
    bulkMark: (data: { room_id: number; date: string; session: string; attendance_data: any[] }) =>
      api.post('hostel-attendance/bulk_mark/', data),
  },
  discipline: {
    getAll: (params?: Record<string, any>) => api.get('hostel-discipline/', allWith(params)),
    create: (data: any) => api.post('hostel-discipline/', data),
    update: (id: number, data: any) => api.put(`hostel-discipline/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-discipline/${id}/`),
  },
  assets: {
    getAll: (params?: Record<string, any>) => api.get('hostel-assets/', allWith(params)),
    create: (data: any) => api.post('hostel-assets/', data),
    update: (id: number, data: any) => api.put(`hostel-assets/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-assets/${id}/`),
  },
  guests: {
    getAll: (params?: Record<string, any>) => api.get('hostel-guests/', allWith(params)),
    create: (data: any) => api.post('hostel-guests/', data),
    update: (id: number, data: any) => api.put(`hostel-guests/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-guests/${id}/`),
  },
  maintenance: {
    getAll: (params?: Record<string, any>) => api.get('hostel-maintenance/', allWith(params)),
    create: (data: any) => api.post('hostel-maintenance/', data),
    update: (id: number, data: any) => api.put(`hostel-maintenance/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-maintenance/${id}/`),
  }
};

export const libraryAPI = {
  config: {
    getAll: (params?: Record<string, any>) => api.get('library-config/', allWith(params)),
    create: (data: any) => api.post('library-config/', data),
  },
  books: {
    getAll: (params?: Record<string, any>) => api.get('books/', allWith(params)),
    create: (data: any) => api.post('books/', data),
    update: (id: number, data: any) => api.put(`books/${id}/`, data),
    delete: (id: number) => api.delete(`books/${id}/`),
    getDashboardStats: () => api.get('books/dashboard_stats/'),
  },
  copies: {
    getAll: (params?: Record<string, any>) => api.get('book-copies/', allWith(params)),
    create: (data: any) => api.post('book-copies/', data),
    update: (id: number, data: any) => api.put(`book-copies/${id}/`, data),
    delete: (id: number) => api.delete(`book-copies/${id}/`),
  },
  lendings: {
    getAll: (params?: any) => api.get('book-lendings/', allWith(params)),
    create: (data: any) => api.post('book-lendings/', data),
    update: (id: number, data: any) => api.put(`book-lendings/${id}/`, data),
    delete: (id: number) => api.delete(`book-lendings/${id}/`),
    returnBook: (id: number) => api.post(`book-lendings/${id}/return_book/`),
    extendDueDate: (id: number, data: { days: number }) => api.post(`book-lendings/${id}/extend_due_date/`, data),
  },
  fines: {
    getAll: (params?: Record<string, any>) => api.get('library-fines/', allWith(params)),
    create: (data: any) => api.post('library-fines/', data),
    update: (id: number, data: any) => api.put(`library-fines/${id}/`, data),
    delete: (id: number) => api.delete(`library-fines/${id}/`),
    syncToFinance: () => api.post('library-fines/sync_to_finance/'),
  },
  reservations: {
    getAll: (params?: Record<string, any>) => api.get('book-reservations/', allWith(params)),
    create: (data: any) => api.post('book-reservations/', data),
  }
};

export const medicalAPI = {
  getAll: () => api.get('medical-records/', ALL),
  create: (data: any) => api.post('medical-records/', data),
  update: (id: number, data: any) => api.put(`medical-records/${id}/`, data),
  delete: (id: number) => api.delete(`medical-records/${id}/`),
};

export const transportAPI = {
  config: {
    get: () => api.get('transport-config/'),
    update: (id: number, data: any) => api.put(`transport-config/${id}/`, data),
  },
  vehicles: {
    getAll: (params?: Record<string, any>) => api.get('vehicles/', allWith(params)),
    create: (data: any) => api.post('vehicles/', data),
    update: (id: number, data: any) => api.put(`vehicles/${id}/`, data),
    delete: (id: number) => api.delete(`vehicles/${id}/`),
    getMaintenance: (id: number) => api.get(`vehicles/${id}/maintenance_history/`),
  },
  drivers: {
    getAll: (params?: Record<string, any>) => api.get('driver-profiles/', allWith(params)),
    create: (data: any) => api.post('driver-profiles/', data),
    update: (id: number, data: any) => api.put(`driver-profiles/${id}/`, data),
  },
  routes: {
    getAll: (params?: Record<string, any>) => api.get('routes/', allWith(params)),
    create: (data: any) => api.post('routes/', data),
    update: (id: number, data: any) => api.put(`routes/${id}/`, data),
    delete: (id: number) => api.delete(`routes/${id}/`),
  },
  pickupPoints: {
    getAll: (params?: Record<string, any>) => api.get('pickup-points/', allWith(params)),
    create: (data: any) => api.post('pickup-points/', data),
    update: (id: number, data: any) => api.put(`pickup-points/${id}/`, data),
    delete: (id: number) => api.delete(`pickup-points/${id}/`),
  },
  allocations: {
    getAll: (params?: Record<string, any>) => api.get('transport-allocations/', allWith(params)),
    create: (data: any) => api.post('transport-allocations/', data),
    update: (id: number, data: any) => api.put(`transport-allocations/${id}/`, data),
    delete: (id: number) => api.delete(`transport-allocations/${id}/`),
  },
  tripLogs: {
    getAll: (params?: Record<string, any>) => api.get('trip-logs/', allWith(params)),
    create: (data: any) => api.post('trip-logs/', data),
    update: (id: number, data: any) => api.put(`trip-logs/${id}/`, data),
    delete: (id: number) => api.delete(`trip-logs/${id}/`),
    markAttendance: (tripId: number, studentId: number, isPresent: boolean) =>
      api.post(`trip-logs/${tripId}/mark_attendance/`, { student_id: studentId, is_present: isPresent }),
  },
  maintenance: {
    getAll: (params?: Record<string, any>) => api.get('vehicle-maintenance/', allWith(params)),
    create: (data: any) => api.post('vehicle-maintenance/', data),
    update: (id: number, data: any) => api.put(`vehicle-maintenance/${id}/`, data),
    delete: (id: number) => api.delete(`vehicle-maintenance/${id}/`),
  },
  fuel: {
    getAll: (params?: Record<string, any>) => api.get('fuel-records/', allWith(params)),
    create: (data: any) => api.post('fuel-records/', data),
    update: (id: number, data: any) => api.put(`fuel-records/${id}/`, data),
    delete: (id: number) => api.delete(`fuel-records/${id}/`),
  },
  incidents: {
    getAll: (params?: Record<string, any>) => api.get('transport-incidents/', allWith(params)),
    create: (data: any) => api.post('transport-incidents/', data),
    update: (id: number, data: any) => api.put(`transport-incidents/${id}/`, data),
    delete: (id: number) => api.delete(`transport-incidents/${id}/`),
  }
};

export const communicationAPI = {
  notifications: {
    getAll: (params?: any) => api.get('notifications/', recentWith(params)),
    getUnread: () => api.get('notifications/', recentWith({ is_read: false })),
    update: (id: number, data: any) => api.patch(`notifications/${id}/`, data),
  },
  alerts: {
    getAll: (params?: any) => api.get('alerts/', recentWith(params)),
    getActive: () => api.get('alerts/', recentWith({ is_active: true })),
    create: (data: any) => api.post('alerts/', data),
  }
};

export const auditAPI = {
  health: {
    get: () => api.get('audit/status/'),
  }
};

export const mpesaAPI = {
  push: (data: { phone_number: string, amount: number, admission_number: string }) => api.post('mpesa/push/', data),
};

export default api;
