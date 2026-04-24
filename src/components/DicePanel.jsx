import { useEffect, useState } from 'react'
import { haptic } from '../telegram'

const DICE_FACES = ['', '\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685']

function randomDie() {
  return Math.floor(Math.random() * 6) + 1
}

export default function DicePanel({ dice, onRoll, isMyTurn }) {
  const [rolling, setRolling] = useState(false)
  const [previewDice, setPreviewDice] = useState([1, 2])

  useEffect(() => {
    if (dice && !rolling) {
      setPreviewDice(dice)
    }
  }, [dice, rolling])

  async function handleClick() {
    if (!isMyTurn || rolling) return

    haptic('medium')
    setRolling(true)

    const intervalId = window.setInterval(() => {
      setPreviewDice([randomDie(), randomDie()])
    }, 90)

    try {
      await new Promise(resolve => window.setTimeout(resolve, 900))
      await onRoll()
    } finally {
      window.clearInterval(intervalId)
      setRolling(false)
    }
  }

  const shownDice = rolling ? previewDice : dice
  const diceSum = shownDice ? shownDice[0] + shownDice[1] : null

  return (
    <div className="dice-panel">
      <div className={`dice-stage ${rolling ? 'is-rolling' : ''}`}>
        <div className="dice-hands" aria-hidden="true">
          <span className="dice-hand left">🤲</span>
          <span className="dice-hand right">🤲</span>
        </div>

        <div className="dice-cup">
          <div className="dice-faces">
            <span className={`die ${rolling ? 'rolling' : ''}`}>{DICE_FACES[shownDice?.[0] || 1]}</span>
            <span className={`die ${rolling ? 'rolling' : ''}`}>{DICE_FACES[shownDice?.[1] || 2]}</span>
          </div>
        </div>
      </div>

      {shownDice && (
        <div className="dice-result">
          <p className="dice-sum">Итого: {diceSum} шагов</p>
          <p className="dice-caption">
            {rolling ? 'Бросаем кубики...' : 'Маршрут определен. Смотри, куда привел ход.'}
          </p>
        </div>
      )}

      {!dice && !rolling && (
        <div className="dice-prompt">
          <p>Брось кубики и посмотри, какая ситуация ждет тебя на поле.</p>
          <button
            className={`btn btn-primary btn-lg dice-btn ${rolling ? 'rolling' : ''}`}
            onClick={handleClick}
            disabled={!isMyTurn || rolling}
          >
            🎲 Бросить кубики
          </button>
        </div>
      )}
    </div>
  )
}
