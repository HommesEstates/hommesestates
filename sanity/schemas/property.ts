import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'property',
  title: 'Property (Ref)',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'backendPropertyId', type: 'number', validation: (r) => r.required() }),
    defineField({ name: 'heroImage', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'gallery', type: 'array', of: [{ type: 'image' }] }),
    defineField({ name: 'summary', type: 'text' }),
  ],
})
