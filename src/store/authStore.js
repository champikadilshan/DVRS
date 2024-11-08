// src/store/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  awsCredentials: null,
  user: null,

  setCredentials: (credentials) =>
    set({
      awsCredentials: credentials,
      isAuthenticated: true,
    }),

  clearCredentials: () =>
    set({
      awsCredentials: null,
      isAuthenticated: false,
      user: null,
    }),

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
