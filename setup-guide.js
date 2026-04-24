#!/usr/bin/env node

import readline from 'node:readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const checklist = [
  {
    title: 'Firebase Setup',
    steps: [
      '1. Open console.firebase.google.com',
      '2. Create new project -> "jana-adamdar-game"',
      '3. Skip Google Analytics',
      '4. Go to Build -> Realtime Database -> Create',
      '5. Start in test mode',
      '6. Project Settings -> Your apps -> Web',
      '7. Copy firebaseConfig object',
    ],
  },
  {
    title: 'Environment Setup',
    steps: [
      '1. Copy .env file: cp .env.example .env',
      '2. Open .env and paste Firebase config',
      '3. Save file',
      '4. Run npm run check-env',
    ],
  },
  {
    title: 'Local Development',
    steps: [
      '1. npm install',
      '2. npm run dev',
      '3. Open http://localhost:5173',
      '4. Create a room and test!',
    ],
  },
  {
    title: 'Deployment (Optional)',
    steps: [
      '1. Push code to GitHub',
      '2. Create account at vercel.com',
      '3. Import project from GitHub',
      '4. Add environment variables',
      '5. Deploy!',
    ],
  },
]

function displayChecklist() {
  console.clear()
  console.log('============================================================')
  console.log('Nash Gorod - Setup Checklist')
  console.log('============================================================')
  console.log('')

  checklist.forEach((section, index) => {
    console.log(`\n${index + 1}. ${section.title}`)
    console.log('-'.repeat(60))
    section.steps.forEach(step => console.log(`  ${step}`))
  })

  console.log('\n')
  console.log('For detailed instructions, see README.md')
  console.log('\nSetup complete! Run:')
  console.log('  npm run dev')
  console.log('\nHappy coding!\n')
  rl.close()
}

displayChecklist()
