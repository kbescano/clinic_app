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
      <div className="w-full h-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-[8px] uppercase tracking-[0.4em] text-zinc-400 font-serif italic">
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
      <div className="bg-white dark:bg-[#050505] py-60 text-center flex items-center justify-center">
        <span className="text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.5em] text-[9px] font-serif italic animate-pulse">
          Loading ...
        </span>
      </div>
    )

  return (
    <section
      id="services"
      className="bg-white dark:bg-[#050505] pt-24 md:pt-32 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-100 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto border-x border-zinc-100 dark:border-zinc-900">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-2 bg-white dark:bg-black border-y border-zinc-100 dark:border-zinc-900">
            {services.map((service) => (
              <div key={service.id} className="flex flex-col bg-white dark:bg-black group h-full">
                <div className="relative overflow-hidden grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000">
                  {service.images && service.images.length > 0 ? (
                    <ServiceSlider images={service.images} />
                  ) : (
                    <div className="h-[450px] w-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-[8px] uppercase tracking-[0.4em] text-zinc-400 font-serif italic">
                      Media Offline
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-grow p-8 md:p-12">
                  <div className="mb-10">
                    <h3 className="text-[15px] md:text-[14px] font-normal tracking-[0.01em] font-serif text-[#251101] dark:text-zinc-100 mb-6 leading-tight">
                      {service.title}
                    </h3>

                    <div className="relative">
                      <p
                        className={`text-[13px] md:text-[12px] font-light text-[#595f72] dark:text-zinc-400 leading-[1.7] tracking-wide font-serif ${
                          expandedId === service.id ? 'line-clamp-none' : 'line-clamp-3'
                        }`}
                      >
                        {service.description}
                      </p>
                      {service.description?.length > 80 && (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === service.id ? null : service.id)
                          }
                          className="mt-4 text-[10px] font-light text-[#595f72] dark:text-zinc-200 font-serif underline underline-offset-[4px] decoration-zinc-200 dark:decoration-zinc-800 hover:decoration-zinc-800 dark:hover:decoration-zinc-200 transition-colors"
                        >
                          {expandedId === service.id ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>

                  {service.details && service.details.length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-900 mb-10">
                      {service.details.map((item: any, idx: number) => {
                        const uniqueDetailId = `${service.id}-${idx}`
                        const isOpen = detailsOpenId === uniqueDetailId

                        return (
                          <div
                            key={idx}
                            className="border-b border-zinc-100 dark:border-zinc-900 last:border-none"
                          >
                            <button
                              onClick={() => setDetailsOpenId(isOpen ? null : uniqueDetailId)}
                              className="w-full flex items-center justify-between py-5 text-[13px] font-light text-[#251101] dark:text-zinc-200 font-serif hover:opacity-60 transition-opacity text-left"
                            >
                              <span>{item.title}</span>
                              <div className="relative w-3 h-3 flex items-center justify-center">
                                <div className="absolute w-3 h-[1px] bg-[#251101]" />
                                <div
                                  className={`absolute w-[1px] h-3 bg-[#251101] transition-transform duration-500 ${isOpen ? 'rotate-90 scale-y-0' : ''}`}
                                />
                              </div>
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-700 ease-in-out ${
                                isOpen ? 'max-h-[1000px] opacity-100 pb-8' : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="pl-0 border-l border-zinc-900 dark:border-zinc-100 ml-0 pl-4">
                                <p className="text-[12px] font-light text-[#595f72] dark:text-zinc-400 tracking-normal whitespace-pre-line font-serif leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-auto flex items-end justify-between pt-8 border-t border-[#595f72] dark:border-white">
                    <div className="space-y-1">
                      <span className="block text-[7px] uppercase tracking-[0.5em] text-[#595f72] font-serif font-bold">
                        Price
                      </span>
                      <p className="text-[13px] font-light tracking-tighter text-[#251101] dark:text-white tabular-nums font-serif">
                        PHP {service.price?.toLocaleString() || '0'}
                      </p>
                    </div>

                    <Link
                      href={`/booking?serviceId=${service.id}`}
                      className="group/book flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] transition-all hover:opacity-50 pb-1 font-serif"
                    >
                      <span>Book now</span>
                      <ArrowUpRightIcon className="w-3 h-3 text-[#251101] dark:text-white transition-transform group-hover/book:translate-x-1 group-hover/book:-translate-y-1" />
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
