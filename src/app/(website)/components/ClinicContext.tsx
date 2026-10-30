'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { clinicPath, type ClinicBrand } from '@/lib/clinics'

const ClinicContext = createContext<ClinicBrand | null>(null)

/** Tells every client component on a clinic's site which clinic it is showing. */
export function ClinicProvider({ brand, children }: { brand: ClinicBrand; children: ReactNode }) {
  return <ClinicContext.Provider value={brand}>{children}</ClinicContext.Provider>
}

/** The current clinic, plus `href()` for links that stay inside its site. */
export function useClinic() {
  const brand = useContext(ClinicContext)
  if (!brand) throw new Error('useClinic must be used inside a clinic site')
  return useMemo(() => ({ ...brand, href: (path = '') => clinicPath(brand.slug, path) }), [brand])
}
