import React from 'react'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata = {
  title: 'Reset password',
  // The token is in the URL: keep it out of Referer headers.
  referrer: 'no-referrer' as const,
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { token } = await searchParams
  return <ResetPasswordForm token={typeof token === 'string' ? token : ''} />
}
