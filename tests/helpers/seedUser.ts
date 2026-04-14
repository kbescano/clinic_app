import { getPayload, Where } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  const query: Where = {
    email: {
      equals: testUser.email,
    },
  }

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: query,
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    // Inlining the object or using 'as const' on the variable
    // helps TS verify that all required fields are present.
    data: {
      email: testUser.email,
      password: testUser.password,
      name: 'Test User',
      role: 'admin',
    },
    overrideAccess: true,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  const query: Where = {
    email: {
      equals: testUser.email,
    },
  }

  await payload.delete({
    collection: 'users',
    where: query,
  })
}
