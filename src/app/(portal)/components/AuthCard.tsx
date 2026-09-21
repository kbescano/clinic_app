import React from 'react'
import Link from 'next/link'

export const authLabelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300'
export const authInputClass =
  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
export const authButtonClass =
  'w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed'
export const authLinkClass =
  'text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors'

/** The centred card the portal's signed-out pages (login, forgot/reset password) share. */
export default function AuthCard({
  title,
  subtitle,
  children,
  backHref = '/',
  backLabel = '← Back to homepage',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>

        {children}

        <div className="text-center pt-4">
          <Link href={backHref} className={authLinkClass}>
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
