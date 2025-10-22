import { create } from "zustand";
import { LoginPayload,LoginResponse } from "../types/authTypes";
import { authServiceImpl } from "../services/authServiceImpl";

type AuthState = {
  user: LoginResponse["user"] | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<boolean>;
  register: (payload: { name: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: LoginResponse["user"]) => void;
}

export const userAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await authServiceImpl.login(payload);
      set({ user: response.user, token: response.token, loading: false });
      localStorage.setItem("token", response.token);
      return true;
    } catch (err: any) {
      set({ error: err.message || "Login failed", loading: false });
      return false;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const response = await authServiceImpl.register(payload);
      set({ user: response.user, token: response.token, loading: false });
      localStorage.setItem("token", response.token);
      return true;
    } catch (err: any) {
      set({ error: err.message || "Registration failed", loading: false });
      return false;
    }
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem("token");
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ token: null, user: null });
      return;
    }
    
    set({ token, loading: true });
    try {
      const user = await authServiceImpl.me(token);
      set({ user, loading: false });
    } catch (err) {
      // Token inválido/expirado
      localStorage.removeItem("token");
      set({ token: null, user: null, loading: false });
    }
  },

  setUser: (user) => {
    set({ user });
  },
}));