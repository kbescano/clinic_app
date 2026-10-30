import { photo, type Clip } from '@/lib/media'

export const heroClips: { clip: Clip; caption: string }[] = [
  { clip: { id: 3762905, fps: 25 }, caption: 'Your smile' },
  { clip: { id: 6755020, fps: 25 }, caption: 'The studio' },
  { clip: { id: 4490356, fps: 25 }, caption: 'Our care team' },
]

export const promises = [
  { title: 'Same-week appointments', body: 'Most first visits are available within days, not weeks.' },
  { title: 'Low-dose digital X-rays', body: 'Clearer images with a fraction of the radiation.' },
  { title: 'Prices agreed up front', body: 'You approve every cost before treatment begins.' },
  { title: 'Gentle options for nervous patients', body: 'Numbing gel, headphones, breaks whenever you want them.' },
]

/** A treatment card, built from the dental clinic's services in the CMS. */
export interface Treatment {
  id: string
  title: string
  blurb: string
  duration: string
  price: string
  image: string
  /** A looping clip instead of the photo. */
  clip?: Clip
}

export interface Dentist {
  id: string
  name: string
  role: string
  bio: string
  image: string
}

// The design's own photography, used whenever a service or dentist has no image in the CMS yet.
// Matched on the service title, so renaming a service in the CMS just falls back to the stock set.
const TREATMENT_VISUALS: Record<string, { image: string; clip?: Clip }> = {
  whitening: { image: photo(6627570), clip: { id: 3762905, fps: 25 } },
  'check-up & cleaning': { image: photo(4269682, 900) },
  'clear aligners': { image: photo(3762453, 900) },
  implants: { image: photo(6502305, 900) },
  veneers: { image: photo(6627572, 900) },
  'emergency care': { image: photo(14624608, 900) },
}
const STOCK_TREATMENTS = Object.values(TREATMENT_VISUALS).map((v) => v.image)

export function treatmentVisual(title: string, index: number, cmsImage?: string) {
  const match = TREATMENT_VISUALS[title.trim().toLowerCase()]
  return {
    image: cmsImage || match?.image || STOCK_TREATMENTS[index % STOCK_TREATMENTS.length],
    clip: cmsImage ? undefined : match?.clip,
  }
}

const PORTRAITS = [photo(31043312, 900), photo(17792882, 900), photo(20596946, 900)]
const BIOS: Record<string, string> = {
  'dr. mara villanueva': 'Fifteen years of making check-ups the least stressful hour of your month.',
  'dr. luis navarro': 'Plans every aligner case in 3D and shows you the result before you commit.',
  'dr. bea castillo': 'Calm hands for the bigger procedures, from extractions to full implant restorations.',
}

export function dentistExtras(name: string, index: number, cmsImage?: string) {
  return {
    image: cmsImage || PORTRAITS[index % PORTRAITS.length],
    bio: BIOS[name.trim().toLowerCase()] ?? 'Explains every step first, and never rushes.',
  }
}

export const stages = [
  {
    title: 'Check-ups & cleaning',
    body: 'A 3D scan maps every surface in minutes, so small problems are caught while they are still small.',
  },
  {
    title: 'Whitening',
    body: 'Years of coffee and tea come off in one visit. You choose the shade; we stop when you are happy.',
  },
  {
    title: 'Clear aligners',
    body: 'Near-invisible trays move teeth a fraction at a time. You see the finished smile before day one.',
  },
  {
    title: 'Implants',
    body: 'A titanium post, an abutment and a custom crown replace a missing tooth for good.',
  },
]

export const reviews = [
  { quote: 'I have avoided dentists for years. They explained every step and I actually left smiling.', name: 'Ana R.', treatment: 'Check-up & cleaning' },
  { quote: 'The 3D preview sold me on aligners. Eight months later it looks exactly like the render.', name: 'Miguel T.', treatment: 'Clear aligners' },
  { quote: 'Booked online at night, seen the next morning for a cracked tooth. Painless and quick.', name: 'Carla D.', treatment: 'Emergency care' },
]
