import axios from 'axios';
import Cookies from 'js-cookie';

const DEFAULT_API_BASE =
  process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:3001/api/v1'
    : 'https://nexa-os-pmr8.onrender.com/api/v1';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;

const apiClient = axios.create({
  timeout: 60000, // Diubah menjadi 60 detik agar support upload file besar (video)
});

// Auto-attach token dari cookie ke setiap request
apiClient.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('http')) {
    const rawBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
    
    // Resolusi origin yang aman tanpa melempar TypeError
    let origin = '';
    try {
      if (rawBase.startsWith('http://') || rawBase.startsWith('https://')) {
        const urlObj = new URL(rawBase);
        origin = urlObj.origin;
      } else if (typeof window !== 'undefined') {
        origin = window.location.origin;
      }
    } catch {
      origin = '';
    }

    // Jika developer me-passing absolute API path (/api/v1, /api/crm, /api/public, /api/webhook)
    if (
      path.startsWith('/api/v1') ||
      path.startsWith('/api/crm') ||
      path.startsWith('/api/public') ||
      path.startsWith('/api/webhook')
    ) {
      config.url = origin ? `${origin}${path}` : path;
    } else {
      // Normal append untuk endpoint tanpa prefix: (misal /sekolah -> https://.../api/v1/sekolah)
      config.url = `${rawBase}${path}`;
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
