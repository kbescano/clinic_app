import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    // This hides the Users collection from the sidebar for non-admins
    hidden: ({ user }) => user?.role !== 'admin',
  },
  access: {
    // Only admins can create new users
    create: ({ req: { user } }) => user?.role === 'admin',
    // Only admins can see the list of all users
    read: ({ req: { user } }) => !!user,
    // Only admins can update user records
    update: ({ req: { user } }) => user?.role === 'admin',
    // Only admins can delete users
    delete: ({ req: { user } }) => user?.role === 'admin',
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
        // Prevent anyone from changing a role unless they are already an admin
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
}
