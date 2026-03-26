import { groq } from 'next-sanity'

export const getSettingsQuery = groq`*[_type == "settings"][0]`

export const listPagesQuery = groq`*[_type == "page"]{_id, title, 'slug': slug.current}`

export const getPageBySlugQuery = groq`
*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  seo,
  sections[]{
    _type,
    heading,
    text,
    ctaText,
    ctaHref,
    media,
    layoutStyle,
    animationStyle,
    dataSource,
    backendPropertyId
  }
}`

export const listPartnersQuery = groq`*[_type == "partner"]|order(order asc){_id, name, url, logo}`

export const listTestimonialsQuery = groq`*[_type == "testimonial"]|order(order asc){_id, name, role, quote, avatar}`

export const pagesCountQuery = groq`count(*[_type == "page"])`

export const recentEditsQuery = groq`
*[_type in ["page","partner","testimonial","settings"]] | order(_updatedAt desc) [0...10]{
  _id,
  _type,
  title,
  'slug': select(defined(slug.current) => slug.current, null),
  _updatedAt
}`
