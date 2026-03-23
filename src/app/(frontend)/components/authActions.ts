'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  const cookieStore = await cookies()
  // Payload default auth cookie is usually 'payload-token'
  cookieStore.delete('payload-token')
  redirect('/')
}
