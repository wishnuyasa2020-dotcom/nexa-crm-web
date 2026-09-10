import { create } from 'zustand';
import Cookies from 'js-cookie';

export interface User {
  id?: number;
  username: string;
  nama: string;
  role: string;
  email?: string;
  status?: string;
  tenant_id?: string;
  supervisor_id?: number | null;
  supervisor_nama?: string | null;
  selectedPeriod?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
  loadFromCookie: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    set({ token, user, isAuthenticated: true });
    Cookies.set('nexa_token', token, { expires: 1 });
    Cookies.set('nexa_user', JSON.stringify(user), { expires: 1 });
  },

  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...partial };
      Cookies.set('nexa_user', JSON.stringify(updated), { expires: 1 });
      return { user: updated };
    });
  },

  logout: () => {
    set({ token: null, user: null, isAuthenticated: false });
    Cookies.remove('nexa_token');
    Cookies.remove('nexa_user');
  },

  loadFromCookie: () => {
    const token = Cookies.get('nexa_token');
    const userStr = Cookies.get('nexa_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch {
        Cookies.remove('nexa_token');
        Cookies.remove('nexa_user');
      }
    }
  },
}));
