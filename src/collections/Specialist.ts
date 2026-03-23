import { CollectionConfig } from 'payload'
import { revalidatePage } from '../hooks/revalidationPage'

export const Specialists: CollectionConfig = {
  slug: 'specialists',
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    afterChange: [revalidatePage], // This triggers the magic
  },
  access: {
    read: () => true, // Publicly viewable
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'specialization',
      type: 'text',
      required: true,
      defaultValue: 'Specialist',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}
