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
      // The API now returns the full user object with permissions
      // We should use that instead of constructing a partial one
      // The API now returns the full user object with permissions
      const user = response.data.user || { username, role: 'GUEST' }

      localStorage.setItem('token', token)
      dispatch(setCredentials({ user, token }))
      success(`Welcome back, ${user.username || username}!`)
      navigate('/')
    } catch (err: any) {
      console.error(err);
      const msg = 'Invalid credentials. Please checking your login details.';
      setError(msg)
      errorToast(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container">
      {/* Ambient Background */}
      <div className="auth-bg-gradient-1"></div>
      <div className="auth-bg-gradient-2"></div>

      {/* Header Text Section */}
      <div className="auth-header-section">
        <div className="flex justify-center mb-4">
          <div style={{
            width: '64px', height: '64px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
          }}>
            <School size={32} color="white" />
          </div>
        </div>
        <h1 className="auth-title">
          Excellence in Education
        </h1>
        <p className="auth-subtitle">
          Streamline operations with our advanced, secure, and user-friendly platform.
        </p>
      </div>

      {/* Main Card */}
      <div className="auth-card">
        <div className="text-center mb-6">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b', marginBottom: '0.25rem' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '0 0.5rem 0.5rem 0', display: 'flex', alignItems: 'center', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700
          }}>
            <span style={{ marginRight: '0.5rem' }}>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrapper">
              <User size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
              <input
                type="text"
                className="auth-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your ID"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="flex justify-between items-center mb-1">
              <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Authenticating...' : <><span style={{ marginRight: '0.5rem' }}>Access Dashboard</span> <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            New Staff / Guardian? <Link to="/register" className="auth-link">Request Account</Link>
          </p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>Secure Institutional Portal v2.0</p>
      </div>
    </div>
  )
}

export default Login
