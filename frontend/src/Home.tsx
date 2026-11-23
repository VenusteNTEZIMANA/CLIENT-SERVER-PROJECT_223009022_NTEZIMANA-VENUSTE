
import { useState, type FormEvent } from 'react'
import { signIn, signUp } from './lib/auth'
import './Home.css'

type AuthMode = 'login' | 'register'

function SocialIcon({ name }: { name: string }) {
  const common = {
    width: 23,
    height: 23,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.885v2.266h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
        </svg>
      )

    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="18" cy="6.5" r="1.2" />
        </svg>
      )

    case 'google':
      return (
        <svg {...common}>
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.06v2.6A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.41 13.9a6 6 0 0 1 0-3.8V7.5H3.06a10 10 0 0 0 0 9l3.35-2.6Z" />
          <path fill="#EA4335" d="M12 5.97c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.94 5.5l3.35 2.6c.79-2.37 2.99-4.13 5.59-4.13Z" />
        </svg>
      )

    case 'x':
      return (
        <svg {...common}>
          <path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.41L5.57 22H2.43l7.25-8.29L1.8 2h6.4l4.43 6.77L18.9 2Zm-1.1 18h1.73L7.27 3.88H5.42L17.8 20Z" />
        </svg>
      )

    default:
      return null
  }
}

function Home() {
  const [showLogin, setShowLogin] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isError, setIsError] = useState(false)

  const openModal = (selectedMode: AuthMode) => {
    setMode(selectedMode)
    setEmail('')
    setPassword('')
    setFeedback('')
    setIsError(false)
    setShowLogin(true)
  }

  const closeModal = () => {
    if (loading) return
    setShowLogin(false)
    setFeedback('')
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setLoading(true)
    setFeedback('')
    setIsError(false)

    try {
      const result =
        mode === 'login'
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password)

      if (!result.success) {
        setIsError(true)
        setFeedback(result.message)
        return
      }

      setFeedback(result.message)

      if (mode === 'register') {
        setPassword('')
      }
    } catch (error) {
      setIsError(true)
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="home-page">
      <nav className="home-nav">
        <a href="/" className="home-logo">
          <span className="home-logo-icon">✓</span>
          Habit<span>Tracker</span>
        </a>

        <button
          className="home-nav-button"
          onClick={() => openModal('login')}
        >
          Login
        </button>
      </nav>

      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">
            YOUR JOURNEY STARTS HERE
          </span>

          <h1>
            Build better habits.
            <br />
            <span>Become your best self.</span>
          </h1>

          <p>
            Small daily actions create remarkable results.
            Track your habits, celebrate your progress,
            and become the person you want to be.
          </p>

          <div className="home-actions">
            <button
              className="home-primary-button"
              onClick={() => openModal('register')}
            >
              Get Started →
            </button>

            <button
              className="home-secondary-button"
              onClick={() => openModal('login')}
            >
              I already have an account
            </button>
          </div>

          <div className="home-benefits">
            <span>✓ Track your habits</span>
            <span>✓ Monitor your progress</span>
            <span>✓ Build consistency</span>
          </div>
        </div>

        <div className="home-visual">
          <div className="home-visual-card">
            <div className="visual-top">
              <div>
                <span>YOUR DAILY ROUTINE</span>
                <h3>Today's Progress</h3>
              </div>
              <span className="visual-check">✓</span>
            </div>

            <div className="visual-progress">
              <div className="visual-progress-circle">
                <strong>75%</strong>
                <span>Complete</span>
              </div>
            </div>

            <div className="visual-habit">
              <span className="visual-icon purple">✦</span>
              <div>
                <strong>Morning Meditation</strong>
                <small>Mindfulness</small>
              </div>
              <span className="visual-done">✓</span>
            </div>

            <div className="visual-habit">
              <span className="visual-icon blue">▤</span>
              <div>
                <strong>Read 20 Pages</strong>
                <small>Personal Growth</small>
              </div>
              <span className="visual-done">✓</span>
            </div>

            <div className="visual-habit">
              <span className="visual-icon orange">◉</span>
              <div>
                <strong>Drink Water</strong>
                <small>Health</small>
              </div>
              <span className="visual-pending">○</span>
            </div>

            <div className="visual-motivation">
              🔥 Keep going! Every small step counts.
            </div>
          </div>
        </div>
      </section>

    

  {/* PROFESSIONAL THREE-COLUMN FOOTER */}
      <footer className="home-footer">
        <div className="footer-grid">

          {/* LEFT */}
          <div className="footer-section">
            <a href="/" className="home-logo">
              <span className="home-logo-icon">✓</span>
              Habit<span>Tracker</span>
            </a>

            <p>
              Build better habits, stay consistent
              and achieve your goals.
            </p>
          </div>

          {/* MIDDLE */}
          <div className="footer-section">
            <h4>Follow Us</h4>

            <div className="footer-socials">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="social-link facebook"
              >
                <SocialIcon name="facebook" />
              </a>

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="social-link instagram"
              >
                <SocialIcon name="instagram" />
              </a>

              <a
                href="https://www.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Google"
                className="social-link google"
              >
                <SocialIcon name="google" />
              </a>

              <a
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="social-link x-social"
              >
                <SocialIcon name="x" />
              </a>
            </div>
          </div>

          {/* RIGHT */}
          <div className="footer-section">
            <h4>Contact Support</h4>

            <p>
              WhatsApp:{' '}
              <a href="https://wa.me/250798506155">
                0798506155
              </a>
            </p>

            <p>
              Call:{' '}
              <a href="tel:+250737027451">
                0737027451
              </a>
            </p>
          </div>

        </div>

        <div className="footer-bottom">
          <p>
            NTEZIMANA VENUSTE | REG: 223009022
          </p>

          <p>
            © {new Date().getFullYear()} HabitTracker.
            All rights reserved.
          </p>
        </div>
      </footer>

      {/* LOGIN / REGISTER MODAL */}
      {showLogin && (
        <div
          className="login-modal"
          onClick={closeModal}
        >
          <div
            className="login-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="login-close"
              onClick={closeModal}
              disabled={loading}
              aria-label="Close"
            >
              ×
            </button>

            <div className="login-heading-icon">✓</div>

            <span className="home-eyebrow">
              WELCOME TO HABITTRACKER
            </span>

            <h2>
              {mode === 'login'
                ? 'Welcome Back'
                : 'Create Account'}
            </h2>

            <p className="login-description">
              {mode === 'login'
                ? 'Sign in and continue building better habits.'
                : 'Start your journey towards a better you.'}
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="auth-email">Email Address</label>

              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
              />

              <label htmlFor="auth-password">Password</label>

              <input
                id="auth-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete={
                  mode === 'login'
                    ? 'current-password'
                    : 'new-password'
                }
                minLength={6}
                required
              />

              {feedback && (
                <div
                  className={
                    isError
                      ? 'auth-feedback error'
                      : 'auth-feedback success'
                  }
                  role="status"
                >
                  {feedback}
                </div>
              )}

              <button
                type="submit"
                className="home-primary-button login-submit"
                disabled={loading}
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Login to Account'
                    : 'Create My Account'}
              </button>
            </form>

            <div className="login-switch">
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode(
                    mode === 'login' ? 'register' : 'login'
                  )
                  setFeedback('')
                  setPassword('')
                }}
              >
                {mode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Home