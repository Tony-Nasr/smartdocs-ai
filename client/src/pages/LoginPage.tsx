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
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = isRegister ? '/auth/register' : '/auth/login'
      const payload = isRegister ? { fullName, email, password } : { email, password }
      const { data } = await api.post(url, payload)
      setTokens(data.accessToken, data.refreshToken)
      setUser(data.email, data.fullName)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data ?? 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-bold">S</span>
          </div>
          <span className="text-white font-semibold text-lg">SmartDocs AI</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-white text-xl font-bold mb-1">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-white/40 text-sm mb-6">
            {isRegister ? 'Start managing documents with AI' : 'Sign in to your workspace'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-white/60 text-xs mb-1.5 block">Full name</label>
                <input
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
                  placeholder="Tony Nasr"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Email</label>
              <input
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block">Password</label>
              <input
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">
                {String(error)}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black rounded-lg py-2.5 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-white/40 text-xs mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsRegister(!isRegister)} className="text-white underline">
              {isRegister ? 'Sign in' : 'Register'}
            </button>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          <a href="/" className="hover:text-white/40 transition">← Back to home</a>
        </p>
      </div>
    </div>
  )
}