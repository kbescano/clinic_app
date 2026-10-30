import type { Field } from 'payload'
import { isSuperAdmin, superAdminField, tenantIdOf } from '@/access/tenants'

/**
 * The clinic a document belongs to. Staff never choose it: their own clinic is filled in and
 * enforced on save. Super admins pick it. The column stays nullable in the database so the field
 * could be added to tables that already had rows; `validate` makes it required from here on.
 */
export const tenantField = (): Field => ({
  name: 'tenant',
  type: 'relationship',
  relationTo: 'tenants',
  label: 'Clinic',
  index: true,
  admin: {
    position: 'sidebar',
    allowCreate: false,
  },
  defaultValue: ({ user }) => tenantIdOf(user ?? null) ?? undefined,
  access: {
    update: superAdminField,
  },
  hooks: {
    beforeChange: [
      ({ value, req: { user } }) => (user && !isSuperAdmin(user) ? (tenantIdOf(user) ?? value) : value),
    ],
  },
  validate: (value: unknown) => (value ? true : 'Choose a clinic.'),
})
