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
    const message = error.response?.data?.detail ||
      error.response?.data?.error ||
      (typeof error.response?.data === 'string' ? error.response?.data : null) ||
      error.message;
    return Promise.reject({ ...error, message });
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api-token-auth/`, credentials),
  register: (data: any) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/register/`, data),
  resetPassword: (email: string) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/password-reset/`, { email }),
  resetPasswordConfirm: (uidb64: string, token: string, data: any) =>
    axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/password-reset-confirm/${uidb64}/${token}/`, data),
};

export const studentsAPI = {
  getAll: () => api.get('students/'),
  getOne: (id: number) => api.get(`students/${id}/`),
  create: (data: any) => api.post('students/', data),
  update: (id: number, data: any) => api.put(`students/${id}/`, data),
  patch: (id: number, data: any) => api.patch(`students/${id}/`, data),
  delete: (id: number) => api.delete(`students/${id}/`),
  forceDelete: (id: number) => api.delete(`students/${id}/force_delete/`),
  linkUser: (id: number) => api.post(`students/${id}/link_user/`),

  // SIS Nested Endpoints
  parents: {
    getAll: () => api.get('parents/'),
    create: (data: any) => api.post('parents/', data),
    update: (id: number, data: any) => api.put(`parents/${id}/`, data),
    delete: (id: number) => api.delete(`parents/${id}/`),
    getForStudent: (studentId: number) => api.get(`parents/?student_id=${studentId}`),
  },
  admissions: {
    getAll: () => api.get('admissions/'),
    create: (data: any) => api.post('admissions/', data),
    getOne: (id: number) => api.get(`admissions/${id}/`),
  },
  discipline: {
    getAll: (studentId?: number) => api.get('discipline/', { params: { student_id: studentId } }),
    create: (data: any) => api.post('discipline/', data),
    update: (id: number, data: any) => api.put(`discipline/${id}/`, data),
    delete: (id: number) => api.delete(`discipline/${id}/`),
  },
  health: {
    getOne: (studentId: number) => api.get(`health/?student_id=${studentId}`),
    create: (data: any) => api.post('health/', data),
    update: (id: number, data: any) => api.put(`health/${id}/`, data),
    delete: (id: number) => api.delete(`health/${id}/`),
  },
  activities: {
    getAll: (studentId: number) => api.get(`activities/?student_id=${studentId}`),
    create: (data: any) => api.post('activities/', data),
    update: (id: number, data: any) => api.put(`activities/${id}/`, data),
    delete: (id: number) => api.delete(`activities/${id}/`),
  },
  documents: {
    getAll: (studentId: number) => api.get(`student-documents/?student_id=${studentId}`),
    create: (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      return api.post('student-documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    delete: (id: number) => api.delete(`student-documents/${id}/`),
  }
};

export const staffAPI = {
  getAll: () => api.get('staff/'),
  getOne: (id: number) => api.get(`staff/${id}/`),
  create: (data: any) => api.post('staff/', data),
  update: (id: number, data: any) => api.put(`staff/${id}/`, data),
  delete: (id: number) => api.delete(`staff/${id}/`),
};

export const academicsAPI = {
  years: {
    getAll: () => api.get('academic-years/'),
    create: (data: any) => api.post('academic-years/', data),
    update: (id: number, data: any) => api.put(`academic-years/${id}/`, data),
    delete: (id: number) => api.delete(`academic-years/${id}/`),
  },
  terms: {
    getAll: () => api.get('terms/'),
    create: (data: any) => api.post('terms/', data),
    update: (id: number, data: any) => api.put(`terms/${id}/`, data),
    delete: (id: number) => api.delete(`terms/${id}/`),
  },
  classes: {
    getAll: () => api.get('classes/'),
    getOne: (id: number) => api.get(`classes/${id}/`),
    create: (data: any) => api.post('classes/', data),
    update: (id: number, data: any) => api.put(`classes/${id}/`, data),
    delete: (id: number) => api.delete(`classes/${id}/`),
  },
  subjectGroups: {
    getAll: () => api.get('subject-groups/'),
    create: (data: any) => api.post('subject-groups/', data),
    update: (id: number, data: any) => api.put(`subject-groups/${id}/`, data),
    delete: (id: number) => api.delete(`subject-groups/${id}/`),
  },
  subjects: {
    getAll: () => api.get('subjects/'),
    create: (data: any) => api.post('subjects/', data),
    update: (id: number, data: any) => api.put(`subjects/${id}/`, data),
    delete: (id: number) => api.delete(`subjects/${id}/`),
  },
  gradeSystems: {
    getAll: () => api.get('grade-systems/'),
    create: (data: any) => api.post('grade-systems/', data),
    update: (id: number, data: any) => api.put(`grade-systems/${id}/`, data),
    delete: (id: number) => api.delete(`grade-systems/${id}/`),
  },
  gradeBoundaries: {
    getAll: () => api.get('grade-boundaries/'),
    create: (data: any) => api.post('grade-boundaries/', data),
    update: (id: number, data: any) => api.put(`grade-boundaries/${id}/`, data),
    delete: (id: number) => api.delete(`grade-boundaries/${id}/`),
  },
  exams: {
    getAll: () => api.get('exams/'),
    getOne: (id: number) => api.get(`exams/${id}/`),
    create: (data: any) => api.post('exams/', data),
    update: (id: number, data: any) => api.put(`exams/${id}/`, data),
    delete: (id: number) => api.delete(`exams/${id}/`),
  },
  results: {
    getAll: (params?: { student_id?: number; exam_id?: number }) => api.get('student-results/', { params }),
    create: (data: any) => api.post('student-results/', data),
    update: (id: number, data: any) => api.put(`student-results/${id}/`, data),
    delete: (id: number) => api.delete(`student-results/${id}/`),
  },
  attendance: {
    getAll: () => api.get('attendance/'),
    create: (data: any) => api.post('attendance/', data),
    update: (id: number, data: any) => api.put(`attendance/${id}/`, data),
    delete: (id: number) => api.delete(`attendance/${id}/`),
  },
  resources: {
    getAll: () => api.get('learning-resources/'),
    create: (data: any) => api.post('learning-resources/', data),
    update: (id: number, data: any) => api.put(`learning-resources/${id}/`, data),
    delete: (id: number) => api.delete(`learning-resources/${id}/`),
  },
  alerts: {
    getAll: () => api.get('alerts/'),
    create: (data: any) => api.post('alerts/', data),
  },
  events: {
    getAll: () => api.get('school-events/'),
    create: (data: any) => api.post('school-events/', data),
  },
  syllabus: {
    getAll: () => api.get('syllabus-coverage/'),
    create: (data: any) => api.post('syllabus-coverage/', data),
    update: (id: number, data: any) => api.put(`syllabus-coverage/${id}/`, data),
    delete: (id: number) => api.delete(`syllabus-coverage/${id}/`),
  },
  classSubjects: {
    list: (params: any) => api.get('class-subjects/', { params }),
    create: (data: any) => api.post('class-subjects/', data),
    delete: (id: number) => api.delete(`class-subjects/${id}/`),
    sync: (id: number) => api.post(`class-subjects/${id}/sync_students/`),
  },
  studentSubjects: {
    list: (params: any) => api.get('student-subjects/', { params }),
    create: (data: any) => api.post('student-subjects/', data),
    update: (id: number, data: any) => api.put(`student-subjects/${id}/`, data),
    delete: (id: number) => api.delete(`student-subjects/${id}/`),
  },
};

export const classesAPI = academicsAPI.classes;
export const subjectsAPI = academicsAPI.subjects;

export const timetableAPI = {
  getAll: (params?: any) => api.get('timetable/', { params }),
  create: (data: any) => api.post('timetable/', data),
  update: (id: number, data: any) => api.put(`timetable/${id}/`, data),
  delete: (id: number) => api.delete(`timetable/${id}/`),
};

export const financeAPI = {
  feeStructures: {
    getAll: () => api.get('fee-structures/'),
    create: (data: any) => api.post('fee-structures/', data),
    update: (id: number, data: any) => api.put(`fee-structures/${id}/`, data),
    delete: (id: number) => api.delete(`fee-structures/${id}/`),
  },
  invoices: {
    getAll: (params?: any) => api.get('invoices/', { params }),
    getOne: (id: number) => api.get(`invoices/${id}/`),
    generateBatch: (data: { class_id: number, term: number, year_id: number }) => api.post('invoices/generate_batch/', data),
  },
  payments: {
    getAll: () => api.get('payments/'),
    create: (data: any) => api.post('payments/', data),
    getOne: (id: number) => api.get(`payments/${id}/`),
  },
  adjustments: {
    getAll: () => api.get('adjustments/'),
    create: (data: any) => api.post('adjustments/', data),
  },
  expenses: {
    getAll: () => api.get('expenses/'),
    create: (data: any) => api.post('expenses/', data),
    update: (id: number, data: any) => api.put(`expenses/${id}/`, data),
    patch: (id: number, data: any) => api.patch(`expenses/${id}/`, data),
    delete: (id: number) => api.delete(`expenses/${id}/`),
  }
};

export const hostelAPI = {
  hostels: {
    getAll: () => api.get('hostels/'),
    create: (data: any) => api.post('hostels/', data),
    update: (id: number, data: any) => api.put(`hostels/${id}/`, data),
    delete: (id: number) => api.delete(`hostels/${id}/`),
  },
  rooms: {
    getAll: () => api.get('rooms/'),
    create: (data: any) => api.post('rooms/', data),
    update: (id: number, data: any) => api.put(`rooms/${id}/`, data),
    delete: (id: number) => api.delete(`rooms/${id}/`),
  },
  beds: {
    getAll: () => api.get('beds/'),
    create: (data: any) => api.post('beds/', data),
    update: (id: number, data: any) => api.put(`beds/${id}/`, data),
    delete: (id: number) => api.delete(`beds/${id}/`),
  },
  allocations: {
    getAll: () => api.get('hostel-allocations/'),
    create: (data: any) => api.post('hostel-allocations/', data),
    update: (id: number, data: any) => api.put(`hostel-allocations/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-allocations/${id}/`),
    transfer: (id: number, newBedId: number) => api.post(`hostel-allocations/${id}/transfer/`, { new_bed_id: newBedId }),
  },
  attendance: {
    getAll: () => api.get('hostel-attendance/'),
    create: (data: any) => api.post('hostel-attendance/', data),
    update: (id: number, data: any) => api.put(`hostel-attendance/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-attendance/${id}/`),
  },
  discipline: {
    getAll: () => api.get('hostel-discipline/'),
    create: (data: any) => api.post('hostel-discipline/', data),
    update: (id: number, data: any) => api.put(`hostel-discipline/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-discipline/${id}/`),
  },
  assets: {
    getAll: () => api.get('hostel-assets/'),
    create: (data: any) => api.post('hostel-assets/', data),
    update: (id: number, data: any) => api.put(`hostel-assets/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-assets/${id}/`),
  },
  guests: {
    getAll: () => api.get('hostel-guests/'),
    create: (data: any) => api.post('hostel-guests/', data),
    update: (id: number, data: any) => api.put(`hostel-guests/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-guests/${id}/`),
  },
  maintenance: {
    getAll: () => api.get('hostel-maintenance/'),
    create: (data: any) => api.post('hostel-maintenance/', data),
    update: (id: number, data: any) => api.put(`hostel-maintenance/${id}/`, data),
    delete: (id: number) => api.delete(`hostel-maintenance/${id}/`),
  }
};

export const libraryAPI = {
  config: {
    getAll: () => api.get('library-config/'),
    create: (data: any) => api.post('library-config/', data),
  },
  books: {
    getAll: () => api.get('books/'),
    create: (data: any) => api.post('books/', data),
    update: (id: number, data: any) => api.put(`books/${id}/`, data),
    delete: (id: number) => api.delete(`books/${id}/`),
  },
  copies: {
    getAll: () => api.get('book-copies/'),
    create: (data: any) => api.post('book-copies/', data),
    update: (id: number, data: any) => api.put(`book-copies/${id}/`, data),
    delete: (id: number) => api.delete(`book-copies/${id}/`),
  },
  lendings: {
    getAll: () => api.get('book-lendings/'),
    create: (data: any) => api.post('book-lendings/', data),
    update: (id: number, data: any) => api.put(`book-lendings/${id}/`, data),
    delete: (id: number) => api.delete(`book-lendings/${id}/`),
    returnBook: (id: number) => api.post(`book-lendings/${id}/return_book/`),
  },
  fines: {
    getAll: () => api.get('library-fines/'),
    create: (data: any) => api.post('library-fines/', data),
    update: (id: number, data: any) => api.put(`library-fines/${id}/`, data),
    delete: (id: number) => api.delete(`library-fines/${id}/`),
  },
  reservations: {
    getAll: () => api.get('book-reservations/'),
    create: (data: any) => api.post('book-reservations/', data),
  }
};

export const medicalAPI = {
  getAll: () => api.get('medical-records/'),
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
    getAll: () => api.get('vehicles/'),
    create: (data: any) => api.post('vehicles/', data),
    update: (id: number, data: any) => api.put(`vehicles/${id}/`, data),
    delete: (id: number) => api.delete(`vehicles/${id}/`),
    getMaintenance: (id: number) => api.get(`vehicles/${id}/maintenance_history/`),
  },
  drivers: {
    getAll: () => api.get('driver-profiles/'),
    create: (data: any) => api.post('driver-profiles/', data),
    update: (id: number, data: any) => api.put(`driver-profiles/${id}/`, data),
  },
  routes: {
    getAll: () => api.get('routes/'),
    create: (data: any) => api.post('routes/', data),
    update: (id: number, data: any) => api.put(`routes/${id}/`, data),
    delete: (id: number) => api.delete(`routes/${id}/`),
  },
  pickupPoints: {
    getAll: () => api.get('pickup-points/'),
    create: (data: any) => api.post('pickup-points/', data),
    update: (id: number, data: any) => api.put(`pickup-points/${id}/`, data),
    delete: (id: number) => api.delete(`pickup-points/${id}/`),
  },
  allocations: {
    getAll: () => api.get('transport-allocations/'),
    create: (data: any) => api.post('transport-allocations/', data),
    update: (id: number, data: any) => api.put(`transport-allocations/${id}/`, data),
    delete: (id: number) => api.delete(`transport-allocations/${id}/`),
  },
  tripLogs: {
    getAll: () => api.get('trip-logs/'),
    create: (data: any) => api.post('trip-logs/', data),
    update: (id: number, data: any) => api.put(`trip-logs/${id}/`, data),
    delete: (id: number) => api.delete(`trip-logs/${id}/`),
    markAttendance: (tripId: number, studentId: number, isPresent: boolean) =>
      api.post(`trip-logs/${tripId}/mark_attendance/`, { student_id: studentId, is_present: isPresent }),
  },
  maintenance: {
    getAll: () => api.get('vehicle-maintenance/'),
    create: (data: any) => api.post('vehicle-maintenance/', data),
    update: (id: number, data: any) => api.put(`vehicle-maintenance/${id}/`, data),
    delete: (id: number) => api.delete(`vehicle-maintenance/${id}/`),
  },
  fuel: {
    getAll: () => api.get('fuel-records/'),
    create: (data: any) => api.post('fuel-records/', data),
    update: (id: number, data: any) => api.put(`fuel-records/${id}/`, data),
    delete: (id: number) => api.delete(`fuel-records/${id}/`),
  },
  incidents: {
    getAll: () => api.get('transport-incidents/'),
    create: (data: any) => api.post('transport-incidents/', data),
    update: (id: number, data: any) => api.put(`transport-incidents/${id}/`, data),
    delete: (id: number) => api.delete(`transport-incidents/${id}/`),
  }
};

export const auditAPI = {
  health: {
    get: () => api.get('audit/health/'),
  }
};

export default api;
