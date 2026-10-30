import { useEffect, useRef, useState } from 'react'
import { clipUrl, prefersSmallVideo, type Clip } from '@/lib/media'

/**
 * A background clip that plays only while it is the visible slide, picks 540p or 1080p for the
 * device, fades in once it can play, and reports readiness so a slider never shows an empty slide.
 */
export default function SlideVideo({
  clip,
  active,
  still,
  onReady,
  className = '',
}: {
  clip: Clip
  active: boolean
  still: boolean
  onReady?: () => void
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string>()
  const [loaded, setLoaded] = useState(false)

  // Chosen after mount so server-rendered and client markup always match.
  useEffect(() => {
    setSrc(clipUrl(clip, prefersSmallVideo() ? 'sd_960_540' : 'hd_1920_1080'))
  }, [clip])

  useEffect(() => {
    const video = ref.current
    if (!video || !src) return
    video.muted = true
    if (still) {
      video.pause()
      return
    }
    if (active) {
      video.play().catch(() => {})
      return
    }
    // The outgoing clip keeps running just long enough to finish its cross-fade.
    const timer = window.setTimeout(() => video.pause(), 2200)
    return () => window.clearTimeout(timer)
  }, [active, still, src])

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="auto"
      onCanPlay={() => {
        setLoaded(true)
        onReady?.()
      }}
      className={`h-full w-full object-cover transition-opacity duration-[1600ms] ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
