import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  serverExternalPackages: ['payload'],
  // The skin clinic's site used to live at the root; old links and bookmarks land on its new home.
  async redirects() {
    return [
      ...['/booking', '/services', '/appointments', '/profile'].flatMap((path) => [
        { source: path, destination: `/skin${path}`, permanent: false },
        { source: `${path}/:rest*`, destination: `/skin${path}/:rest*`, permanent: false },
      ]),
      // The dental design lists its treatments on the homepage.
      { source: '/dental/services', destination: '/dental#treatments', permanent: false },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        // Add your Vercel domain here once live
        protocol: 'https',
        hostname: 'clinic-app-sp.vercel.app',
      },
    ],
    unoptimized: true,
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
