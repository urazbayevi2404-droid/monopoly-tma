import { useEffect, useState } from 'react'
import { db, ref, onValue } from '../firebase'
import { calcFinalScores } from '../game/logic'

export default function GameOver({ roomCode, user, onPlayAgain }) {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    const unsubscribe = onValue(ref(db, `rooms/${roomCode}`), snap => {
      if (snap.exists()) setRoom(snap.val())
    })

    return () => unsubscribe()
  }, [roomCode])

  if (!room) {
    return (
      <div className="loading-screen branded-loading">
        <div className="spinner" />
        <p>Собираем итоги партии...</p>
      </div>
    )
  }

  const isCityDead = room.endReason === 'city_dead'
  const scores = room.players && room.playerOrder ? calcFinalScores(room) : []
  const winner = scores[0]
  const isWinner = winner?.playerId === user.id

  return (
    <div className="gameover-screen screen-fade-in">
      <section className="gameover-header">
        {isCityDead ? (
          <>
            <div className="gameover-icon">💔</div>
            <h1>Город не выдержал</h1>
            <p className="gameover-subtitle">Партия закончилась общим поражением. Даже сильный игрок не побеждает в мёртвом городе.</p>
          </>
        ) : isWinner ? (
          <>
            <div className="gameover-icon">🏆</div>
            <h1>Ты забрал лидерство</h1>
            <p className="gameover-subtitle">Влияние оказалось самым высоким, а город дожил до финала.</p>
          </>
        ) : (
          <>
            <div className="gameover-icon">🏙️</div>
            <h1>Партия завершена</h1>
            <p className="gameover-subtitle">Город удержался на уровне {room.cityLevel}/20. Смотрим итоговую таблицу.</p>
          </>
        )}
      </section>

      {!isCityDead && (
        <section className="scores-section">
          <p className="eyebrow">Итоговые очки</p>
          <h2>Финальная расстановка</h2>
          <div className="city-bonus-note">
            Городской бонус: +{scores[0]?.cityBonus || 0} каждому игроку при уровне города {room.cityLevel}.
          </div>
          <div className="scores-list">
            {scores.map((score, index) => (
              <div key={score.playerId} className={`score-row ${score.playerId === user.id ? 'mine' : ''} ${index === 0 ? 'winner' : ''}`}>
                <div className="score-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </div>
                <div className="score-name">{score.name}{score.playerId === user.id ? ' • ты' : ''}</div>
                <div className="score-breakdown">{score.influence} + {score.cityBonus}</div>
                <div className="score-total">{score.total}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="discussion-prompt">
        <p className="eyebrow">После игры</p>
        <h3>О чём стоит поговорить</h3>
        <ul>
          <li>Какой ход сильнее всего поменял настроение партии?</li>
          <li>Когда было труднее выбрать между личной выгодой и пользой для города?</li>
          <li>Какое решение из игры ты бы реально повторил в жизни?</li>
        </ul>
      </section>

      <button className="btn btn-primary btn-lg" onClick={onPlayAgain}>
        Новая игра
      </button>
    </div>
  )
}
