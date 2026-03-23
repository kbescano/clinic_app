'use client'

import React, { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'

interface ServiceImage {
  image: {
    url: string
    alt?: string
  }
}

export default function ServiceSlider({ images }: { images: ServiceImage[] }) {
  // 1. Initialize Embla with a loop
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 2. Update dots when slide changes
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
    <div className="relative h-[450px] w-full overflow-hidden group" ref={emblaRef}>
      {/* Slides Container */}
      <div className="flex h-full">
        {images.map((item, index) => (
          <div key={index} className="relative flex-[0_0_100%] min-w-0 h-full">
            <Image
              src={item.image.url}
              alt={item.image.alt || 'Service image'}
              fill
              priority={index === 0}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Dark Overlay for Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />

      {/* Pagination Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                i === selectedIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
