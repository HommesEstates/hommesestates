"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
const items = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/media', label: 'Media Library' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/partners', label: 'Partners' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/design', label: 'Design' },
  { href: '/admin/settings', label: 'Settings' },
]
export default function Sidebar() {
  const pathname = usePathname()
  return (
    <div className="w-64 border-r h-screen sticky top-0 hidden md:block">
      <div className="p-4 font-heading font-bold">Admin</div>
      <nav className="space-y-1 px-2">
        {items.map(i => (
          <Link key={i.href} href={i.href} className={`block px-3 py-2 rounded ${pathname === i.href ? 'bg-accent text-white' : 'hover:bg-muted'}`}>{i.label}</Link>
        ))}
      </nav>
    </div>
  )
}
