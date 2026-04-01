import { Suspense } from 'react'
import Services from './components/Services'
import SpecialistSection from './components/SpecialistSection'
// import SectionHeader from './components/SectionHeader'
import BookNowButton from './components/BookNowButton'

export default async function HomePage() {
  return (
    <main className="relative bg-white dark:bg-black w-full overflow-x-hidden min-h-screen">
      <BookNowButton />
      {/* 
          SUSPENSE STRATEGY: 
          We wrap each major section in its own Suspense boundary.
          This allows the "Clinic Operations" header to stay fixed while content flows in.
      */}
      <div className="space-y-0">
        <Suspense fallback={<SectionSkeleton items={3} />}>
          <Services />
        </Suspense>

        <Suspense fallback={<SectionSkeleton items={2} dark />}>
          <div className="bg-zinc-50 dark:bg-zinc-950">
            <SpecialistSection />
          </div>
        </Suspense>
      </div>
    </main>
  )
}

// HIGH-END SKELETON COMPONENT
function SectionSkeleton({ items = 3, dark = false }: { items?: number; dark?: boolean }) {
  return (
    <div
      className={`py-20 px-4 md:px-8 ${dark ? 'bg-zinc-50 dark:bg-zinc-950' : 'bg-white dark:bg-black'}`}
    >
      <div className="max-w-5xl mx-auto">
        {/* Skeleton Title */}
        <div className="w-32 h-3 bg-zinc-100 dark:bg-zinc-900 rounded-full animate-pulse mb-8" />

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: items }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-[2rem] animate-pulse border border-zinc-100 dark:border-zinc-800/50"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
