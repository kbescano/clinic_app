'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { RegistrySkeleton } from '@/components/shared/RegistrySkeleton'

// --- TYPES & INTERFACES ---

interface ServiceImage {
  image?: { url: string }
  url?: string
}

interface ServiceDetail {
  title: string
  description: string
}

interface Service {
  id: string
  title: string
  description: string
  price: number
  images: ServiceImage[]
  details: ServiceDetail[]
}

interface ServiceCardProps {
  service: Service
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  detailsOpenId: string | null
  setDetailsOpenId: (id: string | null) => void
  index: number
  onInView: (id: string) => void
}

const atelierEase = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

// --- SUB-COMPONENT: CHOREOGRAPHED SERVICE CARD ---
const ServiceCard = ({
  service,
  expandedId,
  setExpandedId,
  detailsOpenId,
  setDetailsOpenId,
  index,
  onInView,
}: ServiceCardProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current) return

    const revealObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      },
    )

    const stepperObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onInView(service.id)
        }
      },
      {
        threshold: 0,
        rootMargin: '-20% 0px -75% 0px',
      },
    )

    revealObserver.observe(cardRef.current)
    stepperObserver.observe(cardRef.current)

    return () => {
      revealObserver.disconnect()
      stepperObserver.disconnect()
    }
  }, [service.id, onInView])

  const formattedIndex = (index + 1).toString().padStart(2, '0')

  return (
    <div
      id={`service-${service.id}`}
      ref={cardRef}
      className="flex flex-col md:flex-row md:items-start group overflow-hidden border-b border-zinc-950 dark:border-zinc-700 last:border-none even:md:flex-row-reverse bg-white dark:bg-[#050505]"
    >
      {/* IMAGE CONTAINER: Sticky alignment matched to stepper */}
      <div className="relative w-full md:w-1/2 shrink-0 overflow-hidden h-[500px] md:h-[750px] bg-zinc-100 dark:bg-[#030303] md:sticky md:top-24">
        <div
          className={`absolute inset-0 transition-opacity duration-[2000ms] ${atelierEase} ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {service.images && service.images.length > 0 ? (
            <ServiceSlider images={service.images} priority={index < 2} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
              Media Offline
            </div>
          )}
        </div>

        <span
          className={`absolute top-6 left-6 z-30 text-sm font-bold tabular-nums tracking-widest text-white mix-blend-difference transition-all duration-[1200ms] delay-[300ms] ${atelierEase} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
          }`}
        >
          /{formattedIndex}
        </span>
      </div>

      {/* TEXT CONTENT: Removed forced 750px height on mobile */}
      <div className="flex flex-col w-full md:w-1/2 p-8 md:p-12 lg:p-20 justify-center relative bg-white dark:bg-[#050505] min-h-0 md:min-h-[750px]">
        <div className="max-w-md w-full mx-auto">
          <div className="space-y-8">
            <h3
              className={`text-4xl md:text-5xl font-extrabold text-zinc-950 dark:text-white leading-[1.02] tracking-tighter transition-all duration-[1000ms] delay-[150ms] ${atelierEase} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              {service.title}
            </h3>

            <div
              className={`space-y-6 transition-all duration-[1200ms] delay-[400ms] ${atelierEase} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="flex flex-col items-start gap-4">
                <p
                  className={`text-base md:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed transition-all duration-[1000ms] ${expandedId === service.id ? '' : 'line-clamp-3'}`}
                >
                  {service.description}
                </p>
                {service.description?.length > 80 && (
                  <button
                    onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
                    className="group/read text-xs uppercase tracking-[0.2em] font-bold text-zinc-950 dark:text-zinc-200 relative pb-1.5 outline-none"
                  >
                    <span>{expandedId === service.id ? 'Read less' : 'Read more'}</span>
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-950 dark:bg-white origin-left scale-x-[0.25] transition-transform duration-500 group-hover/read:scale-x-100" />
                  </button>
                )}
              </div>
            </div>

            {service.details && service.details.length > 0 && (
              <div className="relative pt-4 mt-8">
                <div
                  className={`absolute top-0 left-0 h-[2px] bg-zinc-950 dark:bg-white transition-all duration-[1200ms] delay-[400ms] ${atelierEase} ${isVisible ? 'w-full' : 'w-0'}`}
                />

                {service.details.map((item, idx) => {
                  const uniqueId = `${service.id}-${idx}`
                  const isOpen = detailsOpenId === uniqueId
                  return (
                    <div
                      key={idx}
                      className={`relative border-b border-transparent transition-all duration-[1000ms] ${atelierEase}`}
                      style={{
                        transitionDelay: isVisible ? `${700 + idx * 100}ms` : '0ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
                      }}
                    >
                      <div
                        className={`absolute bottom-0 left-0 h-px bg-zinc-300 dark:bg-zinc-700 transition-all duration-[1200ms] ${atelierEase}`}
                        style={{
                          width: isVisible ? '100%' : '0%',
                          transitionDelay: isVisible ? `${800 + idx * 100}ms` : '0ms',
                        }}
                      />

                      <button
                        onClick={() => setDetailsOpenId(isOpen ? null : uniqueId)}
                        className="w-full flex items-center justify-between py-5 text-sm uppercase tracking-[0.12em] font-bold text-zinc-950 dark:text-zinc-100 group/item text-left outline-none"
                      >
                        <span className="transition-all duration-700 group-hover/item:pl-2">
                          {item.title}
                        </span>
                        <span
                          className={`text-2xl leading-none font-light transition-transform duration-500 ${isOpen ? 'rotate-45' : ''}`}
                        >
                          +
                        </span>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-[1000ms] ${atelierEase} ${isOpen ? 'max-h-60 pb-8 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="pl-5 border-l-2 border-zinc-950 dark:border-white">
                          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <footer className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-6 pt-12 mt-12">
            <div
              className={`absolute top-0 left-0 h-[2px] bg-zinc-950 dark:bg-white transition-all duration-[1200ms] delay-[600ms] ${atelierEase} ${isVisible ? 'w-full' : 'w-0'}`}
            />
            <div
              className={`space-y-1 transition-all duration-[1500ms] delay-[1200ms] ${atelierEase} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                From
              </span>
              <p className="text-3xl font-extrabold tracking-tighter text-zinc-950 dark:text-white tabular-nums whitespace-nowrap">
                PHP {service.price?.toLocaleString()}
              </p>
            </div>
            <Link
              href={`/booking?serviceId=${service.id}`}
              className={`group/book flex items-center gap-3 whitespace-nowrap bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] outline-none transition-all duration-[1000ms] delay-[700ms] hover:bg-zinc-700 dark:hover:bg-zinc-200 ${atelierEase} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              Book now
              <ArrowUpRightIcon className="w-4 h-4 transition-transform duration-300 group-hover/book:translate-x-0.5 group-hover/book:-translate-y-0.5" strokeWidth={2.5} />
            </Link>
          </footer>
        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENT: SLIDER ---
const ServiceSlider = ({ images, priority }: { images: ServiceImage[]; priority?: boolean }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(
    () => emblaApi && setSelectedIndex(emblaApi.selectedScrollSnap()),
    [emblaApi],
  )
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing group/slider">
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((item, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0 h-full bg-zinc-50 dark:bg-[#030303]"
            >
              <Image
                src={item.image?.url || item.url || ''}
                alt=""
                fill
                priority={priority && index === 0}
                className="object-cover transition-transform duration-[4000ms] group-hover/slider:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/40 text-white transition-colors duration-300 hover:bg-black"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/40 text-white transition-colors duration-300 hover:bg-black"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-5 h-5" strokeWidth={2} />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to image ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-[3px] transition-all duration-500 ${i === selectedIndex ? 'w-10 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// --- MAIN COMPONENT ---
export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsOpenId, setDetailsOpenId] = useState<string | null>(null)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  const stepperRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    async function fetchServices() {
      try {
        const [response] = await Promise.all([
          fetch('/api/services?limit=100'),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ])
        const data = await response.json()
        setServices(data.docs || [])
        if (data.docs && data.docs.length > 0) setActiveServiceId(data.docs[0].id)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchServices()
  }, [])

  useEffect(() => {
    if (activeTabRef.current && stepperRef.current && !isLoading) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeServiceId, isLoading])

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(`service-${id}`)
    if (el) {
      const offset = 120
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = el.getBoundingClientRect().top
      window.scrollTo({ top: elementRect - bodyRect - offset, behavior: 'smooth' })
    }
  }

  return (
    <>
      <RegistrySkeleton />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        html { scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      <section
        id="services"
        className={`relative z-10 min-h-screen bg-white dark:bg-[#050505] transition-opacity duration-1000 ${
          isLoading ? 'opacity-0 h-screen overflow-hidden' : 'opacity-100'
        }`}
      >
        <div className="relative w-full max-w-[1440px] mx-auto flex flex-col md:flex-row border-x border-zinc-950 dark:border-zinc-700 mt-20 md:mt-24">
          <div className="w-full md:w-1/3 p-6 md:p-12 border-b md:border-b-0 md:border-r border-zinc-950 dark:border-zinc-700 z-30 bg-white dark:bg-[#050505] sticky top-0 md:top-24 self-start h-fit overflow-hidden">
            <div
              className={`space-y-6 md:space-y-12 transition-all duration-[2000ms] ${atelierEase} ${isMounted && !isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <header className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 block">
                  Treatment registry
                </span>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-zinc-950 dark:text-white leading-[0.9]">
                  The Collection
                </h1>
                <div
                  className={`h-1 bg-zinc-950 dark:bg-white transition-all duration-[1500ms] delay-[300ms] ${atelierEase} ${isMounted && !isLoading ? 'w-16' : 'w-0'}`}
                />
              </header>

              <div
                ref={stepperRef}
                className="flex flex-row md:flex-col items-center md:items-start w-full gap-6 md:gap-0 md:space-y-5 overflow-x-auto no-scrollbar py-2 md:py-0"
              >
                {services.map((s, idx) => {
                  const isActive = activeServiceId === s.id
                  return (
                    <button
                      key={s.id}
                      ref={isActive ? activeTabRef : null}
                      onClick={() => handleScrollTo(s.id)}
                      className="flex items-center gap-3 md:gap-4 shrink-0 outline-none group text-left"
                    >
                      <span
                        className={`text-xs font-bold tabular-nums tracking-widest transition-colors duration-500 ${isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div
                        className={`h-[2px] transition-all duration-700 ${atelierEase} ${isActive ? 'w-8 md:w-12 bg-zinc-950 dark:bg-white' : 'w-4 md:w-6 bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-950 dark:group-hover:bg-white'}`}
                      />
                      <span
                        className={`text-xs uppercase tracking-[0.15em] font-bold transition-colors duration-500 ${isActive ? 'text-zinc-950 dark:text-white block' : 'text-zinc-400 dark:text-zinc-600 hidden md:block group-hover:text-zinc-950 dark:group-hover:text-white'}`}
                      >
                        {s.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col flex-1 bg-zinc-50 dark:bg-[#080808]">
            <div className="flex flex-col border-t md:border-t-0 border-zinc-950 dark:border-zinc-700">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  detailsOpenId={detailsOpenId}
                  setDetailsOpenId={setDetailsOpenId}
                  index={index}
                  onInView={setActiveServiceId}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
