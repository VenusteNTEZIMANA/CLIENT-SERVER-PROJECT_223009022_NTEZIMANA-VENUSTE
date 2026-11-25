
import {
  useState,
  useEffect,
  type FormEvent,
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  updatePassword,
  signOut,
} from '../lib/auth'

import { supabase } from '../lib/supabase'

import './ResetPassword.css'

function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)

  const [feedback, setFeedback] = useState('')
  const [isError, setIsError] = useState(false)

  // ========================================
  // VERIFY PASSWORD RECOVERY SESSION
  // ========================================

  useEffect(() => {
    let mounted = true
    let recoveryDetected = false

    const hashParams = new URLSearchParams(
      window.location.hash.substring(1)
    )

    const isRecoveryLink =
      hashParams.get('type') === 'recovery'

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return

        if (
          event === 'PASSWORD_RECOVERY' &&
          session
        ) {
          recoveryDetected = true
          setSessionValid(true)
          setFeedback('')
          setIsError(false)
          setCheckingSession(false)
        }

        if (event === 'SIGNED_OUT') {
          setSessionValid(false)
        }
      }
    )

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (
          !error &&
          session &&
          (isRecoveryLink || recoveryDetected)
        ) {
          setSessionValid(true)
          setFeedback('')
          setIsError(false)
        } else {
          setSessionValid(false)
          setIsError(true)

          setFeedback(
            'Your reset link is invalid or expired. Please request a new password reset link.'
          )
        }
      } catch (error) {
        console.error('Recovery verification error:', error)

        if (!mounted) return

        setSessionValid(false)
        setIsError(true)

        setFeedback(
          'Unable to verify your reset link. Please request a new link.'
        )
      } finally {
        if (mounted) {
          setCheckingSession(false)
        }
      }
    }

    void checkSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ========================================
  // UPDATE PASSWORD
  // ========================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setFeedback('')
    setIsError(false)

    if (!sessionValid) {
      setIsError(true)
      setFeedback(
        'Your reset session has expired. Request a new link.'
      )
      return
    }

    if (password.length < 8) {
      setIsError(true)
      setFeedback(
        'Password must contain at least 8 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setIsError(true)
      setFeedback('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(password)

      if (!result.success) {
        setIsError(true)
        setFeedback(result.message)
        return
      }

      setFeedback(
        'Password updated successfully!'
      )

      setIsError(false)

      await signOut()

      navigate('/', {
        replace: true,
        state: { openLogin: true },
      })

    } catch (error) {
      console.error('Password reset error:', error)

      setIsError(true)
      setFeedback(
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // LOADING
  // ========================================

  if (checkingSession) {
    return (
      <main className="reset-page">
        <div className="reset-modal">
          <h2>Verifying Reset Link...</h2>

          <p className="reset-description">
            Please wait while we verify your password reset link.
          </p>
        </div>
      </main>
    )
  }

  // ========================================
  // RESET PASSWORD PAGE
  // ========================================

  return (
    <main className="reset-page">
      <div className="reset-modal">

        <button
          className="reset-close"
          onClick={() => navigate('/')}
          aria-label="Close"
          disabled={loading}
        >
          ×
        </button>

        <div className="reset-icon">
          ✓
        </div>

        <span className="reset-eyebrow">
          HABITTRACKER SECURITY
        </span>

        <h2>Reset Your Password</h2>

        <p className="reset-description">
          Create a new secure password for your
          HabitTracker account.
        </p>

        {sessionValid ? (
          <form onSubmit={handleSubmit}>

            <label htmlFor="new-password">
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
              disabled={loading}
            />

            <label htmlFor="confirm-password">
              Confirm Password
            </label>

            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              autoComplete="new-password"
              minLength={8}
              required
              disabled={loading}
            />

            {feedback && (
              <div
                className={
                  isError
                    ? 'reset-feedback error'
                    : 'reset-feedback success'
                }
                role="alert"
              >
                {feedback}
              </div>
            )}

            <button
              type="submit"
              className="reset-submit"
              disabled={loading}
            >
              {loading
                ? 'Updating Password...'
                : 'Reset Password'}
            </button>

          </form>
        ) : (
          <>
            <div
              className="reset-feedback error"
              role="alert"
            >
              {feedback}
            </div>

            <button
              className="reset-submit"
              onClick={() => navigate('/')}
            >
              Back to Login
            </button>
          </>
        )}

      </div>
    </main>
  )
}

export default ResetPassword