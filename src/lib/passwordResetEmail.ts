import type { PayloadRequest } from 'payload'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/**
 * Where the reset link points. In production it is pinned to the configured site URL, because the
 * Host header is client-supplied and would otherwise let anyone aim a victim's reset link at a
 * domain they control. Outside production the request's own host is used so local testing works.
 */
function portalBaseUrl(req?: PayloadRequest): string {
  const configured = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '')
  if (configured && process.env.NODE_ENV === 'production') return configured

  const host = req?.headers.get('host')
  if (host) {
    const protocol = req?.url ? new URL(req.url).protocol : 'http:'
    return `${protocol}//${host}`
  }
  return configured ?? ''
}

export function getPasswordResetSubject(): string {
  return 'Reset your clinic portal password'
}

export function getPasswordResetHtml({
  req,
  token,
  name,
}: {
  req?: PayloadRequest
  token?: string
  name?: string | null
}): string {
  const url = `${portalBaseUrl(req)}/reset-password?token=${encodeURIComponent(token ?? '')}`
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,'

  return `
  <div style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #18181b;">
    <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #71717a; margin: 0 0 24px;">Staff portal</p>
    <h1 style="font-size: 28px; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 16px;">Reset your password</h1>
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 8px;">${greeting}</p>
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 28px;">We received a request to reset your password. This link expires in 1 hour.</p>
    <a href="${url}" style="display: inline-block; background: #18181b; color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; padding: 16px 28px;">Choose a new password</a>
    <p style="font-size: 13px; line-height: 1.6; color: #71717a; margin: 32px 0 0;">If the button does not work, paste this link into your browser:<br><span style="word-break: break-all;">${url}</span></p>
    <p style="font-size: 13px; line-height: 1.6; color: #71717a; margin: 16px 0 0;">If you did not request this, you can ignore this email. Your password will not change.</p>
  </div>`
}
