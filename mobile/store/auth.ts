import { create } from "zustand";
import { saveToken, deleteToken, getToken } from "../lib/storage";

type Patient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
};

type AuthState = {
  token: string | null;
  patient: Patient | null;
  isLoading: boolean;
  setAuth: (token: string, patient: Patient) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  patient: null,
  isLoading: true,

  setAuth: async (token, patient) => {
    await saveToken(token);
    set({ token, patient });
  },

  logout: async () => {
    await deleteToken();
    set({ token: null, patient: null });
  },

  hydrate: async () => {
    const token = await getToken();
    if (token) {
      set({ token, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
