'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
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
}

// --- SUB-COMPONENT: CHOREOGRAPHED SERVICE CARD ---
const ServiceCard = ({
  service,
  expandedId,
  setExpandedId,
  detailsOpenId,
  setDetailsOpenId,
}: ServiceCardProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Increased threshold to 0.2: Animation won't start until 20% of the card is on-screen
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px',
    })
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const atelierEase = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

  return (
    <div
      ref={cardRef}
      className="flex flex-col md:flex-row bg-white dark:bg-[#050505] group overflow-hidden border-b border-transparent last:border-none even:md:flex-row-reverse"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative w-full md:w-[45%] shrink-0 overflow-hidden h-[550px] md:h-auto md:min-h-[750px] bg-zinc-50 dark:bg-black">
        {/* 1. THE CURTAIN REVEAL: Solid block that slides away */}
        <div
          className={`absolute inset-0 z-20 bg-white dark:bg-[#050505] origin-right transition-transform duration-[2000ms] ${atelierEase} ${
            isVisible ? 'scale-x-0' : 'scale-x-100'
          }`}
        />

        {/* The Image (Scales down and un-blurs as the curtain opens) */}
        <div
          className={`h-full w-full transition-all duration-[2500ms] delay-200 ${atelierEase} origin-center ${
            isVisible ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.1] blur-[15px]'
          }`}
        >
          {service.images && service.images.length > 0 ? (
            <ServiceSlider images={service.images} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[7px] uppercase tracking-[0.8em] text-zinc-400 font-serif">
              Media Offline
            </div>
          )}
        </div>
      </div>

      {/* TEXT CONTENT */}
      <div className="flex flex-col flex-1 p-8 md:p-20 lg:p-28 justify-center relative">
        <div className="max-w-md w-full mx-auto">
          <div className="space-y-8">
            {/* 2. TYPOGRAPHY COLLAPSE: Letter spacing collapses as it rises */}
            <h3
              className={`text-[18px] md:text-[22px] font-normal font-serif text-[#251101] dark:text-zinc-100 leading-tight transition-all duration-[2000ms] delay-[400ms] ${atelierEase} ${
                isVisible
                  ? 'opacity-100 translate-y-0 tracking-tight blur-0'
                  : 'opacity-0 translate-y-12 tracking-[0.3em] blur-md'
              }`}
            >
              {service.title}
            </h3>

            <div
              className={`space-y-6 transition-all duration-[1500ms] delay-[600ms] ${atelierEase} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
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
                    <span className="absolute bottom-0 left-0 w-0 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/read:w-full" />
                  </button>
                )}
              </div>
            </div>

            {/* DETAILS ACCORDION */}
            {service.details && service.details.length > 0 && (
              <div className="relative pt-4 mt-8">
                {/* 3. DRAW-IN BORDER: Top line draws itself */}
                <div
                  className={`absolute top-0 left-0 h-[0.5px] bg-zinc-200 dark:bg-zinc-800 transition-all duration-[2000ms] delay-[800ms] ${atelierEase} ${
                    isVisible ? 'w-full' : 'w-0'
                  }`}
                />

                {service.details.map((item, idx) => {
                  const uniqueId = `${service.id}-${idx}`
                  const isOpen = detailsOpenId === uniqueId
                  return (
                    <div
                      key={idx}
                      className={`relative border-b border-transparent transition-all duration-[1000ms] ${atelierEase}`}
                      style={{
                        transitionDelay: `${900 + idx * 150}ms`,
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                      }}
                    >
                      {/* Individual accordion bottom borders draw themselves */}
                      <div
                        className={`absolute bottom-0 left-0 h-[0.5px] bg-zinc-100 dark:bg-zinc-900 transition-all duration-[1500ms] ${atelierEase}`}
                        style={{
                          width: isVisible ? '100%' : '0%',
                          transitionDelay: `${1000 + idx * 150}ms`,
                        }}
                      />

                      <button
                        onClick={() => setDetailsOpenId(isOpen ? null : uniqueId)}
                        className="w-full flex items-center justify-between py-6 text-[9px] uppercase tracking-[0.3em] font-normal text-[#251101] dark:text-zinc-200 font-serif group/item text-left outline-none"
                      >
                        <span
                          className={`transition-all duration-700 ${atelierEase} group-hover/item:pl-2`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`text-[14px] font-light transition-transform duration-700 ${atelierEase} ${isOpen ? 'rotate-45 text-[#595f72]' : ''}`}
                        >
                          +
                        </span>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-[1200ms] ${atelierEase} ${
                          isOpen ? 'max-h-60 pb-8 opacity-100' : 'max-h-0 opacity-0'
                        }`}
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
            {/* Draw-in Border for Footer */}
            <div
              className={`absolute top-0 left-0 h-[0.5px] bg-zinc-200 dark:bg-zinc-800 transition-all duration-[2000ms] delay-[1200ms] ${atelierEase} ${
                isVisible ? 'w-full' : 'w-0'
              }`}
            />

            <div
              className={`space-y-1 transition-all duration-[1500ms] delay-[1400ms] ${atelierEase} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <span className="block text-[7px] uppercase tracking-[0.6em] text-[#595f72] font-serif opacity-50">
                Price
              </span>
              <p className="text-[16px] md:text-[18px] font-serif tracking-tighter text-[#251101] dark:text-white tabular-nums transition-transform duration-700 hover:scale-105 origin-left">
                PHP {service.price?.toLocaleString()}
              </p>
            </div>

            <Link
              href={`/booking?serviceId=${service.id}`}
              className={`group/book flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.4em] font-serif outline-none transition-all duration-[1500ms] delay-[1500ms] ${atelierEase} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <span className="relative pb-1">
                Book now
                <span className="absolute bottom-0 left-0 w-0 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/book:w-full" />
              </span>
              <ArrowUpRightIcon className="w-3.5 h-3.5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform group-hover/book:translate-x-1 group-hover/book:-translate-y-1" />
            </Link>
          </footer>
        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENT: SLIDER (LOGIC UNTOUCHED) ---
const ServiceSlider = ({ images }: { images: ServiceImage[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing group/slider bg-white dark:bg-black">
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((item, index) => (
            <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full">
              <Image
                src={item.image?.url || item.url || ''}
                alt="Service"
                fill
                className="object-cover transition-transform duration-[4000ms] ease-out group-hover/slider:scale-110"
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
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 transition-all duration-300 hover:text-white"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-2 text-white/50 transition-all duration-300 hover:text-white"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-[1px] transition-all duration-700 ${
                i === selectedIndex ? 'w-12 bg-white' : 'w-4 bg-white/30 hover:bg-white/60'
              }`}
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
  const pathname = usePathname()
  const [isHeaderMounted, setIsHeaderMounted] = useState(false)

  useEffect(() => {
    // Slight delay to ensure the page is fully loaded before the header animates in
    const timer = setTimeout(() => setIsHeaderMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services?limit=100')
        const data = await response.json()
        setServices(data.docs || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  if (loading)
    return (
      <div className="bg-white dark:bg-[#050505] min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-[0.5px] border-[#251101] dark:border-white rounded-full animate-ping opacity-20" />
        <span className="text-zinc-400 uppercase tracking-[0.8em] text-[7px] font-serif animate-pulse">
          Registry
        </span>
      </div>
    )

  const atelierEase = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

  return (
    <section
      id="services"
      className="relative z-10 bg-white dark:bg-[#050505] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.5)] selection:bg-zinc-100"
    >
      {/* SMALL HEADER: Staggered entrance */}
      {pathname === '/services' && (
        <div className="max-w-[1440px] mx-auto pt-32 pb-16 px-8 border-x border-zinc-100 dark:border-zinc-900 overflow-hidden">
          <div className="space-y-5">
            <span
              className={`text-[8px] uppercase text-[#595f72] font-serif block transition-all duration-[2000ms] ${atelierEase} ${
                isHeaderMounted
                  ? 'opacity-50 translate-y-0 tracking-[0.8em]'
                  : 'opacity-0 translate-y-8 tracking-[1.5em]'
              }`}
            >
              Treatment Registry
            </span>
            <h2
              className={`text-[24px] md:text-[32px] font-normal font-serif text-[#251101] dark:text-zinc-100 leading-none transition-all duration-[2000ms] delay-[200ms] ${atelierEase} ${
                isHeaderMounted
                  ? 'opacity-100 translate-y-0 tracking-tight'
                  : 'opacity-0 translate-y-12 tracking-[0.2em]'
              }`}
            >
              The Collection
            </h2>
            <div
              className={`h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-[2500ms] delay-[400ms] ${atelierEase} ${
                isHeaderMounted ? 'w-12 opacity-20' : 'w-0 opacity-0'
              }`}
            />
          </div>
        </div>
      )}

      {/* SERVICE LIST: Replaced solid borders with draw-in borders in the children */}
      <div className="max-w-[1440px] mx-auto border-x border-zinc-100 dark:border-zinc-900 relative">
        <div className="flex flex-col">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              detailsOpenId={detailsOpenId}
              setDetailsOpenId={setDetailsOpenId}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
