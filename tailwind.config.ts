import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', 'class'],
  theme: {
  	extend: {
  		colors: {
  			bg: 'var(--bg)',
  			surface: 'var(--surface)',
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			text: 'rgb(var(--text-rgb) / <alpha-value>)',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'accent-2': 'rgb(var(--accent-2-rgb) / <alpha-value>)',
  			'accent-dark': 'rgb(var(--accent-dark-rgb) / <alpha-value>)',
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			charcoal: 'var(--charcoal)',
  			border: 'hsl(var(--border))',
  			copper: '#CC5500',
  			ivory: '#FBFAF8',
  			warmgray: '#F5F3EF',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		backgroundImage: {
  			'copper-gradient': 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
  			'metallic-sheen': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
  		},
  		fontFamily: {
  			heading: [
  				'Manrope',
  				'system-ui',
  				'sans-serif'
  			],
  			body: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			accent: [
  				'Montserrat',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			hero: [
  				'clamp(3rem, 8vw, 4rem)',
  				{
  					lineHeight: '1.1',
  					fontWeight: '700'
  				}
  			],
  			h1: [
  				'clamp(2.5rem, 6vw, 3.5rem)',
  				{
  					lineHeight: '1.2',
  					fontWeight: '700'
  				}
  			],
  			h2: [
  				'clamp(2rem, 4vw, 2.5rem)',
  				{
  					lineHeight: '1.3',
  					fontWeight: '600'
  				}
  			],
  			h3: [
  				'clamp(1.5rem, 3vw, 2rem)',
  				{
  					lineHeight: '1.4',
  					fontWeight: '600'
  				}
  			]
  		},
  		spacing: {
  			'18': '4.5rem',
  			'22': '5.5rem',
  			'26': '6.5rem',
  			'30': '7.5rem'
  		},
  		animation: {
  			shimmer: 'shimmer 2s infinite linear',
  			float: 'float 6s ease-in-out infinite',
  			marquee: 'marquee var(--marquee-duration, 30s) linear infinite',
  			'fade-in': 'fadeIn 0.6s ease-out',
  			'slide-up': 'slideUp 0.6s ease-out',
  			'scale-in': 'scaleIn 0.4s ease-out',
  			glow: 'glow 2s ease-in-out infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(30px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			shine: {
  				'0%, 100%': {
  					backgroundPosition: '200% center'
  				},
  				'50%': {
  					backgroundPosition: '0% center'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-1000px 0'
  				},
  				'100%': {
  					backgroundPosition: '1000px 0'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-20px)'
  				}
  			},
  			marquee: {
  				'0%': {
  					transform: 'translateX(0)'
  				},
  				'100%': {
  					transform: 'translateX(-50%)'
  				}
  			},
  			glow: {
  				'0%, 100%': {
  					boxShadow: '0 0 20px rgba(204, 85, 0, 0.3)'
  				},
  				'50%': {
  					boxShadow: '0 0 40px rgba(204, 85, 0, 0.6)'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    // Forms styling
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
}

export default config
