// src/app/medical-history/page.tsx (or wherever this lives)
import { getPayload } from 'payload'
import config from '@/payload.config'
import React, { Suspense } from 'react'
import MedicalHistoryClient from './MedicalHistoryClient'
import { RegistrySkeleton } from '../components/RegistrySkeleton'

export default async function MedicalHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const payload = await getPayload({ config })
  const params = await searchParams

  const currentPage = Number(params.page) || 1
  const search = params.search || ''

  // FETCH ALL DATA: No pagination, no limits.
  const data = await payload.find({
    collection: 'appointments',
    pagination: false,
    where: search
      ? {
          or: [
            { firstName: { contains: search } },
            { surname: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {},
    sort: '-appointmentDate',
    depth: 1,
  })

  return (
    <Suspense fallback={<RegistrySkeleton />}>
      <MedicalHistoryClient
        initialData={data.docs}
        currentPage={currentPage} // Pass the page from the URL
      />
    </Suspense>
  )
}
