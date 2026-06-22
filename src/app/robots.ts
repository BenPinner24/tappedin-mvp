import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // keep the app/private areas out of Google
      disallow: [
        '/dashboard', '/billing', '/analytics', '/admin',
        '/login', '/signup', '/forgot-password',
        '/claim/', '/a/', '/success', '/order-confirmed',
        '/api/',
      ],
    },
    sitemap: 'https://tappedin.uk/sitemap.xml',
    host: 'https://tappedin.uk',
  }
}
