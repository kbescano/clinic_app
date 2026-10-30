import type { CollectionConfig } from 'payload'
import { isSuperAdmin, superAdminField, superAdminOnly, tenantIdOf } from '@/access/tenants'
import { revalidateTenant } from '@/hooks/revalidationPage'

/**
 * One document per clinic. The slug is also the website's URL prefix (/skin, /dental) and picks
 * the homepage design. Branding, contact details and booking rules that used to live in the
 * header, contact and booking globals are per clinic now.
 */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: 'Clinic', plural: 'Clinics' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  hooks: {
    afterChange: [revalidateTenant],
  },
  access: {
    // Names, contact details and opening hours are public: the websites show them. Staff lists show
    // only their own clinic.
    read: ({ req: { user } }) => {
      if (!user || user.collection !== 'users' || isSuperAdmin(user)) return true
      const tenant = tenantIdOf(user)
      return tenant ? { id: { equals: tenant } } : true
    },
    create: superAdminOnly,
    delete: superAdminOnly,
    update: ({ req: { user } }) => {
      if (isSuperAdmin(user)) return true
      const tenant = tenantIdOf(user)
      return tenant ? { id: { equals: tenant } } : false
    },
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'Shown in the site header, footer and emails.' } },
        {
          name: 'slug',
          type: 'select',
          required: true,
          unique: true,
          index: true,
          options: [
            { label: 'Skin care (/skin)', value: 'skin' },
            { label: 'Dental (/dental)', value: 'dental' },
          ],
          access: { update: superAdminField },
          admin: { description: 'Website address and homepage design.' },
        },
      ],
    },
    { name: 'topLabel', type: 'text', label: 'Tagline', admin: { description: 'Small line above the name, e.g. "Curated Care".' } },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'address', type: 'text', required: true, defaultValue: 'Metro Manila, Philippines' },
        {
          type: 'row',
          fields: [
            { name: 'phoneNumber', type: 'text', required: true, defaultValue: '' },
            { name: 'email', type: 'text', required: true, defaultValue: '' },
          ],
        },
        { name: 'officeHours', type: 'text', required: true, defaultValue: 'Mon to Sat, 9:00 AM to 5:00 PM' },
      ],
    },
    {
      name: 'booking',
      type: 'group',
      label: 'Booking rules',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'openingTime', type: 'text', required: true, defaultValue: '09:00', admin: { placeholder: 'HH:mm' } },
            { name: 'closingTime', type: 'text', required: true, defaultValue: '17:00', admin: { placeholder: 'HH:mm' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'slotInterval',
              type: 'select',
              required: true,
              defaultValue: '30',
              options: [
                { label: '30 Minutes', value: '30' },
                { label: '60 Minutes', value: '60' },
              ],
            },
            {
              name: 'specialistCapacity',
              type: 'number',
              required: true,
              defaultValue: 1,
              min: 1,
              label: 'Bookings at the same time',
              admin: { description: 'Chairs or rooms that can be in use at once.' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'lunchStart', type: 'text', required: true, defaultValue: '12:00', label: 'Lunch from' },
            { name: 'lunchEnd', type: 'text', required: true, defaultValue: '13:00', label: 'Lunch until' },
          ],
        },
      ],
    },
  ],
}
