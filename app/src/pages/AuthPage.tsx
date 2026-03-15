import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Zap, Eye, EyeOff, ArrowRight, ChartBar as BarChart2, Target, TrendingUp } from 'lucide-react'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (mode === 'signup') {
      const { error } = await signUp(email, password, fullName)
      if (error) {
        setError(error.message)
      } else {
        const { error: signInError } = await signIn(email, password)
        if (signInError) {
          setError(signInError.message)
        }
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">
            <Zap size={22} />
          </div>
          <span className="auth-brand-name">MarketingSkills</span>
        </div>

        <div className="auth-hero">
          <h1 className="auth-hero-title">
            AI-powered marketing expertise
          </h1>
          <p className="auth-hero-sub">
            33 specialist skills. 50+ integrations. One platform to accelerate your growth.
          </p>

          <div className="auth-features">
            {[
              { icon: <Target size={16} />, text: 'CRO, SEO, copywriting & more in seconds' },
              { icon: <BarChart2 size={16} />, text: 'Connect your analytics and ad accounts' },
              { icon: <TrendingUp size={16} />, text: 'Actionable output grounded in your product' },
            ].map((f, i) => (
              <div className="auth-feature" key={i}>
                <span className="auth-feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-tagline">Used by technical marketers and founders</div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError('') }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError('') }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  minLength={mode === 'signup' ? 8 : 6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-btn" type="submit" disabled={submitting}>
              {submitting
                ? 'Please wait...'
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
