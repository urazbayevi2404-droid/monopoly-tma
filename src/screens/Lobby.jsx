import { useState } from 'react'
import { db, ref, set, get, update } from '../firebase'
import { generateRoomCode } from '../game/logic'
import { safeGet, safeUpdate, getErrorMessage } from '../firebase-utils'

export default function Lobby({ user, onJoin }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (c.length < 4) { setError('Введи код комнаты'); return }
    setLoading(true)
    setError('')
    try {
      const snap = await safeGet(`rooms/${c}`)
      if (!snap.exists()) { setError('Комната не найдена'); setLoading(false); return }
      const room = snap.val()
      if (room.status === 'playing') { setError('Игра уже началась'); setLoading(false); return }
      if (Object.keys(room.players || {}).length >= 8) { setError('Комната заполнена (макс. 8)'); setLoading(false); return }

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
        <div className="logo">🏙️</div>
        <h1>Наш Город</h1>
        <p className="subtitle">Жаңа Адамдар — настольная игра</p>
      </div>

      <div className="player-greeting">
        Привет, <strong>{user.name}</strong>
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
          <h2>Новая игра</h2>
          <p className="hint">Ты создашь комнату и получишь код. Поделись им с активистами!</p>
          {error && <div className="error-msg">{error}</div>}
          <div className="lobby-btns">
            <button className="btn btn-primary" onClick={createRoom} disabled={loading}>
              {loading ? 'Создаём...' : '🚀 Создать'}
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
          <p className="hint">Введи код который тебе прислали</p>
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
              {loading ? 'Входим...' : '▶️ Войти'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setMode(null); setCode(''); setError('') }}>
              Назад
            </button>
          </div>
        </div>
      )}

      <div className="rules-hint">
        <details>
          <summary>Как играть?</summary>
          <div className="rules-content">
            <p>🎯 <strong>Цель:</strong> набрать наибольшее Влияние к концу игры. Если город упал до 0 — все проигрывают.</p>
            <p>⚡ <strong>Путь A:</strong> +3 Влияния тебе, но Город –2. Соблазнительно, но опасно.</p>
            <p>✅ <strong>Путь B:</strong> +2 Влияния, Город +1. Правильное решение.</p>
            <p>🎲 <strong>Путь C:</strong> бросок кубика. Риск.</p>
            <p>🗣️ <strong>Голос совести:</strong> любой игрок может оспорить твой выбор.</p>
            <p>🏆 <strong>Конец игры:</strong> 7 ходов на каждого. Высокий Город даёт бонус всем.</p>
          </div>
        </details>
      </div>
    </div>
  )
}
