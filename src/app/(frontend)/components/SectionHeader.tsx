import React from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { HeaderConfig } from '@/payload-types'
import FadeIn from './FadeIn'

export default async function SectionHeader() {
  const payload = await getPayload({ config })

  const headerData = (await payload.findGlobal({
    slug: 'header-config',
  })) as HeaderConfig

  return (
    <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 space-y-4 overflow-x-hidden bg-white dark:bg-black">
      <FadeIn>
        {/* Top Label: Increased tracking and reduced opacity for a "luxury" secondary look */}
        <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-400 font-medium dark:text-zinc-500 mb-2">
          {headerData.topLabel}
        </p>

        {/* Clinic Name: Switched to font-light with serif for a sophisticated, clinical feel */}
        <h2 className="text-2xl md:text-3xl uppercase tracking-[0.1em] font-serif font-light text-zinc-900 dark:text-zinc-100 leading-tight">
          {headerData.clinicName}
        </h2>

        <div className="mt-6 h-[1px] w-12 bg-zinc-800 dark:bg-zinc-200 opacity-20" />
      </FadeIn>
    </div>
  )
}
