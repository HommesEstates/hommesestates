import React from 'react'
import { notFound } from 'next/navigation'
import { sanityClient } from '@/lib/sanity.config'
import { getPageBySlugQuery } from '@/lib/queries'
import SectionRenderer from '@/components/cms/SectionRenderer'
import { publicApi } from '@/lib/backend'

async function enrichSections(sections: any[]): Promise<any[]> {
  const out: any[] = []
  for (const s of sections || []) {
    const copy: any = { ...s }
    try {
      if (s?.dataSource === 'properties') {
        const props = await publicApi.listProperties()
        copy.items = (props || []).map((p: any) => ({
          id: p.id,
          title: p.name || p.title || `Property #${p.id}`,
          subtitle: p.code || undefined,
          href: `/properties/${p.id}`,
        }))
      }
      if (s?.dataSource === 'suites' && s?.backendPropertyId) {
        const suites = await publicApi.listPropertySuites(Number(s.backendPropertyId))
        copy.items = (suites || []).map((it: any) => ({
          id: it.id,
          title: it.name || it.number || `Suite #${it.id}`,
          subtitle: it.number || undefined,
          href: `/properties/${it.property_id || s.backendPropertyId}/suites/${it.id}`,
        }))
      }
    } catch {
      // ignore enrichment errors; leave items undefined
    }
    out.push(copy)
  }
  return out
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await sanityClient.fetch(getPageBySlugQuery, { slug })
  if (!page) return notFound()
  const sections = await enrichSections(page.sections || [])
  return (
    <main className="section-container">
      <SectionRenderer sections={sections} />
    </main>
  )
}
