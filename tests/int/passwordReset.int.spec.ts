// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest'
import type { PayloadRequest } from 'payload'
import { Users } from '@/collections/Users'
import { getPasswordResetHtml } from '@/lib/passwordResetEmail'

const fakeReq = (host: string, url = 'https://ignored.example/api/users/forgot-password') =>
  ({ url, headers: new Headers({ host }) }) as unknown as PayloadRequest

describe('forgot-password hardening', () => {
  const beforeOperation = Users.hooks!.beforeOperation![0] as unknown as (a: {
    args: Record<string, unknown>
    operation: string
  }) => Record<string, unknown>

  it('drops a client-supplied expiration', () => {
    const out = beforeOperation({
      args: { expiration: 999_999_999_999, disableEmail: false },
      operation: 'forgotPassword',
    })
    expect(out.expiration).toBeUndefined()
  })

  it('leaves other operations untouched', () => {
    const args = { expiration: 5 }
    expect(beforeOperation({ args, operation: 'login' })).toBe(args)
  })
})

describe('reset email link', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('pins the link to the configured site URL in production, ignoring the Host header', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://clinic.example.com/')
    const html = getPasswordResetHtml({ req: fakeReq('evil.example'), token: 'abc123' })
    expect(html).toContain('https://clinic.example.com/reset-password?token=abc123')
    expect(html).not.toContain('evil.example')
  })

  it('uses the request host outside production so local testing works', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://clinic.example.com')
    const html = getPasswordResetHtml({
      req: fakeReq('localhost:3000', 'http://localhost:3000/api/users/forgot-password'),
      token: 'abc123',
    })
    expect(html).toContain('http://localhost:3000/reset-password?token=abc123')
  })

  it('encodes the token and escapes the user name', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://clinic.example.com')
    const html = getPasswordResetHtml({ token: 'a b&c', name: '<script>alert(1)</script>' })
    expect(html).toContain('token=a%20b%26c')
    expect(html).not.toContain('<script>')
  })
})
