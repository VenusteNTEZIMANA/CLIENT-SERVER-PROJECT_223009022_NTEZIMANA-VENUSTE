
import { supabase } from './supabase'

export interface AuthResult {
  success: boolean
  message: string
  user?: {
    id: string
    email?: string
  }
}

const API_URL = import.meta.env.VITE_API_URL

// ========================================
// SIGN UP
// ========================================

export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  if (!data.user) {
    return {
      success: false,
      message: 'Account creation failed.',
    }
  }

  if (!data.session) {
    return {
      success: true,
      message:
        'Account created! Please check your email and confirm your account before logging in.',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    }
  }

  return verifyWithDjango(
    data.session.access_token
  )
}

// ========================================
// LOGIN
// ========================================

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  if (!data.session) {
    return {
      success: false,
      message: 'Login session was not created.',
    }
  }

  const verification = await verifyWithDjango(
    data.session.access_token
  )

  if (!verification.success) {
    await supabase.auth.signOut()
    return verification
  }

  return {
    success: true,
    message: 'Login successful.',
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  }
}

// ========================================
// VERIFY DJANGO
// ========================================

export async function verifyWithDjango(
  accessToken: string
): Promise<AuthResult> {

  try {
    const response = await fetch(
      `${API_URL}/api/auth/me/`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const result = await response.json()

    if (!response.ok || !result.authenticated) {
      return {
        success: false,
        message:
          result.detail ||
          result.message ||
          'Backend authentication failed.',
      }
    }

    return {
      success: true,
      message: 'Authentication verified.',
      user: result.user,
    }

  } catch {
    return {
      success: false,
      message:
        'Cannot connect to Django. Check your backend server.',
    }
  }
}

// ========================================
// CURRENT USER
// ========================================

export async function getCurrentUser(): Promise<AuthResult> {

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    return {
      success: false,
      message: 'No active session.',
    }
  }

  return verifyWithDjango(session.access_token)
}

// ========================================
// FORGOT PASSWORD
// SEND RESET LINK TO EMAIL
// ========================================

export async function requestPasswordReset(
  email: string
): Promise<AuthResult> {

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      }
    )

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  return {
    success: true,
    message:
      'Password reset link sent! Please check your email.',
  }
}

// ========================================
// UPDATE PASSWORD
// ========================================

export async function updatePassword(
  newPassword: string
): Promise<AuthResult> {

  const { data, error } =
    await supabase.auth.updateUser({
      password: newPassword,
    })

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  return {
    success: true,
    message: 'Password updated successfully!',
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  }
}

// ========================================
// LOGOUT
// ========================================

export async function signOut(): Promise<void> {

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}