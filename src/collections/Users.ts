import type { CollectionConfig, Where } from 'payload'
import { getPasswordResetHtml, getPasswordResetSubject } from '@/lib/passwordResetEmail'
import { isSuperAdmin, superAdminField, superAdminOnly, tenantIdOf } from '@/access/tenants'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailSubject: () => getPasswordResetSubject(),
      generateEmailHTML: (args) =>
        getPasswordResetHtml({ req: args?.req, token: args?.token, name: args?.user?.name }),
    },
  },
  hooks: {
    // The REST endpoint forwards a client-supplied `expiration`, which would let anyone request a
    // long-lived reset link. Always use the default (1 hour).
    beforeOperation: [
      ({ args, operation }) => (operation === 'forgotPassword' ? { ...args, expiration: undefined } : args),
    ],
  },
  admin: {
    useAsTitle: 'name',
    // This hides the Users collection from the sidebar for non-admins
    hidden: ({ user }) => user?.role !== 'admin',
  },
  access: {
    // Staff accounts are created, removed and moved between clinics by a super admin.
    create: superAdminOnly,
    delete: superAdminOnly,
    // Staff see the accounts of their own clinic; super admins see everyone.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isSuperAdmin(user)) return true
      const tenant = tenantIdOf(user)
      const self: Where = { id: { equals: user.id } }
      return tenant ? { or: [self, { tenant: { equals: tenant } }] } : self
    },
    // Everyone can edit their own account (name, password); super admins can edit any.
    update: ({ req: { user } }) => {
      if (!user) return false
      return isSuperAdmin(user) ? true : { id: { equals: user.id } }
    },
    // Only admins can access the Admin UI
    admin: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [{ label: 'Admin', value: 'admin' }],
      access: {
        // Prevent anyone from changing a role unless they are a super admin
        update: superAdminField,
      },
    },
    {
      name: 'isSuperAdmin',
      type: 'checkbox',
      label: 'Access to every clinic',
      defaultValue: false,
      access: { create: superAdminField, update: superAdminField },
      admin: {
        position: 'sidebar',
        description: 'Can switch between clinics in the staff portal and manage staff accounts.',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      label: 'Clinic',
      index: true,
      access: { create: superAdminField, update: superAdminField },
      admin: {
        position: 'sidebar',
        allowCreate: false,
        description: 'The clinic this account works in. Its staff portal shows only that clinic.',
        condition: (data) => !data?.isSuperAdmin,
      },
      validate: (value: unknown, { siblingData }: { siblingData: { isSuperAdmin?: boolean | null } }) =>
        value || siblingData?.isSuperAdmin ? true : 'Choose a clinic, or give this account access to every clinic.',
    },
  ],
}
