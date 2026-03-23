'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline'
import FadeIn from './FadeIn'

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
      className="relative h-[450px] w-full overflow-hidden cursor-grab active:cursor-grabbing group/slider"
      ref={emblaRef}
    >
      <div className="flex h-full">
        {images.map((item, index) => {
          const imgUrl = item.image?.url || item.url || ''
          return (
            <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full">
              <Image
                src={imgUrl}
                alt="Service"
                fill
                priority={index === 0}
                className="object-cover transition-transform duration-700 group-hover/slider:scale-105"
              />
            </div>
          )
        })}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white/70 stroke-[1px]" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="w-5 h-5 text-white/70 stroke-[1px]" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-[1px] transition-all duration-500 ${
                i === selectedIndex ? 'w-8 bg-white' : 'w-3 bg-white/20'
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
      <div className="bg-white dark:bg-black py-32 text-center">
        <span className="text-zinc-800 dark:text-white uppercase tracking-[0.4em] text-[9px] animate-pulse">
          Loading...
        </span>
      </div>
    )

  return (
    <section
      id="services"
      className="bg-white dark:bg-black pb-4 text-black dark:text-white border-b border-zinc-100 dark:border-zinc-900"
    >
      <div className="max-w-7xl mx-auto px-6 overflow-x-hidden">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4">
            {services.map((service) => (
              <div key={service.id} className="flex flex-col group h-full">
                <div className="relative -mx-6 md:-mx-0 overflow-hidden border-y md:border border-zinc-100 dark:border-zinc-800">
                  {service.images && service.images.length > 0 ? (
                    <ServiceSlider images={service.images} />
                  ) : (
                    <div className="h-[450px] w-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-[9px] uppercase tracking-widest text-zinc-300">
                      Media Offline
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-grow">
                  <div className="pt-8 pb-4">
                    <h3 className="text-[13px] font-medium uppercase tracking-[0.15em] mb-3">
                      {service.title}
                    </h3>

                    <div className="relative">
                      <p
                        className={`text-[12px] font-light text-zinc-500 dark:text-zinc-400 leading-relaxed ${
                          expandedId === service.id ? 'line-clamp-none' : 'line-clamp-2'
                        }`}
                      >
                        {service.description}
                      </p>
                      {service.description?.length > 80 && (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === service.id ? null : service.id)
                          }
                          className="mt-2 text-[9px] tracking-widest text-black dark:text-white hover:text-zinc-400 transition-colors underline underline-offset-4"
                        >
                          {expandedId === service.id ? 'less' : 'more'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* MULTIPLE DETAILS ACCORDION - Positioned to flow into footer */}
                  {service.details && service.details.length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800">
                      {service.details.map((item: any, idx: number) => {
                        const uniqueDetailId = `${service.id}-${idx}`
                        const isOpen = detailsOpenId === uniqueDetailId

                        return (
                          <div
                            key={idx}
                            className="border-b border-zinc-100 dark:border-zinc-800 last:border-none"
                          >
                            <button
                              onClick={() => setDetailsOpenId(isOpen ? null : uniqueDetailId)}
                              className="w-full flex items-center justify-between py-4 text-[9px] uppercase tracking-[0.2em] text-black dark:text-white hover:opacity-70 transition-opacity group/btn text-left"
                            >
                              <span>{item.title}</span>
                              {isOpen ? (
                                <MinusIcon className="w-3 h-3" />
                              ) : (
                                <PlusIcon className="w-3 h-3" />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                isOpen ? 'max-h-[1000px] opacity-100 pb-6' : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="space-y-6 border-l border-zinc-100 dark:border-zinc-700 pl-4">
                                <div className="space-y-1">
                                  <p className="text-[11px] font-light text-black dark:text-white leading-relaxed whitespace-pre-line">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* PRICE & BOOKING - Added mt-auto and top border for spacing clarity */}
                  <div className="mt-auto flex items-end justify-between py-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] uppercase tracking-[0.3em] text-zinc-400 font-bold">
                        Price
                      </span>
                      <p className="text-[11px] font-light tracking-widest text-black dark:text-white">
                        PHP {service.price?.toLocaleString() || '0'}
                      </p>
                    </div>

                    <Link
                      href={`/booking?serviceId=${service.id}`}
                      className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
                    >
                      <span>Book now</span>
                      <ArrowUpRightIcon className="w-2.5 h-2.5 text-zinc-400" />
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
