import { GlobalConfig } from 'payload'

export const BookingConfig: GlobalConfig = {
  slug: 'booking-config',
  label: 'Booking Settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'openingTime',
          type: 'text',
          defaultValue: '09:00',
          admin: { placeholder: 'HH:mm (e.g., 09:00)' },
          required: true,
        },
        {
          name: 'closingTime',
          type: 'text',
          defaultValue: '17:00',
          admin: { placeholder: 'HH:mm (e.g., 17:00)' },
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'slotInterval',
          type: 'select',
          defaultValue: '30',
          options: [
            { label: '30 Minutes', value: '30' },
            { label: '60 Minutes', value: '60' },
          ],
          required: true,
        },
        {
          name: 'specialistCapacity',
          type: 'number',
          defaultValue: 1,
          label: 'Available Specialist Count',
          required: true,
        },
      ],
    },
    {
      name: 'lunchBreak',
      type: 'group',
      label: 'Lunch Break Interval',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'start',
              type: 'text',
              defaultValue: '12:00',
              required: true,
            },
            {
              name: 'end',
              type: 'text',
              defaultValue: '13:00',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
