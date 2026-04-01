import { getPayload } from 'payload'
import config from '@/payload.config'
import React from 'react'
import Image from 'next/image'
import { Specialist, Media } from '@/payload-types'
import FadeIn from './FadeIn'

export default async function SpecialistSection() {
  const payload = await getPayload({ config })

  // Fetch from the 'specialists' collection slug
  const specialistsData = await payload.find({
    collection: 'specialists',
  })

  if (specialistsData.docs.length === 0) return null

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  return (
    <section
      id="specialists"
      className="bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-100 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto border-x border-zinc-100 dark:border-zinc-900 bg-white dark:bg-[#050505]">
        <FadeIn>
          {/* HEADER: Standardized Couture Vertical Line */}
          <div className="px-4 md:px-12 pt-24 md:pt-32 bg-white dark:bg-[#050505]">
            <header className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-start gap-4 md:gap-5">
                <div className="w-[1px] bg-zinc-900 dark:bg-white h-12 md:h-16" />
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-zinc-400 font-serif">
                    Clinical Expertise
                  </p>
                  {/* REDUCED HEADER SIZE: From 3xl/5xl to 20px/24px */}
                  <h2 className="text-[20px] md:text-[24px] font-light font-serif text-zinc-900 dark:text-white uppercase leading-none tracking-tight">
                    Meet Our Specialists
                  </h2>
                </div>
              </div>
            </header>
          </div>

          {/* GRID REGISTRY: Consistent 1px Border Pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-2 bg-white dark:bg-black">
            {specialistsData.docs.map((specialist: Specialist) => {
              const imageDoc = specialist.image as Media | undefined
              const rawPath = imageDoc?.url || ''
              const finalImageUrl = rawPath.startsWith('http')
                ? rawPath
                : rawPath
                  ? `${serverUrl}${rawPath}`
                  : ''

              return (
                <div
                  key={specialist.id}
                  className="group flex flex-col h-full bg-white dark:bg-black transition-colors duration-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10"
                >
                  {/* IMAGE WRAPPER */}
                  <div className="relative overflow-hidden w-full h-[500px] md:h-[600px] bg-white dark:bg-black grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000">
                    {finalImageUrl ? (
                      <Image
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        src={finalImageUrl}
                        alt={specialist.name}
                        fill
                        priority={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] uppercase tracking-[0.4em] font-serif text-zinc-400 dark:text-zinc-600 italic bg-zinc-50 dark:bg-zinc-900/10">
                        Image Unavailable
                      </div>
                    )}
                  </div>

                  {/* TEXT CONTENT */}
                  <div className="p-8 md:p-10 flex flex-col flex-grow border-t border-zinc-100 dark:border-zinc-900">
                    <div className="space-y-2">
                      <p className="text-[8px] md:text-[9px] uppercase tracking-[0.4em] font-serif text-zinc-400 dark:text-zinc-500 italic">
                        {specialist.specialization}
                      </p>
                      {/* REDUCED NAME SIZE: From xl/2xl to 14px/15px */}
                      <h3 className="text-[14px] md:text-[15px] font-light font-serif text-zinc-900 dark:text-white leading-tight tracking-tighter uppercase transition-colors group-hover:text-zinc-500">
                        {specialist.name}
                      </h3>
                    </div>

                    {/* Ledger Bottom Accent */}
                    <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-900/50 flex justify-end">
                      <div className="w-12 h-[1px] bg-zinc-100 dark:bg-zinc-800 group-hover:w-full group-hover:bg-zinc-900 dark:group-hover:bg-white transition-all duration-1000" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
