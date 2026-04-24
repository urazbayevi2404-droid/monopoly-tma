import { useState, useEffect } from 'react'
import { haptic } from '../telegram'

export default function ChallengePanel({ turn, isMyTurn, userId, onRespond, onVote, isVoting }) {
  const [response, setResponse] = useState('')
  const [timer, setTimer] = useState(isVoting ? 25 : 15)

  useEffect(() => {
    setTimer(isVoting ? 25 : 15)
    const iv = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(iv)
  }, [isVoting])

  const challenge = turn?.challenge
  const myVote = challenge?.votes?.[userId]
  const isChallenger = challenge?.challengerId === userId

  if (!isVoting) {
    // Фаза challenging: активный игрок видит причину и отвечает
    return (
      <div className="challenge-panel">
        <div className="challenge-header">
          <h3>🗣️ Оспаривание!</h3>
          <span className="timer-badge">⏱ {timer}с</span>
        </div>

        <div className="challenge-reason-block">
          <p className="challenge-label">Причина оспаривания:</p>
          <blockquote className="challenge-reason">{challenge?.reason}</blockquote>
        </div>

        <div className="declared-path-info">
          Ты объявил: <strong>Путь {turn?.declaredPath}</strong>
        </div>

        {isMyTurn && (
          <div className="response-section">
            <p>Ответь в одном предложении:</p>
            <textarea
              className="challenge-textarea"
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Я выбрал этот путь потому что..."
              rows={3}
              maxLength={200}
            />
            <button
              className="btn btn-primary"
              onClick={() => { haptic('medium'); onRespond(response) }}
              disabled={!response.trim()}
            >
              Ответить →
            </button>
          </div>
        )}

        {!isMyTurn && (
          <div className="waiting-msg">
            <div className="spinner-sm" />
            <p>Ждём ответа активного игрока...</p>
          </div>
        )}
      </div>
    )
  }

  // Фаза voting
  const voteCount = Object.keys(challenge?.votes || {}).length
  return (
    <div className="challenge-panel">
      <div className="challenge-header">
        <h3>🗳️ Голосование</h3>
        <span className="timer-badge">⏱ {timer}с</span>
      </div>

      <div className="vote-sides">
        <div className="vote-side">
          <p className="vote-label">🗣️ Оспаривание:</p>
          <blockquote className="challenge-reason">{challenge?.reason}</blockquote>
        </div>
        <div className="vote-side">
          <p className="vote-label">↩️ Ответ:</p>
          <blockquote className="challenge-reason">{challenge?.response || '(ответ ещё не получен)'}</blockquote>
        </div>
      </div>

      <p className="vote-instruction">Проголосовано: {voteCount}</p>

      {!isMyTurn && !isChallenger && !myVote && (
        <div className="vote-btns">
          <button className="btn btn-vote-challenge" onClick={() => { haptic('medium'); onVote('challenge') }}>
            ✋ Поддержать оспаривание
          </button>
          <button className="btn btn-vote-original" onClick={() => { haptic('medium'); onVote('original') }}>
            ✅ Оставить оригинальный выбор
          </button>
        </div>
      )}

      {myVote && <p className="voted-msg">✓ Твой голос учтён</p>}
      {(isMyTurn || isChallenger) && !myVote && (
        <p className="observer-msg">Ты участник спора — ты не голосуешь</p>
      )}
    </div>
  )
}
