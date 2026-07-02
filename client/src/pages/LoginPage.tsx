import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const url = isRegister ? '/auth/register' : '/auth/login'
      const payload = isRegister ? { fullName, email, password } : { email, password }
      const { data } = await api.post(url, payload)
      setTokens(data.accessToken, data.refreshToken)
      setUser(data.email, data.fullName)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data ?? 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow-md w-96 space-y-4">
        <h1 className="text-2xl font-bold">{isRegister ? 'Create account' : 'Welcome back'}</h1>
        {isRegister && (
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{String(error)}</p>}
        <button className="w-full bg-black text-white rounded-lg py-2 font-medium">
          {isRegister ? 'Register' : 'Login'}
        </button>
        <p className="text-sm text-center">
          <button type="button" className="underline" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </p>
      </form>
    </div>
  )
}
