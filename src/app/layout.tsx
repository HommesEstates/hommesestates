import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import KeycloakProvider from '@/components/providers/KeycloakProvider'
import { EditModeProvider } from '@/components/providers/EditModeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Hommes Estates & Facilities Management | Luxury Real Estate & Investment',
  description: 'Invest in Excellence. Own with Confidence. Premium real estate purchases, strategic investment properties, and comprehensive facility management services.',
  keywords: ['luxury real estate', 'property investment', 'estate management', 'executive suites', 'commercial properties'],
  authors: [{ name: 'Hommes Estates' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hommesestates.com',
    siteName: 'Hommes Estates & Facilities Management',
    title: 'Hommes Estates | Luxury Real Estate & Investment',
    description: 'Premium real estate purchases and strategic investment properties',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hommes Estates | Luxury Real Estate & Investment',
    description: 'Premium real estate purchases and strategic investment properties',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=window.matchMedia('(prefers-color-scheme: dark)');if(m.matches){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <KeycloakProvider>
          <ThemeProvider>
            <AuthProvider>
              <EditModeProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--toast-bg)',
                      color: 'var(--toast-color)',
                    },
                  }}
                />
              </EditModeProvider>
            </AuthProvider>
          </ThemeProvider>
        </KeycloakProvider>
      </body>
    </html>
  )
}
