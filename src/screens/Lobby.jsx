import { useState } from 'react'
import { db, ref, set } from '../firebase'
import { generateRoomCode } from '../game/logic'
import { safeGet, safeUpdate, getErrorMessage } from '../firebase-utils'

const GAME_GUIDE = [
  {
    title: 'Цель игры',
    text: 'Набрать больше всех Влияния к финалу партии и не дать городу опуститься до нуля.',
  },
  {
    title: 'Как проходит ход',
    text: 'Игрок бросает кубики, попадает на клетку и принимает решение по карточке, району или событию.',
  },
  {
    title: 'Как победить',
    text: 'Игра длится 7 ходов на каждого. Высокий уровень города усиливает итоговый результат.',
  },
]

const SYMBOLS = [
  '⚡ Проблема: нужно выбрать реакцию.',
  '🌱 Возможность: шанс на бонус или усиление.',
  '🧠 Сбой мышления: ответь на вопрос и докажи свою позицию.',
  '🧭 Развилка: сложное решение с последствиями.',
]

export default function Lobby({ user, onJoin }) {
  const [mode, setMode] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(true)

  async function createRoom() {
    setLoading(true)
    setError('')
    const roomCode = generateRoomCode()
    try {
      await set(ref(db, `rooms/${roomCode}`), {
        status: 'waiting',
        hostId: user.id,
        createdAt: Date.now(),
        players: {
          [user.id]: {
            id: user.id,
            name: user.name,
            photo: user.photo || null,
            influence: 5,
            position: 0,
            pathBCount: 0,
          },
        },
      })
      onJoin(roomCode)
    } catch (e) {
      setError(getErrorMessage(e))
      setLoading(false)
    }
  }

  async function joinRoom() {
    const c = code.trim().toUpperCase()
    if (c.length < 4) {
      setError('Введи код комнаты')
      return
    }

    setLoading(true)
    setError('')

    try {
      const snap = await safeGet(`rooms/${c}`)
      if (!snap.exists()) {
        setError('Комната не найдена')
        setLoading(false)
        return
      }

      const room = snap.val()
      if (room.status === 'playing') {
        setError('Игра уже началась')
        setLoading(false)
        return
      }
      if (Object.keys(room.players || {}).length >= 8) {
        setError('Комната заполнена (макс. 8)')
        setLoading(false)
        return
      }

      await safeUpdate(`rooms/${c}/players/${user.id}`, {
        id: user.id,
        name: user.name,
        photo: user.photo || null,
        influence: 5,
        position: 0,
        pathBCount: 0,
      })
      onJoin(c)
    } catch (e) {
      setError(getErrorMessage(e))
      setLoading(false)
    }
  }

  return (
    <div className="lobby-screen">
      <div className="lobby-header">
        <div className="brand-lockup">
          <div className="logo logo-image-wrap">
            <img className="logo-image" src="/branding/logo-main.png" alt="Жаңа Адамдар" />
          </div>
          <div className="brand-mark-card">
            <img className="brand-mark-image" src="/branding/logo-mark.png" alt="Логотип ЖА" />
          </div>
        </div>
        <div className="hero-kicker">Жаңа Адамдар · городская настольная игра</div>
        <h1>Наш Город</h1>
        <p className="subtitle">
          Ход за ходом вы решаете, что важнее: личное влияние, устойчивость города или риск ради прорыва.
        </p>
      </div>

      <div className="hero-badges">
        <span className="hero-badge">2–8 игроков</span>
        <span className="hero-badge">7 раундов на каждого</span>
        <span className="hero-badge">Желтый + фиолетовый стиль</span>
      </div>

      <div className="player-greeting">
        Привет, <strong>{user.name}</strong>
      </div>

      <div className="lobby-guide-card">
        <div className="guide-card-header">
          <div>
            <p className="guide-kicker">Перед стартом</p>
            <h2>Что это за игра</h2>
          </div>
          <button className="btn btn-ghost" onClick={() => setShowGuide(v => !v)}>
            {showGuide ? 'Скрыть' : 'Показать'}
          </button>
        </div>

        <p className="hint">
          Это цифровая монополия про городские решения: вы ходите по карте, тянете карточки и спорите о том,
          что действительно полезно для города.
        </p>

        {showGuide && (
          <div className="guide-grid">
            {GAME_GUIDE.map(item => (
              <div key={item.title} className="guide-item">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}

            <div className="guide-item guide-item-wide">
              <h3>Что означают клетки</h3>
              <div className="rules-content">
                {SYMBOLS.map(line => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!mode && (
        <div className="lobby-actions">
          <button className="btn btn-primary btn-lg" onClick={() => setMode('create')}>
            ✨ Создать игру
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => setMode('join')}>
            🔗 Войти по коду
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="lobby-panel">
          <h2>Новая комната</h2>
          <p className="hint">
            Ты создашь стол для партии и получишь код. Отправь его друзьям и начинайте, когда все зайдут.
          </p>
          {error && <div className="error-msg">{error}</div>}
          <div className="lobby-btns">
            <button className="btn btn-primary" onClick={createRoom} disabled={loading}>
              {loading ? 'Создаем...' : '🚀 Создать'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setMode(null); setError('') }}>
              Назад
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="lobby-panel">
          <h2>Войти в игру</h2>
          <p className="hint">Введи код, который тебе прислали, и присоединись к партии.</p>
          <input
            className="code-input"
            type="text"
            placeholder="ABCD12"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoFocus
          />
          {error && <div className="error-msg">{error}</div>}
          <div className="lobby-btns">
            <button className="btn btn-primary" onClick={joinRoom} disabled={loading}>
              {loading ? 'Подключаем...' : '▶️ Войти'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setMode(null); setCode(''); setError('') }}>
              Назад
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
