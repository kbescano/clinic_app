'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import FadeIn from './FadeIn'

// --- SUB-COMPONENT: SLIDE ITEM ---
const SlideItem = ({ url, priority }: { url: string; priority: boolean }) => {
  const [error, setError] = useState(false)
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const finalImageUrl = url.startsWith('http') ? url : url ? `${serverUrl}${url}` : ''

  if (error || !finalImageUrl) {
    return (
      <div className="w-full h-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-[8px] uppercase tracking-[0.4em] text-zinc-400 font-serif ">
        Media Unavailable
      </div>
    )
  }

  return (
    <Image
      src={finalImageUrl}
      alt="Service"
      fill
      priority={priority}
      onError={() => setError(true)}
      className="object-cover transition-transform duration-1000 group-hover/slider:scale-105"
      sizes="(max-width: 768px) 100vw, 33vw"
    />
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

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  return (
    <div
      className="relative h-[450px] w-full overflow-hidden cursor-grab active:cursor-grabbing group/slider bg-white dark:bg-black"
      ref={emblaRef}
    >
      <div className="flex h-full">
        {images.map((item, index) => (
          <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full">
            <SlideItem url={item.image?.url || item.url || ''} priority={index < 3} />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-500 bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-full"
          >
            <ChevronLeftIcon className="w-4 h-4 text-zinc-800 dark:text-white stroke-[1.5px]" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-500 bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-full"
          >
            <ChevronRightIcon className="w-4 h-4 text-zinc-800 dark:text-white stroke-[1.5px]" />
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
                i === selectedIndex
                  ? 'w-12 bg-zinc-800 dark:bg-white'
                  : 'w-4 bg-zinc-200 dark:bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Services() {
  const [services, setServices] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailsOpenId, setDetailsOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawLine, setDrawLine] = useState(false)

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
        // Trigger drawline once loading is complete
        setTimeout(() => setDrawLine(true), 500)
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
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-900">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-col bg-white dark:bg-[#050505] group h-full"
              >
                <div className="relative overflow-hidden grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000">
                  {service.images && service.images.length > 0 ? (
                    <ServiceSlider images={service.images} />
                  ) : (
                    <div className="h-[450px] w-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-[8px] uppercase tracking-[0.4em] text-zinc-400 font-serif">
                      Media Offline
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-grow p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="text-[13px] md:text-[12px] font-normal tracking-[0.01em] font-serif text-[#251101] dark:text-zinc-100 mb-4 leading-tight">
                      {service.title}
                    </h3>

                    <div className="relative">
                      <p
                        className={`text-[11px] font-light text-[#595f72] dark:text-zinc-400 leading-relaxed tracking-tight font-serif ${
                          expandedId === service.id ? '' : 'line-clamp-2'
                        }`}
                      >
                        {service.description}
                      </p>
                      {service.description?.length > 80 && (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === service.id ? null : service.id)
                          }
                          className="mt-2 text-[10px] font-light text-[#595f72] dark:text-zinc-200 font-serif underline underline-offset-[4px] decoration-zinc-200 dark:decoration-zinc-800 transition-colors"
                        >
                          {expandedId === service.id ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>

                  {service.details && service.details.length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-900/50 mb-6">
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
                              className="w-full flex items-center justify-between py-4 text-[11px] font-light text-[#251101] dark:text-zinc-200 font-serif hover:opacity-60 transition-opacity text-left"
                            >
                              <span>{item.title}</span>
                              <span className="text-[8px] font-mono opacity-40">
                                {isOpen ? '−' : '+'}
                              </span>
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                isOpen ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="pl-3 border-l border-zinc-100 dark:border-zinc-800">
                                <p className="text-[10px] font-light text-[#595f72] dark:text-zinc-400 font-serif leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-auto flex items-end justify-between pt-6 border-t border-zinc-100 dark:border-zinc-900">
                    <div className="space-y-1">
                      <span className="block text-[7px] uppercase tracking-[0.5em] text-[#595f72] font-serif font-bold">
                        Price
                      </span>
                      <p className="text-[12px] font-serif tracking-tight text-[#251101] dark:text-white tabular-nums">
                        PHP {service.price?.toLocaleString() || '0'}
                      </p>
                    </div>

                    <Link
                      href={`/booking?serviceId=${service.id}`}
                      className="group/book flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:opacity-50 pb-1 font-serif"
                    >
                      <span>Book now</span>
                      <ArrowUpRightIcon className="w-2.5 h-2.5 text-[#251101] dark:text-white transition-transform group-hover/book:translate-x-0.5 group-hover/book:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
