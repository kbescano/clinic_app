import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudinaryStorage } from 'payload-cloudinary' // 1. Import the storage plugin
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { Users } from './collections/Users'
import { Appointments } from './collections/Appointments'
import { Services } from './collections/Services'
import { Media } from './collections/Media'
import { Specialists } from './collections/Specialist'
import { ContactConfig } from './globals/ContactConfig'
import { ColorConfig } from './globals/ColorConfig'
import { HeaderConfig } from './globals/GlobalConfig'
import { BookingConfig } from './globals/BookingConfig'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  sharp,
  collections: [Users, Appointments, Services, Media, Specialists],
  globals: [ContactConfig, ColorConfig, HeaderConfig, BookingConfig],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  // 2. Add the Uploadthing Plugin
  plugins: [
    cloudinaryStorage({
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || '',
      },
      collections: {
        media: true, // This matches your 'media' slug
      },
    }),
  ],
  routes: {
    admin: '/dashboard-secret-portal',
  },
  email: nodemailerAdapter({
    defaultFromAddress: process.env.FROM_EMAIL || 'onboarding@resend.dev',
    defaultFromName: 'Clinic Admin',
    // The transportOptions now live inside the adapter function
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
})
