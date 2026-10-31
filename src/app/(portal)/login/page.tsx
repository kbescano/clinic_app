'use client'

import React, { useState, useTransition, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthCard, {
  authButtonClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from '../components/AuthCard'
import { startPortalDemo } from '../components/demoActions'

const DEMOS = [
  { clinic: 'skin', label: 'Skin clinic' },
  { clinic: 'dental', label: 'Dental clinic' },
] as const

export default function LoginPage(): React.ReactElement {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [openingDemo, setOpeningDemo] = useState<string | null>(null)
  const [, startDemo] = useTransition()

  // No account needed: sample bookings, view only.
  const openDemo = (clinic: (typeof DEMOS)[number]['clinic']) => {
    setOpeningDemo(clinic)
    startDemo(() => startPortalDemo(clinic))
  }

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

      <div className="space-y-3 border-t border-gray-200 pt-6 dark:border-gray-700">
        <p className="text-center text-sm font-semibold text-gray-900 dark:text-white">Explore the demo</p>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          No account needed. Look around a clinic&apos;s portal with sample bookings; nothing can be changed.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {DEMOS.map((d) => (
            <button
              key={d.clinic}
              type="button"
              onClick={() => openDemo(d.clinic)}
              disabled={openingDemo !== null}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              {openingDemo === d.clinic ? 'Opening…' : d.label}
            </button>
          ))}
        </div>
      </div>
    </AuthCard>
  )
}
