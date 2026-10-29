'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { useInView } from 'motion/react'
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { ClipReveal, Parallax, Reveal, SplitReveal } from '@/components/shared/motion'
import { useSmoothScroll } from '@/components/shared/SmoothScroll'
import type { PublicService } from '@/lib/publicServices'

const RULE = 'border-zinc-950 dark:border-zinc-700'

// --- SLIDER ---------------------------------------------------------------------------------

function ServiceSlider({ images, title, priority }: { images: PublicService['images']; title: string; priority?: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => emblaApi && setSelected(emblaApi.selectedScrollSnap()), [emblaApi])
  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <div className="group/slider absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing">
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((item, index) => (
            <div key={item.url} className="relative h-full min-w-0 flex-[0_0_100%] bg-zinc-100 dark:bg-zinc-900">
              <Image
                src={item.url}
                alt={index === 0 ? title : `${title}, view ${index + 1}`}
                fill
                priority={priority && index === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-[1800ms] ease-out group-hover/slider:scale-[1.04]"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-3 top-1/2 z-30 -translate-y-1/2 bg-black/40 p-2 text-white transition-colors duration-300 hover:bg-black"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-3 top-1/2 z-30 -translate-y-1/2 bg-black/40 p-2 text-white transition-colors duration-300 hover:bg-black"
            aria-label="Next image"
          >
            <ChevronRightIcon className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
            {images.map((item, i) => (
              <button
                key={item.url}
                aria-label={`Go to image ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-[3px] transition-all duration-500 ${i === selected ? 'w-10 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// --- ONE SERVICE ----------------------------------------------------------------------------

function ServiceCard({
  service,
  index,
  onActive,
}: {
  service: PublicService
  index: number
  onActive: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [openDetail, setOpenDetail] = useState<number | null>(null)
  const ref = useRef<HTMLElement>(null)

  // The card crossing the middle of the screen is the "current" one for the side stepper.
  const crossing = useInView(ref, { margin: '-45% 0px -45% 0px' })
  useEffect(() => {
    if (crossing) onActive(service.id)
  }, [crossing, onActive, service.id])

  return (
    <article
      id={`service-${service.id}`}
      ref={ref}
      className={`flex flex-col overflow-hidden border-b bg-white last:border-b-0 dark:bg-[#050505] md:flex-row md:items-start md:even:flex-row-reverse ${RULE}`}
    >
      {/* IMAGE */}
      <div className="relative h-[480px] w-full shrink-0 bg-zinc-100 dark:bg-zinc-900 md:sticky md:top-24 md:h-[720px] md:w-1/2">
        {service.images.length > 0 ? (
          <ClipReveal className="absolute inset-0">
            <Parallax className="h-full">
              <ServiceSlider images={service.images} title={service.title} priority={index < 2} />
            </Parallax>
          </ClipReveal>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
            Photo coming soon
          </div>
        )}
      </div>

      {/* TEXT */}
      <div className="relative flex min-h-0 w-full flex-col justify-center bg-white p-6 dark:bg-[#050505] md:min-h-[720px] md:w-1/2 md:p-12 lg:p-16">
        <div className="mx-auto w-full max-w-md">
          <SplitReveal
            as="h3"
            text={service.title}
            className="block text-4xl font-extrabold leading-[1.02] tracking-tighter text-zinc-950 dark:text-white md:text-5xl"
          />

          <Reveal delay={0.15} className="mt-6 flex flex-col items-start gap-4">
            <p
              className={`text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg ${expanded ? '' : 'line-clamp-3'}`}
            >
              {service.description}
            </p>
            {service.description.length > 140 && (
              <button
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                className="group/read relative pb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-950 dark:text-zinc-200"
              >
                {expanded ? 'Read less' : 'Read more'}
                <span className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-[0.25] bg-zinc-950 transition-transform duration-500 group-hover/read:scale-x-100 dark:bg-white" />
              </button>
            )}
          </Reveal>

          {service.details.length > 0 && (
            <Reveal delay={0.25} className={`mt-10 border-t-2 ${RULE}`}>
              {service.details.map((item, i) => {
                const open = openDetail === i
                return (
                  <div key={item.title} className="border-b border-zinc-300 dark:border-zinc-700">
                    <button
                      onClick={() => setOpenDetail(open ? null : i)}
                      aria-expanded={open}
                      className="group/item flex w-full items-center justify-between gap-6 py-5 text-left text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 dark:text-zinc-100"
                    >
                      <span className="transition-transform duration-500 group-hover/item:translate-x-1">{item.title}</span>
                      <span
                        aria-hidden
                        className={`text-2xl font-light leading-none transition-transform duration-500 ${open ? 'rotate-45' : ''}`}
                      >
                        +
                      </span>
                    </button>
                    {/* grid-rows animates to the content's real height without measuring it */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
                        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className={`mb-6 border-l-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base ${RULE}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </Reveal>
          )}

          <Reveal delay={0.3} className={`mt-12 flex flex-wrap items-end justify-between gap-x-6 gap-y-6 border-t-2 pt-10 ${RULE}`}>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">From</span>
              <p className="whitespace-nowrap text-3xl font-extrabold tabular-nums tracking-tighter text-zinc-950 dark:text-white">
                PHP {service.price.toLocaleString('en-PH')}
              </p>
            </div>
            <Link
              href={`/booking?serviceId=${service.id}`}
              className="group/book flex items-center gap-3 whitespace-nowrap bg-zinc-950 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Book now
              <ArrowUpRightIcon
                className="h-4 w-4 transition-transform duration-300 group-hover/book:-translate-y-0.5 group-hover/book:translate-x-0.5"
                strokeWidth={2.5}
              />
            </Link>
          </Reveal>
        </div>
      </div>
    </article>
  )
}

// --- SECTION --------------------------------------------------------------------------------

export default function Services({
  services,
  heading = 'h2',
}: {
  services: PublicService[]
  /** The standalone /services page has no hero, so there the title is the page's h1. */
  heading?: 'h1' | 'h2'
}) {
  const { scrollTo } = useSmoothScroll()
  const [activeId, setActiveId] = useState<number | null>(services[0]?.id ?? null)
  const stepperRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  // Keep the active tab centred in the horizontal stepper on phones, without ever scrolling the page.
  useEffect(() => {
    const tab = activeTabRef.current
    const box = stepperRef.current
    if (!tab || !box) return
    box.scrollTo({ left: tab.offsetLeft - box.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' })
  }, [activeId])

  return (
    <section id="services" className="relative z-10 min-h-screen bg-white dark:bg-[#050505]">
      <div className={`relative mx-auto flex w-full max-w-[1440px] flex-col border-x md:flex-row ${RULE}`}>
        {/* HEADER + STEPPER */}
        <div
          className={`z-30 h-fit w-full self-start border-b bg-white p-6 dark:bg-[#050505] md:sticky md:top-24 md:w-1/3 md:border-b-0 md:border-r md:p-12 ${RULE}`}
        >
          <header className="space-y-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Treatments</span>
            <SplitReveal
              as={heading}
              text="The Collection"
              className="block text-5xl font-extrabold leading-[0.9] tracking-tighter text-zinc-950 dark:text-white md:text-6xl"
            />
            <div className="h-1 w-16 bg-zinc-950 dark:bg-white" />
          </header>

          <div
            ref={stepperRef}
            className="no-scrollbar mt-8 flex items-center gap-6 overflow-x-auto py-2 md:mt-12 md:flex-col md:items-start md:gap-5 md:overflow-visible md:py-0"
          >
            {services.map((s, idx) => {
              const isActive = activeId === s.id
              return (
                <button
                  key={s.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => scrollTo(`#service-${s.id}`, { offset: -96 })}
                  aria-current={isActive}
                  className="group flex shrink-0 items-center gap-3 text-left md:gap-4"
                >
                  <span
                    className={`text-xs font-bold tabular-nums tracking-widest transition-colors duration-500 ${
                      isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`h-[2px] transition-all duration-700 ${
                      isActive
                        ? 'w-8 bg-zinc-950 dark:bg-white md:w-12'
                        : 'w-4 bg-zinc-300 group-hover:bg-zinc-950 dark:bg-zinc-700 dark:group-hover:bg-white md:w-6'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-500 ${
                      isActive
                        ? 'block text-zinc-950 dark:text-white'
                        : 'hidden text-zinc-400 group-hover:text-zinc-950 dark:text-zinc-600 dark:group-hover:text-white md:block'
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* CARDS */}
        <div className={`flex w-full flex-1 flex-col border-t bg-zinc-50 dark:bg-[#080808] md:w-2/3 md:border-t-0 ${RULE}`}>
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} onActive={setActiveId} />
          ))}
        </div>
      </div>
    </section>
  )
}
