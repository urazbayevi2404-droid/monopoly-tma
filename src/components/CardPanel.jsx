import { useEffect, useState } from 'react'
import { PROBLEM_CARDS, OPPORTUNITY_CARDS, FORK_CARDS } from '../data/cards'
import { haptic } from '../telegram'
import GameIcon from './GameIcon'

function getCard(cardRef) {
  if (!cardRef) return null
  const map = { problem: PROBLEM_CARDS, opportunity: OPPORTUNITY_CARDS, fork: FORK_CARDS }
  return map[cardRef.type]?.find(card => card.id === cardRef.id) || null
}

const TYPE_META = {
  problem: { label: 'Проблема', note: 'Нужно выбрать путь реакции до того, как давление усилится.', color: '#EF4444' },
  fork: { label: 'Развилка', note: 'Ни один вариант не бесплатный. У каждого решения свой шрам.', color: '#F59E0B' },
  opportunity: { label: 'Возможность', note: 'Редкий шанс ускорить темп и выжать максимум из момента.', color: '#34D399' },
}

const PATH_EFFECTS = {
  A: { influence: '+3 💫', city: '-2 🏙️', label: 'Личный выигрыш', color: '#f97316' },
  B: { influence: '+2 💫', city: '+1 🏙️', label: 'Системное решение', color: '#22c55e' },
  C: { influence: '?', city: '?', label: 'Рискованный бросок', color: '#8b5cf6' },
}

export default function CardPanel({ card: cardRef, phase, isMyTurn, declaredPath, onDeclare, onChallenge, room }) {
  const card = getCard(cardRef)
  const [challengeReason, setChallengeReason] = useState('')
  const [showChallenge, setShowChallenge] = useState(false)
  const [timer, setTimer] = useState(12)

  useEffect(() => {
    if (phase !== 'challenge_window') return
    setTimer(12)
    const interval = setInterval(() => {
      setTimer(value => {
        if (value <= 1) {
          clearInterval(interval)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  if (!card) return null

  const meta = TYPE_META[cardRef.type]
  const isOpportunity = cardRef.type === 'opportunity'
  const bodyText = card.situation || card.description
  const isChallengeable = phase === 'challenge_window' && !isMyTurn
  const alreadyChallenged = room?.turn?.challenge?.active

  function handleChallenge() {
    if (!challengeReason.trim()) return
    haptic('heavy')
    onChallenge(challengeReason)
    setShowChallenge(false)
    setChallengeReason('')
  }

  return (
    <div className={`card-panel card-shell card-shell-${cardRef.type}`} style={{ '--card-accent': meta.color }}>
      <div className="card-header">
        <span className="card-type-pill">
          <GameIcon type={cardRef.type} />
          {meta.label}
        </span>
        {phase === 'challenge_window' && !alreadyChallenged && (
          <span className="timer-badge">{timer}с</span>
        )}
      </div>

      <div className="card-cover">
        <div className="card-cover-icon"><GameIcon type={cardRef.type} /></div>
        <div>
          <div className="card-title">{card.title}</div>
          <div className="card-note">{meta.note}</div>
        </div>
      </div>

      <div className="card-situation">{bodyText}</div>

      {card.paths && (
        <div className="card-paths">
          {Object.entries(card.paths).map(([path, text]) => {
            const effect = PATH_EFFECTS[path]
            const isSelected = declaredPath === path

            return (
              <div key={path} className={`path-row ${isSelected ? 'selected' : ''}`} style={{ '--path-color': effect.color }}>
                <div className="path-header">
                  <span className="path-letter" style={{ backgroundColor: effect.color }}>Путь {path}</span>
                  <span className="path-effects">{effect.influence} · {effect.city}</span>
                </div>
                <div className="path-label">{effect.label}</div>
                <p className="path-text">{text}</p>
                {isMyTurn && phase === 'reading_card' && (
                  <button
                    className="btn btn-path"
                    style={{ borderColor: effect.color, color: effect.color }}
                    onClick={() => {
                      haptic('medium')
                      onDeclare(path)
                    }}
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
          <strong>Карточка готова к розыгрышу</strong>
          {isMyTurn ? (
            <button className="btn btn-primary" onClick={() => onDeclare()}>
              Активировать эффект
            </button>
          ) : (
            <p className="challenged-note">Активный игрок разыгрывает возможность.</p>
          )}
        </div>
      )}

      {phase === 'challenge_window' && declaredPath && (
        <div className="declared-path-notice">
          <strong>Заявлен путь {declaredPath}</strong>
          <p className="card-note">Если решение выглядит вредным для города, его можно оспорить до таймера.</p>
          {isChallengeable && !alreadyChallenged && !showChallenge && (
            <button className="btn btn-challenge" onClick={() => setShowChallenge(true)}>
              Оспорить выбор
            </button>
          )}
          {alreadyChallenged && <p className="challenged-note">Спор уже открыт, идёт обсуждение.</p>}
        </div>
      )}

      {showChallenge && (
        <div className="challenge-input-panel">
          <p>Коротко объясни, почему это решение сейчас слабое или опасное.</p>
          <textarea
            className="challenge-textarea"
            value={challengeReason}
            onChange={event => setChallengeReason(event.target.value)}
            placeholder="Например: решение даёт краткий бонус, но слишком сильно бьёт по городу."
            rows={3}
            maxLength={200}
          />
          <div className="challenge-btns">
            <button className="btn btn-primary" onClick={handleChallenge} disabled={!challengeReason.trim()}>
              Запустить спор
            </button>
            <button className="btn-inline-link" onClick={() => setShowChallenge(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
