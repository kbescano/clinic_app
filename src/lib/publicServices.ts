import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Media } from '@/payload-types'

export interface PublicService {
  id: number
  title: string
  description: string
  price: number
  images: { url: string }[]
  details: { title: string; description: string }[]
}

/**
 * Services as the public site shows them, trimmed to what the browser needs. Fetched on the server
 * so the page arrives complete instead of building itself after a client-side request.
 */
export async function getPublicServices(): Promise<PublicService[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'services', limit: 100, depth: 1 })

  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description ?? '',
    price: doc.price ?? 0,
    images: (doc.images ?? []).flatMap((item) => {
      const media = item.image as number | Media
      return typeof media === 'object' && media?.url ? [{ url: media.url }] : []
    }),
    details: (doc.details ?? []).map((d) => ({ title: d.title, description: d.description ?? '' })),
  }))
}
