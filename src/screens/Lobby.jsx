import { useState } from 'react'
import { db, ref, set } from '../firebase'
import { generateRoomCode } from '../game/logic'
import { safeGet, safeUpdate, getErrorMessage } from '../firebase-utils'
import { haptic } from '../telegram'

const GUIDE_CARDS = [
  {
    title: 'Цель игры',
    text: 'Набрать больше всех влияния и не дать городу обрушиться до нуля.',
    delay: '0.85s',
  },
  {
    title: 'Как проходит ход',
    text: 'Бросок кубиков, движение по карте, решение по клетке и переход к следующему игроку.',
    delay: '1s',
  },
  {
    title: 'Как победить',
    text: 'Игра длится 7 ходов на игрока. Высокий уровень города усиливает итоговый результат.',
    delay: '1.15s',
  },
  {
    title: 'Что важно помнить',
    text: 'Районы приносят аренду, карты дают риск и шанс, а спорные решения влияют на всех.',
    delay: '1.3s',
  },
]

function CitySkyline() {
  return (
    <div className="city-skyline-wrap">
      <svg className="city-skyline-svg" viewBox="0 0 340 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <line x1="0" y1="78" x2="340" y2="78" stroke="rgba(245,200,66,0.25)" strokeWidth="1" className="building" style={{ '--delay': '0.7s', pathLength: 1 }} />
        <path d="M8 78 L8 42 L28 42 L28 78" className="building" style={{ '--delay': '0.75s' }} />
        <path d="M8 78 L8 42 L28 42 L28 78" className="building-fill" style={{ '--fill-delay': '1.8s' }} />
        <path d="M56 78 L56 20 L80 20 L80 78" className="building" style={{ '--delay': '0.78s' }} />
        <path d="M56 78 L56 20 L80 20 L80 78" className="building-fill" style={{ '--fill-delay': '1.75s' }} />
        <path d="M108 78 L108 38 L132 38 L132 78" className="building" style={{ '--delay': '0.79s' }} />
        <path d="M108 78 L108 38 L132 38 L132 78" className="building-fill" style={{ '--fill-delay': '1.78s' }} />
        <path d="M140 78 L140 10 L190 10 L190 78" className="building" style={{ '--delay': '0.73s' }} />
        <path d="M140 78 L140 10 L190 10 L190 78" className="building-fill" style={{ '--fill-delay': '1.7s' }} />
        <path d="M158 10 L165 2 L172 10" className="building" style={{ '--delay': '0.8s' }} />
        <path d="M194 78 L194 32 L218 32 L218 78" className="building" style={{ '--delay': '0.79s' }} />
        <path d="M194 78 L194 32 L218 32 L218 78" className="building-fill" style={{ '--fill-delay': '1.78s' }} />
        <path d="M246 78 L246 22 L268 22 L268 78" className="building" style={{ '--delay': '0.77s' }} />
        <path d="M246 78 L246 22 L268 22 L268 78" className="building-fill" style={{ '--fill-delay': '1.76s' }} />
        <path d="M294 78 L294 44 L314 44 L314 78" className="building" style={{ '--delay': '0.81s' }} />
        <path d="M294 78 L294 44 L314 44 L314 78" className="building-fill" style={{ '--fill-delay': '1.81s' }} />
      </svg>
    </div>
  )
}

export default function Lobby({ user, onJoin }) {
  const [mode, setMode] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    haptic('medium')
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
    haptic('medium')
    const roomCode = code.trim().toUpperCase()

    if (roomCode.length < 4) {
      setError('Введи код комнаты')
      return
    }

    setLoading(true)
    setError('')

    try {
      const snap = await safeGet(`rooms/${roomCode}`)
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
        setError('Комната уже заполнена')
        setLoading(false)
        return
      }

      await safeUpdate(`rooms/${roomCode}/players/${user.id}`, {
        id: user.id,
        name: user.name,
        photo: user.photo || null,
        influence: 5,
        position: 0,
        pathBCount: 0,
      })
      onJoin(roomCode)
    } catch (e) {
      setError(getErrorMessage(e))
      setLoading(false)
    }
  }

  function resetMode() {
    haptic('light')
    setMode(null)
    setCode('')
    setError('')
  }

  return (
    <div className="lobby-screen screen-fade-in">
      <section className="lobby-hero">
        <div className="logo-wrap">
          <div className="brand-overline">community movement game</div>
          <div className="brand-wordmark-row">
            <span className="brand-wordmark">ZHANA</span>
            <span className="brand-wordmark brand-wordmark-accent">ADAMDAR</span>
          </div>
        </div>

        <CitySkyline />

        <div className="hero-copy">
          <p className="eyebrow">Telegram Mini App</p>
          <h1>Наш Город</h1>
          <p className="t-body">
            Ход за ходом вы строите влияние, спорите о решениях и держите город в рабочем состоянии.
          </p>
        </div>
      </section>

      <div className="hero-badges">
        <span className="hero-badge">2–8 игроков</span>
        <span className="hero-badge">7 раундов</span>
        <span className="hero-badge">Жаңа Адамдар</span>
      </div>

      <section className="lobby-guide-section">
        <div className="guide-section-label">Как играть</div>
        {GUIDE_CARDS.map(card => (
          <article key={card.title} className="guide-card" style={{ animationDelay: card.delay, animationFillMode: 'both' }}>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="lobby-actions">
        {!mode && (
          <>
            <button className="btn btn-primary btn-lg btn-glow" onClick={() => { haptic('light'); setMode('create') }}>
              Создать игру
            </button>
            <button className="btn btn-secondary btn-lg join-door-trigger" onClick={() => { haptic('light'); setMode('join') }}>
              Войти по коду
            </button>
          </>
        )}

        {mode === 'create' && (
          <div className="lobby-panel">
            <p className="eyebrow">Новая комната</p>
            <h2>Открой свой стол</h2>
            <p className="hint">Хост получает код комнаты и сразу попадает в лобби ожидания.</p>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn btn-primary" onClick={createRoom} disabled={loading}>
              {loading ? 'Создаём...' : 'Создать комнату'}
            </button>
            <button className="btn-inline-link" onClick={resetMode}>Назад</button>
          </div>
        )}

        {mode === 'join' && (
          <div className="join-door-wrap open">
            <div className="lobby-panel join-panel">
              <p className="eyebrow">Код комнаты</p>
              <h2>Открой дверь в игру</h2>
              <p className="hint">Введи код от хоста, и приложение подключит тебя к общей комнате.</p>
              <input
                className="code-input"
                type="text"
                placeholder="ABCD12"
                value={code}
                onChange={event => setCode(event.target.value.toUpperCase())}
                maxLength={8}
                autoFocus
              />
              {error && <div className="error-msg">{error}</div>}
              <button className="btn btn-primary" onClick={joinRoom} disabled={loading || code.length < 4}>
                {loading ? 'Подключаемся...' : 'Войти в комнату'}
              </button>
              <button className="btn-inline-link" onClick={resetMode}>Назад</button>
            </div>
          </div>
        )}
      </section>

      <p className="lobby-user">
        В игре ты будешь отображаться как <strong>{user.name}</strong>
      </p>
    </div>
  )
}
