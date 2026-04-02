import { createClient } from '@sanity/client'

const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID) as string | undefined
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production') as string
const apiVersion = (process.env.SANITY_API_VERSION as string) || '2023-01-01'
const token = process.env.SANITY_API_TOKEN

let client: any
if (projectId) {
  client = createClient({ projectId, dataset, apiVersion, useCdn: false, token })
} else {
  client = {
    fetch: async () => null,
  }
}

export const sanityClient = client as any
