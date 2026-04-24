import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, onValue, push, serverTimestamp } from 'firebase/database'

const requiredFirebaseEnv = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigErrors = requiredFirebaseEnv.filter(key => {
  const value = import.meta.env[key]
  return !value || String(value).includes('your_')
})

export const hasFirebaseConfig = firebaseConfigErrors.length === 0

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null
export const db = app ? getDatabase(app) : null

export { ref, set, get, update, onValue, push, serverTimestamp }
