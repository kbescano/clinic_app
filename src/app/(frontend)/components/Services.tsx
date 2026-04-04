'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

// --- SUB-COMPONENT: SCROLL-REACTIVE CARD ---
const ServiceCard = ({
  service,
  expandedId,
  setExpandedId,
  detailsOpenId,
  setDetailsOpenId,
}: any) => {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // This triggers every time the card enters or leaves the view
        setIsVisible(entry.isIntersecting)
      },
      {
        threshold: 0.15, // Triggers when 15% of the card is visible
        rootMargin: '0px 0px -50px 0px', // Slight offset for a smoother "pop"
      },
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={cardRef}
      className="flex flex-col bg-white dark:bg-[#050505] group h-full overflow-hidden"
    >
      {/* Media Section */}
      <div className="relative overflow-hidden grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000">
        {service.images && service.images.length > 0 ? (
          <ServiceSlider images={service.images} />
        ) : (
          <div className="h-[450px] w-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-[8px] uppercase tracking-[0.4em] text-zinc-400 font-serif">
            Media Offline
          </div>
        )}
      </div>

      {/* Animated Content Section */}
      <div className="flex flex-col flex-grow p-6 md:p-10">
        <div className="mb-6">
          {/* Title: Quick Blur-to-Focus Reveal */}
          <h3
            className={`text-[14px] md:text-[16px] font-normal tracking-tight font-serif text-[#251101] dark:text-zinc-100 mb-6 leading-none transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-md'
            }`}
          >
            {service.title}
          </h3>

          {/* Description: Staggered Slide */}
          <div
            className={`relative transition-all duration-[1200ms] delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <p
              className={`text-[11px] md:text-[12px] font-light text-[#595f72] dark:text-zinc-400 leading-relaxed tracking-tight font-serif ${expandedId === service.id ? '' : 'line-clamp-2'}`}
            >
              {service.description}
            </p>
            {service.description?.length > 80 && (
              <button
                onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
                className="mt-3 text-[10px] font-light text-[#595f72] dark:text-zinc-200 font-serif underline underline-offset-[4px] decoration-zinc-200 dark:decoration-zinc-800 transition-colors"
              >
                {expandedId === service.id ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        </div>

        {/* Details: Subtle Staggered Fade */}
        {service.details && service.details.length > 0 && (
          <div
            className={`border-t border-zinc-100 dark:border-zinc-900/50 mb-6 transition-all duration-[1200ms] delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {service.details.map((item: any, idx: number) => {
              const uniqueId = `${service.id}-${idx}`
              const isOpen = detailsOpenId === uniqueId
              return (
                <div
                  key={idx}
                  className="border-b border-zinc-100 dark:border-zinc-900/50 last:border-none"
                >
                  <button
                    onClick={() => setDetailsOpenId(isOpen ? null : uniqueId)}
                    className="w-full flex items-center justify-between py-5 text-[11px] font-light text-[#251101] dark:text-zinc-200 font-serif hover:opacity-60 transition-opacity text-left"
                  >
                    <span className="tracking-tight">{item.title}</span>
                    <span className="text-[8px] font-mono opacity-40">{isOpen ? '−' : '+'}</span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-700 cubic-bezier(0.16,1,0.3,1) ${isOpen ? 'max-h-60 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="pl-4 border-l border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] md:text-[11px] font-light text-[#595f72] dark:text-zinc-400 font-serif leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer: Bottom Anchor Reveal */}
        <div
          className={`mt-auto flex items-end justify-between pt-8 border-t border-zinc-100 dark:border-zinc-900 transition-all duration-[1200ms] delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="space-y-2">
            <span className="block text-[7px] md:text-[8px] uppercase tracking-[0.4em] text-[#595f72] font-serif font-bold opacity-60">
              Price
            </span>
            <p className="text-[14px] md:text-[16px] font-serif tracking-tighter text-[#251101] dark:text-white tabular-nums leading-none">
              PHP {service.price?.toLocaleString() || '0'}
            </p>
          </div>
          <Link
            href={`/booking?serviceId=${service.id}`}
            className="group/book flex items-center gap-3 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] transition-all hover:opacity-50 pb-1 font-serif"
          >
            <span>Book now</span>
            <ArrowUpRightIcon className="w-3 h-3 text-[#251101] dark:text-white transition-transform duration-500 group-hover/book:translate-x-1 group-hover/book:-translate-y-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENT: SLIDER ---
const ServiceSlider = ({ images }: { images: any[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  return (
    <div
      className="relative h-[450px] w-full overflow-hidden cursor-grab active:cursor-grabbing group/slider bg-white dark:bg-black"
      ref={emblaRef}
    >
      <div className="flex h-full">
        {images.map((item, index) => (
          <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full">
            <Image
              src={item.image?.url || item.url || ''}
              alt="Service"
              fill
              className="object-cover transition-transform duration-[2000ms] cubic-bezier(0.16, 1, 0.3, 1) group-hover/slider:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-[1px] transition-all duration-700 ${i === selectedIndex ? 'w-12 bg-zinc-800 dark:bg-white' : 'w-4 bg-zinc-200 dark:bg-white/20'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// --- MAIN COMPONENT ---
export default function Services() {
  const [services, setServices] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsOpenId, setDetailsOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/services?limit=100')
        const data = await response.json()
        setServices(data.docs || [])
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  if (loading)
    return (
      <div className="bg-white dark:bg-[#050505] py-40 flex items-center justify-center">
        <span className="text-zinc-400 uppercase tracking-[0.5em] text-[8px] font-serif animate-pulse">
          Loading ...
        </span>
      </div>
    )

  return (
    <section
      id="services"
      className="bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto border-x border-zinc-100 dark:border-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-900">
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
