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

export default function LoginPage(): React.ReactElement {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (res.ok) {
        // This sets the browser cookie automatically
        router.push('/dashboard')
      } else {
        alert('Invalid credentials. Only admins can enter.')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Clinic Login" subtitle="Enter your credentials to access the staff portal">
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className={authLabelClass}>
                Password
              </label>
              <Link href="/forgot-password" className={authLinkClass}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className={authInputClass}
              placeholder="••••••••"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? 'Processing...' : 'Sign in to Dashboard'}
        </button>
      </form>
    </AuthCard>
  )
}
