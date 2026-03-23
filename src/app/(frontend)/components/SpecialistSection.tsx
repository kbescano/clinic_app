import { getPayload } from 'payload'
import config from '@/payload.config'
import React from 'react'
import Image from 'next/image'
import { Specialist, Media } from '@/payload-types'
import FadeIn from './FadeIn'

export default async function SpecialistSection() {
  const payload = await getPayload({ config })

  // Fetch from the new 'specialists' collection slug
  const specialistsData = await payload.find({
    collection: 'specialists',
  })

  if (specialistsData.docs.length === 0) return null

  // Get the server URL from environment variables for local path fallback
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  return (
    <section className="bg-white dark:bg-black pt-8 pb-8 lg:pb-10 overflow-x-hidden">
      <FadeIn>
        <div className="max-w-7xl mx-auto px-6">
          {/* Header Section */}
          <div className="mb-8 space-y-3">
            <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-500 dark:text-white font-medium">
              Expertise
            </p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tighter uppercase font-serif text-black dark:text-white">
              Meet Our <span className="">Specialists</span>
            </h2>
          </div>

          {/* Grid Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-10">
            {specialistsData.docs.map((specialist: Specialist) => {
              // 1. Cast the image field to the Media type
              const imageDoc = specialist.image as Media | undefined

              // 2. Get the raw URL from the database
              const rawPath = imageDoc?.url || ''

              // 3. Determine the final URL
              // If it starts with http (Cloudinary), use it directly.
              // If it's a relative path (/api/media/...), attach the server URL.
              const finalImageUrl = rawPath.startsWith('http')
                ? rawPath
                : rawPath
                  ? `${serverUrl}${rawPath}`
                  : ''

              return (
                <div key={specialist.id} className="flex flex-col group">
                  {/* IMAGE WRAPPER */}
                  <div className="relative -mx-6 sm:mx-0 overflow-hidden border-y sm:border border-zinc-100 dark:border-zinc-800 aspect-[4/5] transition-all duration-500">
                    {finalImageUrl ? (
                      <Image
                        className="object-cover transition-all duration-700 group-hover:scale-105"
                        src={finalImageUrl}
                        alt={specialist.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        priority={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-[8px] uppercase tracking-widest text-zinc-400">
                        No Image Found
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="pt-8 text-left">
                    <h3 className="text-[13px] font-medium uppercase tracking-[0.15em] text-black dark:text-white">
                      {specialist.name}
                    </h3>
                    <p className="text-zinc-400 font-bold text-[8px] uppercase tracking-[0.3em] ">
                      {specialist.specialization}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
