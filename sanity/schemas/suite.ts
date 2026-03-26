import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'suite',
  title: 'Suite (Ref)',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'backendSuiteId', type: 'number', validation: (r) => r.required() }),
    defineField({ name: 'propertyRef', type: 'reference', to: [{ type: 'property' }] }),
    defineField({ name: 'floorplan', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'summary', type: 'text' }),
  ],
})
