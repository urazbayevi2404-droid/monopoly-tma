import { db, ref, update, get } from './firebase'

// Максимум 3 попытки, экспоненциальная задержка
const DEFAULT_RETRY_OPTIONS = { maxRetries: 3, initialDelay: 500 }

export async function firebaseRetry(fn, options = {}) {
  const { maxRetries, initialDelay } = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw new Error(`Firebase operation failed after ${maxRetries + 1} attempts: ${lastError.message}`)
}

// Безопасное обновление с retry
export async function safeUpdate(path, updates) {
  return firebaseRetry(() => update(ref(db, path), updates))
}

// Безопасное чтение с retry
export async function safeGet(path) {
  return firebaseRetry(() => get(ref(db, path)))
}

// Проверить соединение с Firebase
export async function checkFirebaseConnection() {
  try {
    await safeGet('/.info/connected')
    return true
  } catch {
    return false
  }
}

// Error messages for UI
export const FIREBASE_ERRORS = {
  NETWORK_ERROR: 'Ошибка сети. Проверь интернет и попробуй ещё раз.',
  PERMISSION_ERROR: 'Недостаточно прав. Проверь настройки Firebase Realtime Database.',
  ROOM_NOT_FOUND: 'Комната не найдена. Проверь код.',
  ROOM_FULL: 'Комната заполнена (максимум 8 игроков).',
  GAME_ALREADY_STARTED: 'Игра уже началась.',
  GENERIC_ERROR: 'Ошибка операции. Попробуй ещё раз.',
}

export function getErrorMessage(error) {
  if (!error) return FIREBASE_ERRORS.GENERIC_ERROR
  const msg = error.message || ''
  if (msg.includes('PERMISSION_DENIED')) return FIREBASE_ERRORS.PERMISSION_ERROR
  if (msg.includes('Network')) return FIREBASE_ERRORS.NETWORK_ERROR
  return FIREBASE_ERRORS.GENERIC_ERROR
}
