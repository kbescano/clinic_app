import { CollectionConfig } from 'payload'
import { revalidatePage } from '../hooks/revalidationPage'
import { isStaff, ownClinic, publicOrOwnClinic } from '@/access/tenants'
import { tenantField } from '@/fields/tenant'

export const Specialists: CollectionConfig = {
  slug: 'specialists',
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    afterChange: [revalidatePage], // This triggers the magic
  },
  access: {
    read: publicOrOwnClinic, // Publicly viewable; staff lists show their own clinic
    create: isStaff,
    update: ownClinic,
    delete: ownClinic,
  },
  fields: [
    tenantField(),
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
      admin: { description: 'Portrait for the website. Without one the dental design uses its own photography.' },
    },
  ],
}
