import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    let message = 'An unexpected error occurred';

    // Check if Django sent a field-validation object for a 400 error
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

// Helper: always fetch full dataset for list endpoints
const ALL = { params: { page_size: 2000 } };
const allWith = (extra?: Record<string, any>) => ({ params: { page_size: 2000, ...extra } });

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
};

export const statsAPI = {
  getDashboard: () => api.get('/stats/'),
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

  parents: {
    getAll: () => api.get('parents/', ALL),
    create: (data: any) => api.post('parents/', data),
    update: (id: number, data: any) => api.put(`parents/${id}/`, data),
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
  getAll: () => api.get('staff/', ALL),
  getOne: (id: number) => api.get(`staff/${id}/`),
  create: (data: any) => api.post('staff/', data),
  update: (id: number, data: any) => api.put(`staff/${id}/`, data),
  delete: (id: number) => api.delete(`staff/${id}/`),
};

export const academicsAPI = {
  years: {
    getAll: () => api.get('academic-years/', ALL),
    create: (data: any) => api.post('academic-years/', data),
    update: (id: number, data: any) => api.put(`academic-years/${id}/`, data),
    delete: (id: number) => api.delete(`academic-years/${id}/`),
  },
  terms: {
    getAll: () => api.get('terms/', ALL),
    create: (data: any) => api.post('terms/', data),
    update: (id: number, data: any) => api.put(`terms/${id}/`, data),
    delete: (id: number) => api.delete(`terms/${id}/`),
  },
  classes: {
    getAll: () => api.get('classes/', ALL),
    getOne: (id: number) => api.get(`classes/${id}/`),
    create: (data: any) => api.post('classes/', data),
    update: (id: number, data: any) => api.put(`classes/${id}/`, data),
    delete: (id: number) => api.delete(`classes/${id}/`),
  },
  subjectGroups: {
    getAll: () => api.get('subject-groups/', ALL),
    create: (data: any) => api.post('subject-groups/', data),
    update: (id: number, data: any) => api.put(`subject-groups/${id}/`, data),
    delete: (id: number) => api.delete(`subject-groups/${id}/`),
  },
  subjects: {
    getAll: () => api.get('subjects/', ALL),
    create: (data: any) => api.post('subjects/', data),
    update: (id: number, data: any) => api.put(`subjects/${id}/`, data),
    delete: (id: number) => api.delete(`subjects/${id}/`),
  },
  gradeSystems: {
    getAll: () => api.get('grade-systems/', ALL),
    create: (data: any) => api.post('grade-systems/', data),
    update: (id: number, data: any) => api.put(`grade-systems/${id}/`, data),
    delete: (id: number) => api.delete(`grade-systems/${id}/`),
  },
  gradeBoundaries: {
    getAll: () => api.get('grade-boundaries/', ALL),
    create: (data: any) => api.post('grade-boundaries/', data),
    update: (id: number, data: any) => api.put(`grade-boundaries/${id}/`, data),
    delete: (id: number) => api.delete(`grade-boundaries/${id}/`),
  },
  exams: {
    getAll: () => api.get('exams/', ALL),
    getOne: (id: number) => api.get(`exams/${id}/`),
    create: (data: any) => api.post('exams/', data),
    update: (id: number, data: any) => api.put(`exams/${id}/`, data),
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
    delete: (id: number) => api.delete(`attendance/${id}/`),
  },
  resources: {
    getAll: () => api.get('learning-resources/', ALL),
    create: (data: any) => api.post('learning-resources/', data),
    update: (id: number, data: any) => api.put(`learning-resources/${id}/`, data),
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
    delete: (id: number) => api.delete(`syllabus-coverage/${id}/`),
  },
  classSubjects: {
    list: (params: any) => api.get('class-subjects/', allWith(params)),
    create: (data: any) => api.post('class-subjects/', data),
    delete: (id: number) => api.delete(`class-subjects/${id}/`),
    sync: (id: number) => api.post(`class-subjects/${id}/sync_students/`),
  },
  studentSubjects: {
    list: (params: any) => api.get('student-subjects/', allWith(params)),
    create: (data: any) => api.post('student-subjects/', data),
    update: (id: number, data: any) => api.put(`student-subjects/${id}/`, data),
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
    getAll: () => api.get('fee-structures/', ALL),
    create: (data: any) => api.post('fee-structures/', data),
    update: (id: number, data: any) => api.put(`fee-structures/${id}/`, data),
    delete: (id: number) => api.delete(`fee-structures/${id}/`),
  },
  invoices: {
    getAll: (params?: any) => api.get('invoices/', allWith(params)),
    getOne: (id: number) => api.get(`invoices/${id}/`),
    generateBatch: (data: { class_id: number, term: number, year_id: number }) => api.post('invoices/generate_batch/', data),
    syncAll: () => api.post('invoices/sync_all/'),
    dashboardStats: () => api.get('invoices/dashboard_stats/'),
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
    getAll: () => api.get('expenses/', ALL),
    create: (data: any) => api.post('expenses/', data),
    update: (id: number, data: any) => api.put(`expenses/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`expenses/${id}/`, data),
    delete: (id: number) => api.delete(`expenses/${id}/`),
  }
};

export const hostelAPI = {
  hostels: {
    getAll: () => api.get('hostels/', ALL),
    create: (data: any) => api.post('hostels/', data),
    update: (id: number, data: any) => api.put(`hostels/${id}/`, data),
    delete: (id: number) => api.delete(`hostels/${id}/`),
  },
  rooms: {
    getAll: () => api.get('rooms/', ALL),
    create: (data: any) => api.post('rooms/', data),
    update: (id: number, data: any) => api.put(`rooms/${id}/`, data),
    delete: (id: number) => api.delete(`rooms/${id}/`),
  },
  beds: {
    getAll: () => api.get('beds/', ALL),
    create: (data: any) => api.post('beds/', data),
    update: (id: number, data: any) => api.put(`beds/${id}/`, data),
    delete: (id: number) => api.delete(`beds/${id}/`),
  },
  allocations: {
    getAll: () => api.get('hostel-allocations/', ALL),
    create: (data: any) => api.post('hostel-allocations/', data),
    update: (id: number, data: any) => api.put(`hostel-allocations/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-allocations/${id}/`),
    transfer: (id: number, newBedId: number) => api.post(`hostel-allocations/${id}/transfer/`, { new_bed_id: newBedId }),
  },
  attendance: {
    getAll: () => api.get('hostel-attendance/', ALL),
    create: (data: any) => api.post('hostel-attendance/', data),
    update: (id: number, data: any) => api.put(`hostel-attendance/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-attendance/${id}/`),
  },
  discipline: {
    getAll: () => api.get('hostel-discipline/', ALL),
    create: (data: any) => api.post('hostel-discipline/', data),
    update: (id: number, data: any) => api.put(`hostel-discipline/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-discipline/${id}/`),
  },
  assets: {
    getAll: () => api.get('hostel-assets/', ALL),
    create: (data: any) => api.post('hostel-assets/', data),
    update: (id: number, data: any) => api.put(`hostel-assets/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-assets/${id}/`),
  },
  guests: {
    getAll: () => api.get('hostel-guests/', ALL),
    create: (data: any) => api.post('hostel-guests/', data),
    update: (id: number, data: any) => api.put(`hostel-guests/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-guests/${id}/`),
  },
  maintenance: {
    getAll: () => api.get('hostel-maintenance/', ALL),
    create: (data: any) => api.post('hostel-maintenance/', data),
    update: (id: number, data: any) => api.put(`hostel-maintenance/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-maintenance/${id}/`),
  }
};

export const libraryAPI = {
  config: {
    getAll: () => api.get('library-config/', ALL),
    create: (data: any) => api.post('library-config/', data),
  },
  books: {
    getAll: () => api.get('books/', ALL),
    create: (data: any) => api.post('books/', data),
    update: (id: number, data: any) => api.put(`books/${id}/`, data),
    delete: (id: number) => api.delete(`books/${id}/`),
  },
  copies: {
    getAll: () => api.get('book-copies/', ALL),
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
    getAll: () => api.get('library-fines/', ALL),
    create: (data: any) => api.post('library-fines/', data),
    update: (id: number, data: any) => api.put(`library-fines/${id}/`, data),
    delete: (id: number) => api.delete(`library-fines/${id}/`),
    syncToFinance: () => api.post('library-fines/sync_to_finance/'),
  },
  reservations: {
    getAll: () => api.get('book-reservations/', ALL),
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
    getAll: () => api.get('vehicles/', ALL),
    create: (data: any) => api.post('vehicles/', data),
    update: (id: number, data: any) => api.put(`vehicles/${id}/`, data),
    delete: (id: number) => api.delete(`vehicles/${id}/`),
    getMaintenance: (id: number) => api.get(`vehicles/${id}/maintenance_history/`),
  },
  drivers: {
    getAll: () => api.get('driver-profiles/', ALL),
    create: (data: any) => api.post('driver-profiles/', data),
    update: (id: number, data: any) => api.put(`driver-profiles/${id}/`, data),
  },
  routes: {
    getAll: () => api.get('routes/', ALL),
    create: (data: any) => api.post('routes/', data),
    update: (id: number, data: any) => api.put(`routes/${id}/`, data),
    delete: (id: number) => api.delete(`routes/${id}/`),
  },
  pickupPoints: {
    getAll: () => api.get('pickup-points/', ALL),
    create: (data: any) => api.post('pickup-points/', data),
    update: (id: number, data: any) => api.put(`pickup-points/${id}/`, data),
    delete: (id: number) => api.delete(`pickup-points/${id}/`),
  },
  allocations: {
    getAll: () => api.get('transport-allocations/', ALL),
    create: (data: any) => api.post('transport-allocations/', data),
    update: (id: number, data: any) => api.put(`transport-allocations/${id}/`, data),
    delete: (id: number) => api.delete(`transport-allocations/${id}/`),
  },
  tripLogs: {
    getAll: () => api.get('trip-logs/', ALL),
    create: (data: any) => api.post('trip-logs/', data),
    update: (id: number, data: any) => api.put(`trip-logs/${id}/`, data),
    delete: (id: number) => api.delete(`trip-logs/${id}/`),
    markAttendance: (tripId: number, studentId: number, isPresent: boolean) =>
      api.post(`trip-logs/${tripId}/mark_attendance/`, { student_id: studentId, is_present: isPresent }),
  },
  maintenance: {
    getAll: () => api.get('vehicle-maintenance/', ALL),
    create: (data: any) => api.post('vehicle-maintenance/', data),
    update: (id: number, data: any) => api.put(`vehicle-maintenance/${id}/`, data),
    delete: (id: number) => api.delete(`vehicle-maintenance/${id}/`),
  },
  fuel: {
    getAll: () => api.get('fuel-records/', ALL),
    create: (data: any) => api.post('fuel-records/', data),
    update: (id: number, data: any) => api.put(`fuel-records/${id}/`, data),
    delete: (id: number) => api.delete(`fuel-records/${id}/`),
  },
  incidents: {
    getAll: () => api.get('transport-incidents/', ALL),
    create: (data: any) => api.post('transport-incidents/', data),
    update: (id: number, data: any) => api.put(`transport-incidents/${id}/`, data),
    delete: (id: number) => api.delete(`transport-incidents/${id}/`),
  }
};

export const communicationAPI = {
  notifications: {
    getAll: () => api.get('notifications/', ALL),
    update: (id: number, data: any) => api.patch(`notifications/${id}/`, data),
  },
  alerts: {
    getAll: () => api.get('alerts/', ALL),
  }
};

export const auditAPI = {
  health: {
    get: () => api.get('audit/health/'),
  }
};

export const mpesaAPI = {
  push: (data: { phone_number: string, amount: number, admission_number: string }) => api.post('mpesa/push/', data),
};

export default api;
