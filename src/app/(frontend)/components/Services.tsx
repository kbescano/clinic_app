'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          onInView(service.id)
        }
      },
      {
        threshold: 0,
        rootMargin: '-15% 0px -75% 0px',
      },
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [service.id, onInView])

  const formattedIndex = (index + 1).toString().padStart(2, '0')

  return (
    <div
      id={`service-${service.id}`}
      ref={cardRef}
      className="flex flex-col md:flex-row group overflow-hidden border-b border-zinc-100 dark:border-zinc-900 last:border-none even:md:flex-row-reverse bg-white dark:bg-[#050505]"
    >
      {/* IMAGE CONTAINER: Specialist-style Reveal */}
      <div className="relative w-full md:w-1/2 shrink-0 overflow-hidden h-[500px] md:h-auto md:min-h-[750px] bg-zinc-50 dark:bg-black grayscale-[0.2] group-hover:grayscale-0 transition-all duration-[1500ms]">
        {/* 1. THE CURTAIN REVEAL (Solid block sliding right) */}
        <div
          className={`absolute inset-0 z-20 bg-white dark:bg-[#050505] origin-right transition-transform duration-[2000ms] ${atelierEase} ${
            isVisible ? 'scale-x-0' : 'scale-x-100'
          }`}
        />

        {/* 2. IMAGE SLIDER (Scales down & un-blurs) */}
        <div
          className={`absolute inset-0 transition-all duration-[2500ms] delay-200 ${atelierEase} origin-center ${
            isVisible ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.1] blur-xl'
          }`}
        >
          {service.images && service.images.length > 0 ? (
            <ServiceSlider images={service.images} priority={index < 2} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[7px] uppercase tracking-[0.8em] text-zinc-400 font-serif">
              Media Offline
            </div>
          )}
        </div>

        {/* 3. EDITORIAL INDEX (Floats in like Specialist) */}
        <span
          className={`absolute top-8 left-8 z-30 text-[9px] font-serif text-white/40 mix-blend-difference transition-all duration-[2000ms] delay-[800ms] ${atelierEase} ${
            isVisible
              ? 'opacity-100 translate-y-0 tracking-[0.4em]'
              : 'opacity-0 -translate-y-4 tracking-[1em]'
          }`}
        >
          /{formattedIndex}
        </span>
      </div>

      {/* TEXT CONTENT */}
      <div className="flex flex-col flex-1 p-8 md:p-12 lg:p-20 justify-center relative bg-white dark:bg-[#050505]">
        <div className="max-w-md w-full mx-auto">
          <div className="space-y-8">
            {/* TYPOGRAPHY REVEAL */}
            <h3
              className={`text-[20px] md:text-[24px] font-normal font-serif text-[#251101] dark:text-zinc-100 leading-tight tracking-tight transition-all duration-[1500ms] delay-[400ms] ${atelierEase} ${
                isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-md'
              }`}
            >
              {service.title}
            </h3>

            <div
              className={`space-y-6 transition-all duration-[1200ms] delay-[600ms] ${atelierEase} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="flex flex-col items-start gap-4">
                <p
                  className={`text-[12px] md:text-[13px] font-light text-[#595f72] dark:text-zinc-400 leading-relaxed tracking-tight font-serif transition-all duration-[1000ms] ${expandedId === service.id ? '' : 'line-clamp-3'}`}
                >
                  {service.description}
                </p>
                {service.description?.length > 80 && (
                  <button
                    onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
                    className="group/read text-[8px] uppercase tracking-[0.4em] font-bold text-[#251101] dark:text-zinc-200 font-serif relative pb-1 outline-none"
                  >
                    <span>{expandedId === service.id ? 'Read less' : 'Read more'}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-700 group-hover/read:w-full" />
                  </button>
                )}
              </div>
            </div>

            {/* DETAILS ACCORDION: Signature Draw-in lines */}
            {service.details && service.details.length > 0 && (
              <div className="relative pt-4 mt-8">
                <div
                  className={`absolute top-0 left-0 h-[0.5px] bg-zinc-200 dark:bg-zinc-800 transition-all duration-[2000ms] delay-[800ms] ${atelierEase} ${isVisible ? 'w-full' : 'w-0'}`}
                />

                {service.details.map((item, idx) => {
                  const uniqueId = `${service.id}-${idx}`
                  const isOpen = detailsOpenId === uniqueId
                  return (
                    <div
                      key={idx}
                      className={`relative border-b border-transparent transition-all duration-[1000ms] ${atelierEase}`}
                      style={{
                        transitionDelay: isVisible ? `${900 + idx * 100}ms` : '0ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
                      }}
                    >
                      <div
                        className={`absolute bottom-0 left-0 h-[0.5px] bg-zinc-100 dark:bg-zinc-900 transition-all duration-[1500ms] ${atelierEase}`}
                        style={{
                          width: isVisible ? '100%' : '0%',
                          transitionDelay: isVisible ? `${1000 + idx * 100}ms` : '0ms',
                        }}
                      />

                      <button
                        onClick={() => setDetailsOpenId(isOpen ? null : uniqueId)}
                        className="w-full flex items-center justify-between py-6 text-[9px] uppercase tracking-[0.3em] font-normal text-[#251101] dark:text-zinc-200 font-serif group/item text-left outline-none"
                      >
                        <span className="transition-all duration-700 group-hover/item:pl-2">
                          {item.title}
                        </span>
                        <span
                          className={`text-[14px] font-light transition-transform duration-700 ${isOpen ? 'rotate-45 text-[#595f72]' : ''}`}
                        >
                          +
                        </span>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-[1000ms] ${atelierEase} ${isOpen ? 'max-h-60 pb-8 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="pl-6 border-l border-zinc-100 dark:border-zinc-800">
                          <p className="text-[11px] md:text-[12px] font-light text-[#595f72] dark:text-zinc-400 font-serif leading-relaxed">
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

          <footer className="relative flex items-end justify-between pt-12 mt-12">
            <div
              className={`absolute top-0 left-0 h-[0.5px] bg-zinc-200 dark:bg-zinc-800 transition-all duration-[2000ms] delay-[1200ms] ${atelierEase} ${isVisible ? 'w-full' : 'w-0'}`}
            />
            <div
              className={`space-y-1 transition-all duration-[1500ms] delay-[1400ms] ${atelierEase} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <span className="block text-[7px] uppercase tracking-[0.6em] text-[#595f72] font-serif opacity-50">
                Reservation starting from
              </span>
              <p className="text-[16px] md:text-[18px] font-serif tracking-tighter text-[#251101] dark:text-white tabular-nums">
                PHP {service.price?.toLocaleString()}
              </p>
            </div>
            <Link
              href={`/booking?serviceId=${service.id}`}
              className={`group/book flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.4em] font-serif outline-none transition-all duration-[1500ms] delay-[1500ms] ${atelierEase} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            >
              <span className="relative pb-1">
                Book now
                <span className="absolute bottom-0 left-0 w-0 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-700 group-hover/book:w-full" />
              </span>
              <ArrowUpRightIcon className="w-3.5 h-3.5 transition-all duration-700 transform group-hover/book:translate-x-1 group-hover/book:-translate-y-1" />
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
            <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full">
              <Image
                src={item.image?.url || item.url || ''}
                alt=""
                fill
                priority={priority && index === 0}
                className="object-cover transition-transform duration-[4000ms] group-hover/slider:scale-110"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Manual Navigation Arrows Restored */}
      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 transition-all duration-300 hover:text-white"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-4 h-4" strokeWidth={1} />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 transition-all duration-300 hover:text-white"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-4 h-4" strokeWidth={1} />
          </button>
        </>
      )}

      {/* Progress Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-[1px] transition-all duration-700 ${i === selectedIndex ? 'w-10 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}`}
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
  const [loading, setLoading] = useState(true)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const stepperRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services?limit=100')
        const data = await response.json()
        setServices(data.docs || [])
        if (data.docs && data.docs.length > 0) setActiveServiceId(data.docs[0].id)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  useEffect(() => {
    if (activeTabRef.current && stepperRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeServiceId])

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
        className="relative z-10 min-h-screen bg-white dark:bg-[#050505] transition-colors duration-1000"
      >
        <div className="relative w-full max-w-[1440px] mx-auto flex flex-col md:flex-row border-x border-zinc-100 dark:border-zinc-900 mt-20 md:mt-32">
          {/* LEFT COLUMN: STICKY STEPPER */}
          <div className="w-full md:w-1/3 p-6 md:p-12 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-900 z-30 bg-white dark:bg-[#050505] sticky top-0 md:top-32 self-start h-fit overflow-hidden">
            <div
              className={`space-y-6 md:space-y-12 transition-all duration-[2000ms] ${atelierEase} ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <header className="space-y-3">
                <span className="text-[8px] uppercase tracking-[0.8em] text-[#595f72] font-serif block">
                  Treatment Registry
                </span>
                <h1 className="text-[24px] md:text-[32px] font-normal font-serif tracking-tight text-[#251101] dark:text-zinc-100 leading-none">
                  The Collection
                </h1>
                <div
                  className={`h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-[2500ms] delay-[400ms] ${atelierEase} ${isMounted ? 'w-12 opacity-20' : 'w-0 opacity-0'}`}
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
                        className={`text-[9px] font-serif tracking-[0.3em] transition-all duration-700 ${isActive ? 'text-[#251101] dark:text-white scale-110' : 'text-zinc-300 dark:text-zinc-700'}`}
                      >
                        0{idx + 1}
                      </span>
                      <div
                        className={`h-[1px] transition-all duration-1000 ${atelierEase} ${isActive ? 'w-8 md:w-12 bg-[#251101] dark:bg-white' : 'w-4 md:w-6 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-[#595f72]'}`}
                      />
                      <span
                        className={`text-[8px] uppercase tracking-[0.4em] font-serif transition-all duration-700 ${isActive ? 'text-[#251101] dark:text-white opacity-100 block' : 'text-[#595f72] opacity-0 md:-translate-x-4 hidden md:block group-hover:opacity-100 group-hover:translate-x-0'}`}
                      >
                        {s.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: GRID REGISTRY */}
          <div className="w-full md:w-2/3 flex flex-col flex-1 bg-zinc-50 dark:bg-[#080808]">
            {loading ? (
              <div className="flex-1 w-full flex flex-col items-center justify-center py-40">
                <div className="w-8 h-8 border-[0.5px] border-[#251101] dark:border-white rounded-full animate-ping opacity-20 mb-4" />
                <span className="text-zinc-400 uppercase tracking-[0.8em] text-[7px] font-serif animate-pulse">
                  Registry
                </span>
              </div>
            ) : (
              <div className="flex flex-col border-t md:border-t-0 border-zinc-100 dark:border-zinc-900">
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
            )}
          </div>
        </div>
      </section>
    </>
  )
}
