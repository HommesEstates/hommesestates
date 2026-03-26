import Link from 'next/link'

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-text/60 dark:text-white/60">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-accent transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-text dark:text-white">{item.label}</span>
              )}
              {!isLast && <span className="opacity-60">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
