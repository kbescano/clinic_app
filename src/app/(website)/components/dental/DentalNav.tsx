'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSmoothScroll } from '@/components/shared/SmoothScroll'
import { useClinic } from '../ClinicContext'
import { btnPrimary, ToothMark } from './ui'

const LINKS = [
  { name: 'Treatments', target: '#treatments' },
  { name: 'Smile in 3D', target: '#smile' },
  { name: 'Team', target: '#team' },
  { name: 'Visit', target: '#visit' },
]

export default function DentalNav() {
  const { scrollTo } = useSmoothScroll()
  const { name, href } = useClinic()
  const pathname = usePathname()
  const router = useRouter()
  // On the homepage the nav floats over the hero; on inner pages it is solid from the start.
  const onHome = pathname === href()
  const [scrolledPast, setScrolled] = useState(false)
  const scrolled = scrolledPast || !onHome
  const [first, ...rest] = name.split(' ')
  const goTo = (target: string) => (onHome ? scrollTo(target, { offset: -90 }) : router.push(`${href()}${target}`))
  const [hidden, setHidden] = useState(false)
  const last = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setHidden(y > last.current && y > 160)
      last.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[100] px-2 pt-2 transition-transform duration-500 ease-out md:px-3 md:pt-3 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div
        className={`mx-auto flex h-16 items-center justify-between rounded-xl px-4 transition-colors duration-500 md:h-[72px] md:px-6 ${
          scrolled ? 'bg-paper/85 text-ink shadow-[0_1px_0_#e8e4e1,0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md' : 'bg-transparent text-white'
        }`}
      >
        <Link
          href={href()}
          onClick={(e) => {
            if (!onHome) return
            e.preventDefault()
            scrollTo(0)
          }}
          className="flex items-center gap-2.5"
          aria-label={`${name}, home`}
        >
          <ToothMark className="h-6 w-5" />
          <span className="text-2xl font-semibold tracking-[-0.04em]">{first}</span>
          {rest.length > 0 && <span className="mt-1 hidden text-xs opacity-70 sm:block">{rest.join(' ')}</span>}
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <button
              key={l.target}
              onClick={() => goTo(l.target)}
              className={`rounded-[4px] px-3.5 py-2 text-[15px] transition-colors ${scrolled ? 'hover:bg-sand' : 'hover:bg-white/15'}`}
            >
              {l.name}
            </button>
          ))}
        </div>

        <Link href={href('/booking')} className={`${btnPrimary} px-4 py-2.5 md:px-5 md:py-3`}>
          Book a visit
        </Link>
      </div>
    </nav>
  )
}
