import { revalidatePage } from '@/hooks/revalidationPage'
import { sendConfirmationEmail } from '@/hooks/sendConfirmation'
import { CollectionConfig } from 'payload'

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  hooks: {
    afterChange: [revalidatePage, sendConfirmationEmail],
  },
  admin: {
    useAsTitle: 'surname',
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'surname',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
        {
          name: 'phone',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      admin: {
        allowCreate: false,
      },
    },
    {
      name: 'appointmentDate',
      type: 'date',
      label: 'Start Time',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'specialist',
      type: 'relationship',
      relationTo: 'specialists',
      required: false,
      admin: {
        position: 'sidebar',
        description:
          'Leave empty for auto-capacity check. Assign a specialist manually for analytics tracking.',
      },
    },
    {
      name: 'endDateTime',
      type: 'date',
      label: 'Calculated End Time',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Calculated based on Service duration + clinical buffer.',
      },
    },
    {
      name: 'specialistNotes',
      type: 'textarea',
      admin: {
        description: 'Internal clinical notes added by the specialist after the visit.',
        position: 'sidebar',
      },
      access: {
        read: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'bookingGroupId',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'isGuest',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'emailStatus',
      type: 'group',
      admin: { hidden: true },
      fields: [
        { name: 'confirmationSent', type: 'checkbox', defaultValue: false },
        { name: 'reminder24hSent', type: 'checkbox', defaultValue: false },
        { name: 'reminder2hSent', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}
