import type { Access, FieldAccess, PayloadRequest } from 'payload'

type RequestUser = PayloadRequest['user']

/**
 * Multi-clinic access. Every clinic (tenant) keeps its own services, specialists, appointments and
 * staff. A staff account belongs to one clinic; a super admin works across all of them.
 */
export const isSuperAdmin = (user: RequestUser): boolean =>
  Boolean(user && user.collection === 'users' && user.isSuperAdmin)

/** The clinic a staff account belongs to, whether the relationship arrived populated or as an id. */
export const tenantIdOf = (user: RequestUser): number | null => {
  if (!user || user.collection !== 'users' || user.tenant == null) return null
  return typeof user.tenant === 'object' ? user.tenant.id : user.tenant
}

export const isStaff: Access = ({ req: { user } }) => Boolean(user && user.collection === 'users')

export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user)

export const superAdminField: FieldAccess = ({ req: { user } }) => isSuperAdmin(user)

/** Row-level security: staff only reach their own clinic's documents. */
export const ownClinic: Access = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (isSuperAdmin(user)) return true
  const tenant = tenantIdOf(user)
  return tenant ? { tenant: { equals: tenant } } : false
}

/**
 * Public collections (services, specialists): anyone may read them, since the websites show them,
 * but a signed-in staff member's lists (admin panel, REST) only show their own clinic.
 */
export const publicOrOwnClinic: Access = ({ req: { user } }) => {
  if (!user || user.collection !== 'users' || isSuperAdmin(user)) return true
  const tenant = tenantIdOf(user)
  return tenant ? { tenant: { equals: tenant } } : true
}
