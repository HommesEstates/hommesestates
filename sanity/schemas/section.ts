import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'section',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'text', type: 'text' }),
    defineField({ name: 'ctaText', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string' }),
    defineField({ name: 'media', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'layoutStyle', type: 'string', options: { list: ['hero', 'grid', 'gallery', 'text-left', 'text-right', 'split'] } }),
    defineField({ name: 'animationStyle', type: 'string', options: { list: ['none', 'fade', 'slide', 'zoom'] }, initialValue: 'none' }),
    defineField({ name: 'dataSource', type: 'string', title: 'Data Source', options: { list: ['none', 'properties', 'suites'] }, initialValue: 'none' }),
    defineField({ name: 'backendPropertyId', type: 'number', title: 'Backend Property ID', description: 'Required when dataSource = suites' }),
  ],
})
