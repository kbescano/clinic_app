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
  index: number
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
}: ServiceCardProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '-10% 0px -10% 0px',
      },
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={cardRef}
      className="flex flex-col md:flex-row bg-white dark:bg-[#050505] group overflow-hidden border-b border-transparent last:border-none even:md:flex-row-reverse"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative w-full md:w-[45%] shrink-0 overflow-hidden h-[550px] md:h-auto md:min-h-[750px] bg-zinc-50 dark:bg-black">
        {/* 1. THE CURTAIN REVEAL */}
        <div
          className={`absolute inset-0 z-20 bg-white dark:bg-[#050505] origin-right transition-transform duration-[2000ms] ${atelierEase} ${
            isVisible ? 'scale-x-0 delay-[100ms]' : 'scale-x-100 delay-0'
          }`}
        />

        {/* 2. IMAGE FOCUS */}
        <div
          className={`h-full w-full transition-all duration-[2500ms] ${atelierEase} origin-center ${
            isVisible
              ? 'opacity-100 scale-100 blur-0 delay-[200ms]'
              : 'opacity-0 scale-[1.1] blur-[15px] delay-0'
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
      </div>

      {/* TEXT CONTENT */}
      <div className="flex flex-col flex-1 p-8 md:p-20 lg:p-28 justify-center relative">
        <div className="max-w-md w-full mx-auto">
          <div className="space-y-8">
            {/* 3. TYPOGRAPHY COLLAPSE: Fixed wrap issue by using static tracking and animating blur instead */}
            <h3
              className={`text-[18px] md:text-[22px] font-normal font-serif text-[#251101] dark:text-zinc-100 leading-tight tracking-tight transition-all duration-[2000ms] ${atelierEase} ${
                isVisible
                  ? 'opacity-100 translate-y-0 blur-0 delay-[400ms]'
                  : 'opacity-0 translate-y-8 blur-[4px] delay-0'
              }`}
            >
              {service.title}
            </h3>

            <div
              className={`space-y-6 transition-all duration-[1500ms] ${atelierEase} ${
                isVisible
                  ? 'opacity-100 translate-y-0 delay-[600ms]'
                  : 'opacity-0 translate-y-12 delay-0'
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
                {/* Top Border Draw-in */}
                <div
                  className={`absolute top-0 left-0 h-[0.5px] bg-zinc-200 dark:bg-zinc-800 transition-all duration-[2000ms] ${atelierEase} ${
                    isVisible ? 'w-full delay-[800ms]' : 'w-0 delay-0'
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
                        transitionDelay: isVisible ? `${900 + idx * 150}ms` : '0ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                      }}
                    >
                      <div
                        className={`absolute bottom-0 left-0 h-[0.5px] bg-zinc-100 dark:bg-zinc-900 transition-all duration-[1500ms] ${atelierEase}`}
                        style={{
                          width: isVisible ? '100%' : '0%',
                          transitionDelay: isVisible ? `${1000 + idx * 150}ms` : '0ms',
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
            <div
              className={`absolute top-0 left-0 h-[0.5px] bg-zinc-200 dark:bg-zinc-800 transition-all duration-[2000ms] ${atelierEase} ${
                isVisible ? 'w-full delay-[1200ms]' : 'w-0 delay-0'
              }`}
            />

            <div
              className={`space-y-1 transition-all duration-[1500ms] ${atelierEase} ${
                isVisible
                  ? 'opacity-100 translate-y-0 delay-[1400ms]'
                  : 'opacity-0 translate-y-8 delay-0'
              }`}
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
              className={`group/book flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.4em] font-serif outline-none transition-all duration-[1500ms] ${atelierEase} ${
                isVisible
                  ? 'opacity-100 translate-y-0 delay-[1500ms]'
                  : 'opacity-0 translate-y-8 delay-0'
              }`}
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

// --- SUB-COMPONENT: SLIDER ---
const ServiceSlider = ({ images, priority }: { images: ServiceImage[]; priority?: boolean }) => {
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
                priority={priority && index === 0}
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

  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsHeaderVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    )
    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
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

  return (
    <section
      id="services"
      className="relative z-10 bg-white dark:bg-[#050505] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.5)] selection:bg-zinc-100 min-h-screen flex flex-col"
    >
      {/* HEADER */}
      {pathname === '/services' && (
        <div
          ref={headerRef}
          className="max-w-[1440px] w-full mx-auto pt-32 pb-16 px-8 border-x border-zinc-100 dark:border-zinc-900 overflow-hidden"
        >
          <div className="space-y-5">
            {/* Removed tracking animation here as well to prevent wrap issues */}
            <span
              className={`text-[8px] uppercase tracking-[0.8em] text-[#595f72] font-serif block transition-all duration-[2000ms] ${atelierEase} ${
                isHeaderVisible
                  ? 'opacity-50 translate-y-0 blur-0 delay-0'
                  : 'opacity-0 translate-y-6 blur-[2px] delay-0'
              }`}
            >
              Treatment Registry
            </span>
            <h2
              className={`text-[24px] md:text-[32px] font-normal font-serif tracking-tight text-[#251101] dark:text-zinc-100 leading-none transition-all duration-[2000ms] ${atelierEase} ${
                isHeaderVisible
                  ? 'opacity-100 translate-y-0 blur-0 delay-[200ms]'
                  : 'opacity-0 translate-y-8 blur-[4px] delay-0'
              }`}
            >
              The Collection
            </h2>
            <div
              className={`h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-[2500ms] ${atelierEase} ${
                isHeaderVisible ? 'w-12 opacity-20 delay-[400ms]' : 'w-0 opacity-0 delay-0'
              }`}
            />
          </div>
        </div>
      )}

      {/* DYNAMIC CONTENT AREA */}
      {loading ? (
        <div className="flex-1 max-w-[1440px] w-full mx-auto border-x border-t border-zinc-100 dark:border-zinc-900 flex flex-col items-center justify-center py-40">
          <div className="w-8 h-8 border-[0.5px] border-[#251101] dark:border-white rounded-full animate-ping opacity-20 mb-4" />
          <span className="text-zinc-400 uppercase tracking-[0.8em] text-[7px] font-serif animate-pulse">
            Registry
          </span>
        </div>
      ) : (
        <div className="flex-1 max-w-[1440px] w-full mx-auto border-x border-zinc-100 dark:border-zinc-900 relative">
          <div className="flex flex-col border-t border-zinc-100 dark:border-zinc-900">
            {services.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                detailsOpenId={detailsOpenId}
                setDetailsOpenId={setDetailsOpenId}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
