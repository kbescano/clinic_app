'use client'

import React, { useState, FormEvent } from 'react'
import AuthCard, { authButtonClass, authInputClass, authLabelClass } from '../components/AuthCard'

export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setStatus('sending')

    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`If an account exists for ${email.trim()}, we've sent a link to reset its password. It expires in 1 hour.`}
        backHref="/login"
        backLabel="← Back to sign in"
      >
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Nothing arrived? Check your spam folder, or ask another admin to reset it for you.
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your account email and we'll send you a reset link"
      backHref="/login"
      backLabel="← Back to sign in"
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className={authLabelClass}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="admin@test.com"
          />
        </div>

        {status === 'error' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            We couldn&apos;t send the email. Try again in a moment.
          </p>
        )}

        <button type="submit" disabled={status === 'sending'} className={authButtonClass}>
          {status === 'sending' ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>
  )
}
