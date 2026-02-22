import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { setCredentials } from '../store/authSlice'
import { authAPI } from '../api/api'
import { useToast } from '../context/ToastContext'
import { Lock, User, ArrowRight, School } from 'lucide-react'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { success, error: errorToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authAPI.login({ username, password })
      const token = response.data.token
      const user = response.data.user || { username, role: 'GUEST' }

      localStorage.setItem('token', token)
      dispatch(setCredentials({ user, token }))
      success(`Welcome back, ${user.username || username}!`)
      navigate('/')
    } catch (err: any) {
      console.error(err);
      const msg = 'Invalid credentials. Please check your login details.';
      setError(msg)
      errorToast(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-gradient-bg auth-gradient-1"></div>
      <div className="auth-gradient-bg auth-gradient-2"></div>

      <div className="auth-card form-container-sm">
        <div className="auth-header">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
              <School size={32} />
            </div>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        <div className="auth-content">
          {error && (
            <div className="badge badge-error w-full py-3 mb-6 flex items-center justify-center gap-2 rounded-lg font-black uppercase text-[10px]">
              <Lock size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="auth-input-group">
              <label className="label uppercase text-[10px] font-black mb-1">Username / Staff ID</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  className="input auth-input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your ID"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="flex justify-between items-center mb-1">
                <label className="label uppercase text-[10px] font-black">Password</label>
                <Link to="/forgot-password" title="Recover Password" className="text-[10px] font-black text-primary uppercase hover:underline">Forgot?</Link>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type="password"
                  className="input auth-input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 h-auto font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
              {loading ? 'Authenticating...' : <><span className="mr-2">Access Dashboard</span> <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        <div className="auth-footer text-xs font-bold text-secondary">
          New Staff? <Link to="/register" className="text-primary hover:underline ml-1">Request Account</Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-center w-full z-10 pointer-events-none">
        <p className="text-[10px] text-secondary font-bold uppercase tracking-[0.2em] opacity-40">Secure Institutional Portal v2.0</p>
      </div>
    </div>
  )
}


export default Login
