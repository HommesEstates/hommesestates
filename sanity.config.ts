import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import schemas from './sanity/schemas'

export default defineConfig({
  name: 'hommes-estates-cms',
  title: 'Hommes Estates CMS',
  projectId: process.env.SANITY_PROJECT_ID as string,
  dataset: (process.env.SANITY_DATASET as string) || 'production',
  basePath: '/studio',
  plugins: [deskTool(), visionTool()],
  schema: {
    types: schemas,
  },
})
