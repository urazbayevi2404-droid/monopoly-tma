#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const requiredFiles = [
  'src/App.jsx',
  'src/main.jsx',
  'src/firebase.js',
  'src/firebase-utils.js',
  'src/telegram.js',
  'src/game/logic.js',
  'src/data/board.js',
  'src/data/cards.js',
  'src/screens/Lobby.jsx',
  'src/screens/GameScreen.jsx',
  'src/screens/GameOver.jsx',
  'src/screens/SetupRequired.jsx',
  'src/components/WaitingRoom.jsx',
  'src/components/CityTrack.jsx',
  'src/components/PlayerList.jsx',
  'src/components/BoardStrip.jsx',
  'src/components/DicePanel.jsx',
  'src/components/CardPanel.jsx',
  'src/components/ChallengePanel.jsx',
  'src/components/MindsetPanel.jsx',
  'src/components/DistrictPanel.jsx',
  'src/styles/main.css',
  'index.html',
  'package.json',
  '.env.example',
  'check-env.js',
  'firebase.rules.json',
  'vite.config.js',
]

const missingFiles = []
const okFiles = []

console.log('\nVerifying project structure...\n')

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    console.log(`[ok] ${file}`)
    okFiles.push(file)
  } else {
    console.log(`[missing] ${file}`)
    missingFiles.push(file)
  }
})

console.log(`\nSummary: ${okFiles.length}/${requiredFiles.length} files present\n`)

if (missingFiles.length === 0) {
  console.log('All required files are present.')
  console.log('\nNext steps:')
  console.log('  1. npm install')
  console.log('  2. Create .env from .env.example with Firebase config')
  console.log('  3. npm run dev')
  process.exit(0)
}

console.log(`${missingFiles.length} files are missing.`)
console.log('Missing files:')
missingFiles.forEach(file => console.log(`  - ${file}`))
process.exit(1)
