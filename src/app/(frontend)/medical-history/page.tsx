import { getPayload } from 'payload'
import config from '@/payload.config'
// import { headers as getHeaders } from 'next/headers'
// import { redirect } from 'next/navigation'
import React from 'react'
import MedicalHistoryClient from './MedicalHistoryClient'

// src/app/(frontend)/medical-history/page.tsx

export default async function MedicalHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }> // 1. Update Type to Promise
}) {
  const payload = await getPayload({ config })

  // 2. Await the params before using them
  const params = await searchParams

  // 3. Use the awaited object
  const currentPage = Number(params.page) || 1
  const search = params.search || ''
  const limit = 10

  const data = await payload.find({
    collection: 'appointments',
    where: {
      and: [
        { status: { in: ['confirmed', 'completed'] } },
        search
          ? {
              or: [
                { firstName: { contains: search } },
                { surname: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {},
      ],
    },
    sort: '-appointmentDate',
    page: currentPage,
    limit: limit,
    depth: 1,
  })

  return (
    <MedicalHistoryClient
      initialData={data.docs}
      totalPages={data.totalPages || 1}
      currentPage={data.page || 1}
    />
  )
}
