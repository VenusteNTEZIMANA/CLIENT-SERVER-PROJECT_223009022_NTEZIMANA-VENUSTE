
import { createClient } from '@supabase/supabase-js'

// ======================================
// ENVIRONMENT VARIABLES
// ======================================

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.trim()

const email = process.env.TEST_EMAIL?.trim()
const password = process.env.TEST_PASSWORD

const API_URL = (
  process.env.VITE_API_URL || 'http://127.0.0.1:8000'
).trim()

// ======================================
// VALIDATE ENVIRONMENT
// ======================================

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase configuration.')
  process.exit(1)
}

if (!email || !password) {
  console.error('ERROR: Missing TEST_EMAIL or TEST_PASSWORD.')
  process.exit(1)
}

if (!supabaseUrl.startsWith('https://')) {
  console.error('ERROR: Invalid Supabase URL.')
  process.exit(1)
}

// ======================================
// CREATE SUPABASE CLIENT
// ======================================

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// ======================================
// LOGIN
// ======================================

console.log('\n1. Testing Supabase login...')

const { data, error } =
  await supabase.auth.signInWithPassword({
    email,
    password,
  })

if (error) {
  console.error('LOGIN ERROR:', error.message)
  process.exit(1)
}

if (!data.session) {
  console.error('ERROR: No session created.')
  process.exit(1)
}

console.log('LOGIN SUCCESS')
console.log('USER ID:', data.user.id)

// ======================================
// DJANGO AUTHENTICATION
// ======================================

try {
  console.log('\n2. Testing Django authentication...')

  const authResponse = await fetch(
    `${API_URL}/api/auth/me/`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    }
  )

  const authResult = await authResponse.json()

  console.log('AUTH STATUS:', authResponse.status)
  console.log('AUTH RESULT:', authResult)

  if (!authResponse.ok) {
    console.error('DJANGO AUTHENTICATION FAILED')
    process.exitCode = 1
  } else {
    console.log('\nDJANGO AUTHENTICATION SUCCESS')

    // ======================================
    // LONGEST STREAK ANALYTICS
    // ======================================

    console.log('\n3. Testing Longest Streak API...')

    const response = await fetch(
      `${API_URL}/api/checkins/analytics/longest-streak/`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const result = await response.json()

    console.log('ANALYTICS STATUS:', response.status)
    console.log('ANALYTICS RESULT:', result)

    if (response.ok) {
      console.log('\nSUCCESS: Longest Streak API is working.')
    } else {
      console.error('\nERROR: Analytics API failed.')
      process.exitCode = 1
    }
  }
} catch (error) {
  console.error('CONNECTION ERROR:', error.message)
  process.exitCode = 1
} finally {
  // ======================================
  // LOGOUT
  // ======================================

  await supabase.auth.signOut()
  console.log('\nSupabase session closed.')
}