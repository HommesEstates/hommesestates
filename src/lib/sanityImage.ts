import imageUrlBuilder from '@sanity/image-url'
import { sanityClient } from './sanity.config'

let builder: ReturnType<typeof imageUrlBuilder> | null = null
try {
  const cfg: any = typeof (sanityClient as any).config === 'function' ? (sanityClient as any).config() : {}
  if (cfg?.projectId) {
    builder = imageUrlBuilder(sanityClient as any)
  }
} catch {}

export function urlFor(source: any) {
  try {
    return builder ? builder.image(source) : null
  } catch {
    return null as any
  }
}
