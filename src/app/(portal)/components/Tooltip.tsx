'use client'

import React, { cloneElement, isValidElement, useId } from 'react'

const SIDE = { bottom: 'top-full mt-2', top: 'bottom-full mb-2' } as const
const ALIGN = { center: 'left-1/2 -translate-x-1/2', start: 'left-0', end: 'right-0' } as const

/**
 * A short explanation shown when the wrapped control is hovered or focused with the keyboard.
 * Screen readers get it too (aria-describedby). Touch screens can't hover, so the control's own
 * label still has to make sense without it.
 */
export default function Tooltip({
  text,
  children,
  side = 'bottom',
  align = 'center',
}: {
  text: string
  children: React.ReactElement<{ 'aria-describedby'?: string }>
  side?: keyof typeof SIDE
  /** Use start/end near the screen edges so the bubble stays on screen. */
  align?: keyof typeof ALIGN
}) {
  const id = useId()
  return (
    <span className="group/tip relative inline-flex">
      {isValidElement(children) ? cloneElement(children, { 'aria-describedby': id }) : children}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-[200] w-max max-w-[17rem] rounded-xl bg-zinc-900 px-3.5 py-2.5 text-left font-sans text-[12px] font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:opacity-100 dark:bg-zinc-100 dark:text-zinc-900 ${SIDE[side]} ${ALIGN[align]}`}
      >
        {text}
      </span>
    </span>
  )
}
