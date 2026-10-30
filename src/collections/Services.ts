import { CollectionConfig } from 'payload'
import { revalidatePage } from '../hooks/revalidationPage'
import { isStaff, ownClinic, publicOrOwnClinic } from '@/access/tenants'
import { tenantField } from '@/fields/tenant'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [revalidatePage],
  },
  access: {
    read: publicOrOwnClinic,
    create: isStaff,
    update: ownClinic,
    delete: ownClinic,
  },
  fields: [
    tenantField(),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'images',
      type: 'array',
      label: 'Service Images',
      admin: { description: 'Shown on the website. Without images the dental design uses its own photography.' },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'details',
      type: 'array',
      label: 'Service Details Sections',
      // We removed the admin block here to stop the TypeScript errors
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Section Title',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Section Description',
          required: true,
        },
      ],
    },
    {
      name: 'duration',
      type: 'select',
      label: 'Service Duration (Minutes)',
      defaultValue: '60',
      options: [
        { label: '30 Minutes', value: '30' },
        { label: '60 Minutes', value: '60' },
        { label: '90 Minutes', value: '90' },
      ],
      required: true,
    },
  ],
}
