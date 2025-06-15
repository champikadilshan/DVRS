// src/store/repositoryStore.js
import { create } from 'zustand';

const useRepositoryStore = create((set) => ({
  repositories: [],
  loading: false,
  error: null,

  setRepositories: (repositories) => set({ repositories }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  clearRepositories: () =>
    set({
      repositories: [],
      loading: false,
      error: null,
    }),
}));

export default useRepositoryStore;
