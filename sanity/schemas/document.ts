import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'documentAsset',
  title: 'Document Asset',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'file', type: 'file' }),
    defineField({ name: 'description', type: 'text' }),
  ],
})
