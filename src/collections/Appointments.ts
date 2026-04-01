import { revalidatePage } from '@/hooks/revalidationPage'
import { sendConfirmationEmail } from '@/hooks/sendConfirmation'
import { CollectionConfig } from 'payload'

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  hooks: {
    afterChange: [revalidatePage, sendConfirmationEmail],
  },
  admin: {
    useAsTitle: 'surname', // Displays the Surname in the Admin list
  },
  access: {
    create: () => true, // Allows anyone to book an appointment
    read: ({ req: { user } }) => !!user, // Only admins can see the list
    update: ({ req: { user } }) => !!user, // Only admins can confirm/cancel
    delete: ({ req: { user } }) => !!user, // Only admins can delete
  },
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
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      admin: {
        allowCreate: false, // Prevents creating services from the appointment form
      },
    },
    {
      name: 'appointmentDate',
      type: 'date',
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
      name: 'specialistNotes',
      type: 'textarea', // Textarea is better for longer medical observations
      admin: {
        description: 'Internal clinical notes added by the specialist after the visit.',
        position: 'sidebar', // Keeps the main form tidy
      },
      access: {
        // Patients should never see the internal clinical notes in the admin panel
        read: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'bookingGroupId',
      type: 'text',
      index: true, // Crucial for fast lookups
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
