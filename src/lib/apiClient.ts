import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/crm';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Auto-attach token dari cookie ke setiap request
apiClient.interceptors.request.use((config) => {
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
