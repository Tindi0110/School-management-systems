import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ShieldCheck, Mail, ArrowRight, Loader } from 'lucide-react'
import { authAPI } from '../api/api'
import { useToast } from '../context/ToastContext'

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error, info } = useToast()
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Extract email from query string
  const searchParams = new URLSearchParams(location.search)
  const email = searchParams.get('email')

  useEffect(() => {
    if (!email) {
      error('Email address not found. Please log in or register again.')
      navigate('/login')
    }
  }, [email, navigate, error])

  const handleChange = (index: number, value: string) => {
    // Basic validation to only accept numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto submit if all filled
    if (value && index === 5 && newOtp.every(v => v !== '')) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '')
    
    if (pastedData) {
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length; i++) {
        if (i < 6) newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      
      // Focus the next empty input, or the last one if full
      const nextIndex = Math.min(pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()
      
      if (pastedData.length === 6) {
        handleVerify(pastedData)
      }
    }
  }

  const handleVerify = async (code: string) => {
    if (code.length !== 6) {
      error('Please enter the full 6-digit code.')
      return
    }

    setLoading(true)
    try {
      await authAPI.verifyEmailOTP(email!, code)
      success('Email verified successfully! You can now log in.')
      navigate('/login')
    } catch (err: any) {
      error(err.response?.data?.error || 'Invalid verification code. Please try again.')
      // Clear OTP on error so user can re-type
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleVerify(otp.join(''))
  }

  const handleResend = async () => {
    if (!email) return
    
    setResending(true)
    try {
      await authAPI.resendVerificationPublic(email)
      info('A new verification code has been sent to your email.')
      // Clear current OTP
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[2rem] p-10 transform transition-all">
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100/50">
              <ShieldCheck size={32} className="text-primary-accent" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Check your email</h1>
            <p className="text-sm text-gray-500 leading-relaxed px-2">
              We sent a 6-digit verification code to
              <span className="block font-semibold text-gray-800 mt-1 flex items-center justify-center gap-1.5 bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100/50 mx-auto w-max mt-2">
                <Mail size={14} className="text-gray-400" />
                {email || 'your email'}
              </span>
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            <div className="flex justify-center gap-2 w-full" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{1}"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  className="text-center text-xl font-bold text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50 disabled:bg-gray-50"
                  style={{ width: '40px', height: '40px', padding: '0', minWidth: '40px' }}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-accent text-white font-bold text-sm py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3 items-center">
            <p className="text-xs font-medium text-gray-500">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || loading}
              className="text-sm font-bold text-primary hover:text-primary-accent transition-colors disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Click to resend'}
            </button>
            
            <Link to="/login" className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors mt-2">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTP
