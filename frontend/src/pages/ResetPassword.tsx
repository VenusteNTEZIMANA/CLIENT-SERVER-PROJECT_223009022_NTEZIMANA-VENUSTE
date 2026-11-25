
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  updatePassword,
  signOut,
} from '../lib/auth'
import './ResetPassword.css'

function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isError, setIsError] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setFeedback('')
    setIsError(false)

    if (password.length < 8) {
      setIsError(true)
      setFeedback('Password must contain at least 8 characters.')
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

      // Sign out so the user can log in
      // using the new password.
      await signOut()

      navigate('/', {
        replace: true,
        state: { openLogin: true },
      })
    } catch {
      setIsError(true)
      setFeedback(
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

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

        <div className="reset-icon">✓</div>

        <span className="reset-eyebrow">
          HABITTRACKER SECURITY
        </span>

        <h2>Reset Your Password</h2>

        <p className="reset-description">
          Create a new secure password for your
          HabitTracker account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="new-password">
            New Password
          </label>

          <input
            id="new-password"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
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

        <button
          className="reset-back"
          onClick={() => navigate('/')}
          disabled={loading}
        >
          Back to Login
        </button>
      </div>
    </main>
  )
}

export default ResetPassword