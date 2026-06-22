import type { MetadataRoute } from 'next'
import { articles } from './insights/articles'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://tappedin.uk'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`,         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/pricing`,  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/demo`,     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/insights`, lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
  ]

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/insights/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...articlePages]
}
