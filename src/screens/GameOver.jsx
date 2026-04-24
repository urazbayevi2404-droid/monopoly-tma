import { useState, useEffect } from 'react'
import { db, ref, onValue } from '../firebase'
import { calcFinalScores } from '../game/logic'

export default function GameOver({ roomCode, user, onPlayAgain }) {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    const unsub = onValue(ref(db, `rooms/${roomCode}`), snap => {
      if (snap.exists()) setRoom(snap.val())
    })
    return () => unsub()
  }, [roomCode])

  if (!room) return <div className="loading-screen"><div className="spinner" /></div>

  const isDead = room.endReason === 'city_dead'
  const scores = room.players && room.playerOrder ? calcFinalScores(room) : []
  const winner = scores[0]
  const isWinner = winner?.playerId === user.id

  return (
    <div className="gameover-screen">
      <div className="gameover-header">
        {isDead ? (
          <>
            <div className="gameover-icon">💔</div>
            <h1>Город умер</h1>
            <p className="gameover-subtitle">Все проиграли. Нельзя быть победителем в разрушенном городе.</p>
          </>
        ) : isWinner ? (
          <>
            <div className="gameover-icon">🏆</div>
            <h1>Победа!</h1>
            <p className="gameover-subtitle">Ты стал лидером города!</p>
          </>
        ) : (
          <>
            <div className="gameover-icon">🏙️</div>
            <h1>Игра окончена</h1>
            <p className="gameover-subtitle">Уровень города: {room.cityLevel}/20</p>
          </>
        )}
      </div>

      {!isDead && (
        <div className="scores-section">
          <h2>Итоговые очки</h2>
          <div className="city-bonus-note">
            Городской бонус: +{scores[0]?.cityBonus || 0} для всех (Город = {room.cityLevel})
          </div>
          <div className="scores-list">
            {scores.map((s, i) => (
              <div key={s.playerId} className={`score-row ${s.playerId === user.id ? 'mine' : ''} ${i === 0 ? 'winner' : ''}`}>
                <div className="score-rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </div>
                <div className="score-name">{s.name}{s.playerId === user.id ? ' (ты)' : ''}</div>
                <div className="score-breakdown">
                  <span>{s.influence} + {s.cityBonus}</span>
                </div>
                <div className="score-total">{s.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="discussion-prompt">
        <h3>💬 Обсудите</h3>
        <ul>
          <li>Какое решение было самым сложным?</li>
          <li>Когда больше всего хотелось выбрать Путь A?</li>
          <li>Что бы вы сделали иначе в реальной жизни?</li>
        </ul>
      </div>

      <button className="btn btn-primary btn-lg" onClick={onPlayAgain}>
        🎮 Новая игра
      </button>
    </div>
  )
}
