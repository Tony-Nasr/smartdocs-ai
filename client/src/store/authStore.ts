import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  email: string | null
  fullName: string | null
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (email: string, fullName: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      email: null,
      fullName: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (email, fullName) => set({ email, fullName }),
      logout: () => set({ accessToken: null, refreshToken: null, email: null, fullName: null }),
    }),
    { name: 'smartdocs-auth' }
  )
)
