import { firebaseConfigErrors } from '../firebase'

const ENV_HINTS = {
  VITE_FIREBASE_API_KEY: 'API key веб-приложения Firebase',
  VITE_FIREBASE_AUTH_DOMAIN: 'домен Firebase Auth',
  VITE_FIREBASE_DATABASE_URL: 'URL Realtime Database',
  VITE_FIREBASE_PROJECT_ID: 'ID проекта Firebase',
  VITE_FIREBASE_STORAGE_BUCKET: 'Storage bucket проекта',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'Messaging sender ID',
  VITE_FIREBASE_APP_ID: 'App ID веб-приложения',
}

export default function SetupRequired() {
  return (
    <div className="lobby-screen">
      <div className="lobby-header">
        <div className="brand-lockup brand-lockup-compact">
          <div className="logo logo-image-wrap">
            <img className="logo-image" src="/branding/logo-main.png" alt="Жаңа Адамдар" />
          </div>
        </div>
        <h1>Нужна настройка Firebase</h1>
        <p className="subtitle">Проект собран, но для запуска игры осталось заполнить переменные окружения.</p>
      </div>

      <div className="lobby-panel">
        <h2>Что сделать сейчас</h2>
        <p className="hint">1. Скопируй `.env.example` в `.env`.</p>
        <p className="hint">2. Вставь значения из Firebase Console → Project Settings → Your apps.</p>
        <p className="hint">3. Проверь конфиг командой `npm run check-env`.</p>
        <p className="hint">4. После этого запускай `npm run dev` или деплой на Vercel.</p>

        <div className="rules-content">
          <p><strong>Не хватает:</strong></p>
          {firebaseConfigErrors.map(key => (
            <p key={key}>
              <code>{key}</code> — {ENV_HINTS[key] || 'обязательная переменная'}
            </p>
          ))}
        </div>
      </div>

      <div className="rules-hint">
        <details open>
          <summary>Быстрые команды</summary>
          <div className="rules-content">
            <p><code>copy .env.example .env</code></p>
            <p><code>npm run check-env</code></p>
            <p><code>npm run dev</code></p>
          </div>
        </details>
      </div>
    </div>
  )
}
