import { useState, useEffect } from 'react'
import { PROBLEM_CARDS, OPPORTUNITY_CARDS, FORK_CARDS } from '../data/cards'
import { haptic } from '../telegram'

function getCard(cardRef) {
  if (!cardRef) return null
  const map = { problem: PROBLEM_CARDS, opportunity: OPPORTUNITY_CARDS, fork: FORK_CARDS }
  const arr = map[cardRef.type]
  return arr?.find(c => c.id === cardRef.id) || null
}

const TYPE_META = {
  problem: {
    label: 'Проблема',
    icon: '⚡',
    note: 'Нужно быстро выбрать путь реакции.',
  },
  fork: {
    label: 'Развилка',
    icon: '🧭',
    note: 'Есть несколько направлений, и у каждого своя цена.',
  },
  opportunity: {
    label: 'Возможность',
    icon: '🌱',
    note: 'Можно получить бонус или открыть новый темп для партии.',
  },
}

const PATH_EFFECTS = {
  A: { influence: '+3 💫', city: '−2 🏙️', label: 'Личный выигрыш', color: '#f97316' },
  B: { influence: '+2 💫', city: '+1 🏙️', label: 'Системное решение', color: '#22c55e' },
  C: { influence: '?', city: '?', label: 'Риск и неизвестность', color: '#8b5cf6' },
}

export default function CardPanel({ card: cardRef, phase, isMyTurn, declaredPath, onDeclare, onChallenge, room, userId }) {
  const card = getCard(cardRef)
  const [challengeReason, setChallengeReason] = useState('')
  const [showChallenge, setShowChallenge] = useState(false)
  const [timer, setTimer] = useState(12)

  useEffect(() => {
    if (phase !== 'challenge_window') return
    setTimer(12)
    const iv = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(iv)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [phase])

  if (!card) return null

  const typeMeta = TYPE_META[cardRef.type]
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
    <div className={`card-panel card-shell card-shell-${cardRef.type}`}>
      <div className="card-glow" aria-hidden="true" />
      <div className={`card-header card-type-${cardRef.type}`}>
        <span className="card-type-pill">
          <span>{typeMeta?.icon}</span>
          {typeMeta?.label}
        </span>
        {phase === 'challenge_window' && !alreadyChallenged && (
          <span className="challenge-timer">⏱ {timer}с</span>
        )}
      </div>

      <div className="card-cover">
        <div className="card-cover-icon">{typeMeta?.icon}</div>
        <div>
          <div className="card-title">{card.title}</div>
          <div className="card-note">{typeMeta?.note}</div>
        </div>
      </div>

      <div className="card-situation">{bodyText}</div>

      {card.paths && (
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
                <div className="path-label">{eff.label}</div>
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
          <strong>Карточка готова к применению</strong>
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
          <strong>Объявлен путь {declaredPath}</strong>
          <p className="card-note">Если кажется, что выбор вреден для города, его можно оспорить.</p>
          {isChallengeable && !alreadyChallenged && !showChallenge && (
            <button className="btn btn-challenge" onClick={() => setShowChallenge(true)}>
              🗣️ Оспорить выбор
            </button>
          )}
          {alreadyChallenged && <p className="challenged-note">Идет обсуждение решения...</p>}
        </div>
      )}

      {showChallenge && (
        <div className="challenge-input-panel">
          <p>Коротко объясни, почему этот путь сейчас неверен:</p>
          <textarea
            className="challenge-textarea"
            value={challengeReason}
            onChange={e => setChallengeReason(e.target.value)}
            placeholder="Например: путь слишком выгоден одному игроку и ухудшает положение города."
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
