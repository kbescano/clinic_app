'use client'

import Image from 'next/image'
import type { Media, Specialist } from '@/payload-types'
import { ClipReveal, Parallax, Reveal, SplitReveal } from '@/components/shared/motion'

const RULE = 'border-zinc-950 dark:border-zinc-700'

function SpecialistCard({ specialist }: { specialist: Specialist }) {
  // Media URLs are relative (/api/media/file/...) and must resolve against whichever host is
  // serving the page; prefixing NEXT_PUBLIC_SERVER_URL breaks them whenever that host changes.
  const imageUrl = (specialist.image as Media | undefined)?.url || ''

  return (
    <article
      className={`group flex h-full flex-col border-b border-r bg-white last:border-r-0 dark:bg-[#050505] md:[&:nth-child(2n)]:border-r-0 ${RULE}`}
    >
      <div className="relative h-[520px] w-full overflow-hidden bg-zinc-100 dark:bg-black md:h-[720px]">
        {imageUrl ? (
          <ClipReveal className="absolute inset-0">
            <Parallax className="h-full">
              <Image
                src={imageUrl}
                alt={specialist.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-[filter] duration-700 md:grayscale md:group-hover:grayscale-0"
              />
            </Parallax>
          </ClipReveal>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
            Photo coming soon
          </div>
        )}
      </div>

      <div className="flex flex-grow flex-col justify-center gap-8 p-8 md:p-12">
        <div className="space-y-3">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{specialist.specialization}</p>
          </Reveal>
          <SplitReveal
            as="h3"
            text={specialist.name}
            className="block text-3xl font-extrabold leading-[1.02] tracking-tighter text-zinc-950 dark:text-white md:text-4xl"
          />
        </div>
        <div className="h-1 w-12 bg-zinc-950 transition-all duration-700 ease-out group-hover:w-full dark:bg-white" />
      </div>
    </article>
  )
}

export default function SpecialistSection({ specialists }: { specialists: Specialist[] }) {
  return (
    <section id="specialists" className="bg-white pt-16 text-zinc-900 dark:bg-[#050505] dark:text-zinc-100">
      <div className={`relative mx-auto flex max-w-[1440px] flex-col border-x md:flex-row ${RULE}`}>
        <div
          className={`z-30 h-fit w-full self-start border-b bg-white p-6 dark:bg-[#050505] md:sticky md:top-24 md:w-1/3 md:border-b-0 md:border-r md:p-12 ${RULE}`}
        >
          <header className="space-y-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Clinical staff</span>
            <SplitReveal
              as="h2"
              text="Specialists"
              className="block text-5xl font-extrabold leading-[0.9] tracking-tighter text-zinc-950 dark:text-white md:text-6xl"
            />
            <div className="h-1 w-16 bg-zinc-950 dark:bg-white" />
          </header>
        </div>

        <div className={`grid w-full grid-cols-1 border-t md:w-2/3 md:grid-cols-2 md:border-t-0 ${RULE}`}>
          {specialists.map((specialist) => (
            <SpecialistCard key={specialist.id} specialist={specialist} />
          ))}
        </div>
      </div>
    </section>
  )
}
