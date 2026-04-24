#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const envPath = path.join(__dirname, '.env')

if (!fs.existsSync(envPath)) {
  console.log('Missing .env file.')
  console.log('Create it from .env.example first.')
  process.exit(1)
}

const raw = fs.readFileSync(envPath, 'utf8')
const lines = raw.split(/\r?\n/)
const env = {}

for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIndex = trimmed.indexOf('=')
  if (eqIndex === -1) continue
  const key = trimmed.slice(0, eqIndex).trim()
  const value = trimmed.slice(eqIndex + 1).trim()
  env[key] = value
}

const missing = requiredKeys.filter(key => !env[key] || env[key].includes('your_'))

if (missing.length) {
  console.log('Environment is not ready yet.')
  missing.forEach(key => console.log(`- ${key}`))
  process.exit(1)
}

console.log('Environment looks ready.')
requiredKeys.forEach(key => console.log(`[ok] ${key}`))
