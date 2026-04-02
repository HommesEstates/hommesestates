#!/usr/bin/env node
/**
 * Admin User Creation CLI
 * 
 * Usage:
 *   npx ts-node scripts/create-admin.ts
 *   npx ts-node scripts/create-admin.ts --email admin@example.com --name "Admin User" --role ADMIN
 * 
 * Interactive mode (no args):
 *   npx ts-node scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'
import readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

function maskInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin
    const stdout = process.stdout
    
    stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    
    let password = ''
    
    stdin.on('data', (ch: string) => {
      const char = ch as string
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false)
          stdin.pause()
          stdout.write('\n')
          resolve(password)
          break
        case '\u0003':
          process.exit()
          break
        default:
          if (char === '\u007f') { // Backspace
            if (password.length > 0) {
              password = password.slice(0, -1)
              stdout.write('\b \b')
            }
          } else {
            password += char
            stdout.write('*')
          }
          break
      }
    })
  })
}

async function createAdmin(options: {
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'EDITOR' | 'DESIGNER' | 'PROPERTY_MANAGER' | 'VIEWER'
}) {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: options.email },
    })

    if (existing) {
      console.error(`❌ User with email ${options.email} already exists`)
      process.exit(1)
    }

    // Hash password
    const passwordHash = await hashPassword(options.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: options.email,
        name: options.name,
        passwordHash,
        role: options.role,
        isActive: true,
      },
    })

    console.log(`\n✅ Admin user created successfully!`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   ID: ${user.id}`)
    console.log(`\n🔑 Login at: http://localhost:3000/admin/login`)

  } catch (error) {
    console.error('❌ Failed to create admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function interactive() {
  console.log('🏠 Hommes Estates - Admin User Creator\n')

  const email = await question('Email: ')
  if (!email || !email.includes('@')) {
    console.error('❌ Valid email required')
    process.exit(1)
  }

  const name = await question('Full Name: ')
  if (!name) {
    console.error('❌ Name required')
    process.exit(1)
  }

  console.log('\nRoles: ADMIN, EDITOR, DESIGNER, PROPERTY_MANAGER, VIEWER')
  const role = (await question('Role [ADMIN]: ')) || 'ADMIN'
  const validRoles = ['ADMIN', 'EDITOR', 'DESIGNER', 'PROPERTY_MANAGER', 'VIEWER']
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role. Must be one of: ${validRoles.join(', ')}`)
    process.exit(1)
  }

  const password = await maskInput('Password: ')
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters')
    process.exit(1)
  }

  const confirm = await maskInput('Confirm Password: ')
  if (password !== confirm) {
    console.error('❌ Passwords do not match')
    process.exit(1)
  }

  await createAdmin({
    email,
    name,
    password,
    role: role as any,
  })

  rl.close()
}

// Parse CLI arguments
const args = process.argv.slice(2)
const flags: Record<string, string> = {}

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace('--', '')
    const value = args[i + 1] || ''
    if (!value.startsWith('--')) {
      flags[key] = value
      i++
    }
  }
}

// Run in interactive mode if no args provided
if (args.length === 0) {
  interactive()
} else {
  // CLI mode
  const { email, name, role = 'ADMIN', password } = flags
  
  if (!email || !name || !password) {
    console.log('Usage: npx ts-node scripts/create-admin.ts [options]')
    console.log('')
    console.log('Options:')
    console.log('  --email     Admin email address')
    console.log('  --name      Full name')
    console.log('  --password  Password (min 8 chars)')
    console.log('  --role      Role [ADMIN, EDITOR, DESIGNER, PROPERTY_MANAGER, VIEWER]')
    console.log('')
    console.log('Interactive mode (no arguments):')
    console.log('  npx ts-node scripts/create-admin.ts')
    process.exit(1)
  }

  const validRoles = ['ADMIN', 'EDITOR', 'DESIGNER', 'PROPERTY_MANAGER', 'VIEWER']
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role: ${role}`)
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters')
    process.exit(1)
  }

  createAdmin({
    email,
    name,
    password,
    role: role as any,
  }).then(() => {
    rl.close()
  })
}
