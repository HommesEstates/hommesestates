import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'sections', type: 'array', of: [{ type: 'section' }], validation: (r) => r.max(40) }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
})
