import { CollectionConfig } from 'payload'
import { revalidatePage } from '../hooks/revalidationPage'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [revalidatePage],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
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
      minRows: 1,
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
