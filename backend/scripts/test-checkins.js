
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const email = process.env.TEST_EMAIL
const password = process.env.TEST_PASSWORD
const API = 'http://127.0.0.1:8000/api'

let habitId = null

async function main() {
  console.log('\n1. Testing Supabase login...')

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(error.message)

  const token = data.session.access_token

  console.log('LOGIN SUCCESS')

  async function api(path, method = 'GET', body = null) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    const result = await response.json()

    if (!response.ok) {
      console.log('API ERROR:', response.status, result)
    }

    return { status: response.status, result }
  }

  try {
    console.log('\n2. Creating test habit...')

    const habit = await api('/habits/', 'POST', {
      title: 'Automated Streak Test',
      description: 'Temporary testing habit',
      frequency: 'daily',
    })

    if (habit.status !== 201) {
      throw new Error('Habit creation failed')
    }

    habitId = habit.result.id

    console.log('HABIT CREATED:', habitId)

    console.log('\n3. Creating three consecutive check-ins...')

    const dates = [
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]

    for (const date of dates) {
      const checkin = await api('/checkins/', 'POST', {
        habit: habitId,
        completed: true,
        note: 'Automated test',
        date,
      })

      console.log(date, 'STATUS:', checkin.status)

      if (checkin.status !== 201) {
        throw new Error(`Check-in failed for ${date}`)
      }
    }

    console.log('\n4. Testing duplicate check-in...')

    const duplicate = await api('/checkins/', 'POST', {
      habit: habitId,
      completed: true,
      date: '2026-11-22',
    })

    console.log('DUPLICATE STATUS:', duplicate.status)

    if (duplicate.status !== 400) {
      throw new Error('Duplicate check-in protection failed')
    }

    console.log('\n5. Testing Longest Streak...')

    const streak = await api(
      '/checkins/analytics/longest-streak/'
    )

    console.log('STREAK STATUS:', streak.status)
    console.log('STREAK RESULT:', streak.result)

    if (
      streak.status !== 200 ||
      streak.result.longest_streak < 3
    ) {
      throw new Error('Longest streak test failed')
    }

    console.log('\nSUCCESS: ALL CHECK-IN TESTS PASSED!')

  } finally {
    if (habitId !== null) {
      console.log('\n6. Cleaning test habit...')

      const deleted = await api(
        `/habits/${habitId}/`,
        'DELETE'
      )

      console.log('CLEANUP STATUS:', deleted.status)
    }

    await supabase.auth.signOut()
    console.log('Supabase session closed.')
  }
}

main().catch(error => {
  console.error('\nTEST FAILED:', error.message)
  process.exitCode = 1
})