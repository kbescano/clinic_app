'use client'

import { Reveal } from '@/components/shared/motion'
import { reviews } from './data'
import { Eyebrow } from './ui'

const Star = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4L2.8 9.5l6.4-.8z" />
  </svg>
)

export default function DentalReviews() {
  return (
    <section className="bg-sand px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <Eyebrow>Patients say</Eyebrow>
        <div className="grid gap-3 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col justify-between gap-10 rounded-xl bg-paper p-7 md:p-9">
                <div>
                  <div className="mb-5 flex gap-1 text-flame" role="img" aria-label="Rated 5 out of 5">
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star key={s} />
                    ))}
                  </div>
                  <blockquote className="text-[22px] font-medium leading-snug tracking-[-0.02em] text-ink">“{r.quote}”</blockquote>
                </div>
                <figcaption className="text-[15px] text-stone">
                  <span className="font-medium text-ink">{r.name}</span> · {r.treatment}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-sm text-stone">Sample reviews for this demo.</p>
      </div>
    </section>
  )
}
