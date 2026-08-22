import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/crm';

const apiClient = axios.create({
  timeout: 15000,
});

// Auto-attach token dari cookie ke setiap request
apiClient.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('http')) {
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
    
    // Jika developer me-passing absolute API path, gunakan origin saja
    if (path.startsWith('/api/v1') || path.startsWith('/api/crm') || path.startsWith('/api/public') || path.startsWith('/api/webhook')) {
      try {
        const urlObj = new URL(base);
        config.url = `${urlObj.origin}${path}`;
      } catch (e) {
        config.url = path; // fallback
      }
    } else {
      // Normal append: (e.g. /dashboard/stats -> http://localhost:3001/api/v1/dashboard/stats)
      config.url = `${base}${path}`;
    }
  }

  const token = Cookies.get('nexa_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect ke login
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('nexa_token');
      Cookies.remove('nexa_user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default apiClient;
