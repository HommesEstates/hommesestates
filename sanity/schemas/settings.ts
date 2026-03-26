import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'settings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'siteName', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'social', type: 'object', fields: [
      defineField({ name: 'twitter', type: 'url' }),
      defineField({ name: 'facebook', type: 'url' }),
      defineField({ name: 'linkedin', type: 'url' }),
      defineField({ name: 'instagram', type: 'url' }),
    ] }),
    defineField({ name: 'footerText', type: 'text' }),
    defineField({ name: 'apiKeys', type: 'object', fields: [
      defineField({ name: 'maps', type: 'string' }),
      defineField({ name: 'analytics', type: 'string' }),
    ] }),
  ],
})
