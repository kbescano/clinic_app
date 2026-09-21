'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthCard, {
  authButtonClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from '../components/AuthCard'

const MIN_LENGTH = 8

export default function ResetPasswordForm({ token }: { token: string }): React.ReactElement {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <AuthCard
        title="Link not valid"
        subtitle="This reset link is missing its token."
        backHref="/login"
        backLabel="← Back to sign in"
      >
        <div className="text-center">
          <Link href="/forgot-password" className={authLinkClass}>
            Request a new link
          </Link>
        </div>
      </AuthCard>
    )
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (res.ok) {
        // Payload signs the user in on a successful reset (sets the session cookie).
        router.push('/dashboard')
        router.refresh()
        return
      }
      setError('This reset link is invalid or has expired.')
    } catch {
      setError('Something went wrong. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle={`At least ${MIN_LENGTH} characters`}
      backHref="/login"
      backLabel="← Back to sign in"
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className={authLabelClass}>
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={MIN_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm" className={authLabelClass}>
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
              className={authInputClass}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}{' '}
            {error.includes('expired') && (
              <Link href="/forgot-password" className={authLinkClass}>
                Request a new link
              </Link>
            )}
          </p>
        )}

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? 'Saving...' : 'Reset password'}
        </button>
      </form>
    </AuthCard>
  )
}
