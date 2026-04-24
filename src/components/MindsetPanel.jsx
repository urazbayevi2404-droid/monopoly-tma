import { useState, useEffect } from 'react'
import { MINDSET_CARDS } from '../data/cards'
import { haptic } from '../telegram'

export default function MindsetPanel({ turn, isMyTurn, userId, onSubmit, onVote, isVoting }) {
  const [answer, setAnswer] = useState('')
  const [timer, setTimer] = useState(isVoting ? 20 : 30)

  useEffect(() => {
    setTimer(isVoting ? 20 : 30)
    const iv = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(iv)
  }, [isVoting])

  const cardRef = turn?.card
  const card = MINDSET_CARDS.find(c => c.id === cardRef?.id)
  const myVote = turn?.mindset?.votes?.[userId]

  if (!card) return null

  return (
    <div className="mindset-panel">
      <div className="mindset-header">
        <h3>🧠 Сбой мышления</h3>
        <span className={`category-badge cat-${card.category}`}>Кат. {card.category}</span>
        <span className="timer-badge">⏱ {timer}с</span>
      </div>

      <div className="mindset-question">{card.question}</div>

      {!isVoting && isMyTurn && (
        <div className="mindset-answer-section">
          <textarea
            className="challenge-textarea"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Твой ответ..."
            rows={4}
            maxLength={400}
          />
          <button
            className="btn btn-primary"
            onClick={() => { haptic('medium'); onSubmit(answer) }}
            disabled={!answer.trim()}
          >
            Отправить ответ
          </button>
        </div>
      )}

      {!isVoting && !isMyTurn && (
        <div className="waiting-msg">
          <div className="spinner-sm" />
          <p>Активный игрок отвечает на вопрос...</p>
        </div>
      )}

      {isVoting && (
        <div className="mindset-voting-section">
          <div className="mindset-answer-display">
            <p className="vote-label">Ответ игрока:</p>
            <blockquote className="challenge-reason">{turn?.mindset?.answer}</blockquote>
          </div>

          {!isMyTurn && !myVote && (
            <div className="vote-btns">
              <button className="btn btn-vote-original" onClick={() => { haptic('medium'); onVote('correct') }}>
                ✅ Правильно
              </button>
              <button className="btn btn-vote-challenge" onClick={() => { haptic('medium'); onVote('wrong') }}>
                ❌ Неправильно
              </button>
            </div>
          )}

          {myVote && <p className="voted-msg">✓ Твой голос учтён</p>}
          {isMyTurn && <p className="observer-msg">Другие игроки оценивают твой ответ...</p>}
        </div>
      )}
    </div>
  )
}
