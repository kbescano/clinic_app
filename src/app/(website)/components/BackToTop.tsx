'use client'

import { useSmoothScroll } from '@/components/shared/SmoothScroll'

export default function BackToTop() {
  const { scrollTo } = useSmoothScroll()
  return (
    <button
      onClick={() => scrollTo(0)}
      className="group flex items-center gap-2 transition-colors hover:text-white"
    >
      Back to top
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="transition-transform duration-300 group-hover:-translate-y-1"
        aria-hidden
      >
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  )
}
