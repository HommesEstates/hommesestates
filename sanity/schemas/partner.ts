import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'partner',
  title: 'Partner Logo',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'url', type: 'url' }),
    defineField({ name: 'logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', type: 'number' }),
  ],
})
