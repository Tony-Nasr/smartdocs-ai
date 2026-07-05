import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: 'https://smartdocs-ai-nk0p.onrender.com/api', // match your ASP.NET Core launch port
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { refreshToken, email, setTokens, logout } = useAuthStore.getState()
      if (!refreshToken || !email) {
        logout()
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post('https://smartdocs-ai-nk0p.onrender.com/api/auth/refresh', {
          refreshToken,
          email,
        })
        setTokens(data.accessToken, data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        logout()
      }
    }
    return Promise.reject(error)
  }
)
