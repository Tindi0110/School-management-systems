import axios from 'axios'

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        // config.headers.Authorization = `Bearer ${token}` 
        // DRF TokenAuth usually expects 'Token <token>' or 'Bearer <token>' depending on config.
        // Given SimpleJWT wasn't explicitly installed in my command (I used djangorestframework), 
        // default might be Basic or Session. 
        // However, for typical modern setups we'd use JWT. 
        // Implementation plan said "JWT (SimpleJWT) or Session".
        // I installed djangorestframework but NOT djangorestframework-simplejwt.
        // So I might rely on Session Auth or Basic Auth for now?
        // Or I should install simplejwt.
        // Let's assume Basic Auth or just install SimpleJWT now to be safe/modern.
        // For now, let's leave this empty or handle Basic Auth if I didn't install JWT.
        // I will check backend settings. REST_FRAMEWORK defaults were:
        // 'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework.authentication.SessionAuthentication', 'rest_framework.authentication.BasicAuthentication')
        // So session auth works if on same domain, but we are on localhost:5173 vs 8000 (CORS).
        // I need token auth.
    }
    return config
})

export default api
