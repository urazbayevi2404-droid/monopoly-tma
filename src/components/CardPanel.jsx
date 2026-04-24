import { useState, useEffect } from 'react'
import { PROBLEM_CARDS, OPPORTUNITY_CARDS, FORK_CARDS } from '../data/cards'
import { haptic } from '../telegram'

function getCard(cardRef) {
  if (!cardRef) return null
  const map = { problem: PROBLEM_CARDS, opportunity: OPPORTUNITY_CARDS, fork: FORK_CARDS }
  const arr = map[cardRef.type]
  return arr?.find(c => c.id === cardRef.id) || null
}

const PATH_EFFECTS = {
  A: { influence: '+3 💫', city: '–2 🏙️', label: 'Пассивное решение', color: '#EF4444' },
  B: { influence: '+2 💫', city: '+1 🏙️', label: 'Системное решение', color: '#10B981' },
  C: { influence: '?', city: '?', label: 'Неоднозначное решение', color: '#F59E0B' },
}

export default function CardPanel({ card: cardRef, phase, isMyTurn, declaredPath, onDeclare, onChallenge, room, userId }) {
  const card = getCard(cardRef)
  const [challengeReason, setChallengeReason] = useState('')
  const [showChallenge, setShowChallenge] = useState(false)
  const [timer, setTimer] = useState(12)

  // Countdown for challenge window
  useEffect(() => {
    if (phase !== 'challenge_window') return
    setTimer(12)
    const iv = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(iv); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [phase])

  if (!card) return null
  const isOpportunity = cardRef.type === 'opportunity'
  const bodyText = card.situation || card.description

  const isChallengeable = phase === 'challenge_window' && !isMyTurn
  const alreadyChallenged = room?.turn?.challenge?.active

  function handleDeclare(path) {
    haptic('medium')
    onDeclare(path)
  }

  function handleChallenge() {
    if (!challengeReason.trim()) return
    haptic('heavy')
    onChallenge(challengeReason)
    setShowChallenge(false)
    setChallengeReason('')
  }

  return (
    <div className="card-panel">
      <div className={`card-header card-type-${cardRef.type}`}>
        <span>{cardRef.type === 'problem' ? '⚡ Проблема' : cardRef.type === 'fork' ? '🔀 Развилка' : '🌱 Возможность'}</span>
        {phase === 'challenge_window' && !alreadyChallenged && (
          <span className="challenge-timer">⏱ {timer}с</span>
        )}
      </div>

      <div className="card-title">{card.title}</div>
      <div className="card-situation">{bodyText}</div>

      {(card.paths) && (
        <div className="card-paths">
          {Object.entries(card.paths).map(([path, text]) => {
            const eff = PATH_EFFECTS[path]
            const isSelected = declaredPath === path
            return (
              <div key={path} className={`path-row ${isSelected ? 'selected' : ''}`} style={{ '--path-color': eff.color }}>
                <div className="path-header">
                  <span className="path-letter" style={{ backgroundColor: eff.color }}>
                    Путь {path}
                  </span>
                  <span className="path-effects">
                    {eff.influence} · {eff.city}
                  </span>
                </div>
                <p className="path-text">{text}</p>
                {isMyTurn && phase === 'reading_card' && (
                  <button
                    className="btn btn-path"
                    style={{ borderColor: eff.color, color: eff.color }}
                    onClick={() => handleDeclare(path)}
                  >
                    Выбрать путь {path}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isOpportunity && phase === 'reading_card' && (
        <div className="declared-path-notice">
          {isMyTurn ? (
            <button className="btn btn-primary" onClick={() => onDeclare()}>
              Применить карточку
            </button>
          ) : (
            <p className="challenged-note">Активный игрок разыгрывает возможность...</p>
          )}
        </div>
      )}

      {phase === 'challenge_window' && declaredPath && (
        <div className="declared-path-notice">
          <strong>Объявлен Путь {declaredPath}</strong>
          {isChallengeable && !alreadyChallenged && !showChallenge && (
            <button className="btn btn-challenge" onClick={() => setShowChallenge(true)}>
              🗣️ Оспорить!
            </button>
          )}
          {alreadyChallenged && <p className="challenged-note">✋ Оспаривается...</p>}
        </div>
      )}

      {showChallenge && (
        <div className="challenge-input-panel">
          <p>Объясни в одном предложении почему этот путь неверен:</p>
          <textarea
            className="challenge-textarea"
            value={challengeReason}
            onChange={e => setChallengeReason(e.target.value)}
            placeholder="Путь A неверен потому что..."
            rows={3}
            maxLength={200}
          />
          <div className="challenge-btns">
            <button className="btn btn-primary" onClick={handleChallenge} disabled={!challengeReason.trim()}>
              Оспорить
            </button>
            <button className="btn btn-ghost" onClick={() => setShowChallenge(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
