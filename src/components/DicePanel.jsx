import { useState } from 'react'
import { haptic } from '../telegram'

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export default function DicePanel({ dice, onRoll, isMyTurn }) {
  const [rolling, setRolling] = useState(false)

  async function handleClick() {
    if (!isMyTurn || rolling) return
    haptic('medium')
    setRolling(true)
    await onRoll()
    setRolling(false)
  }

  return (
    <div className="dice-panel">
      {dice ? (
        <div className="dice-result">
          <div className="dice-faces">
            <span className="die">{DICE_FACES[dice[0]]}</span>
            <span className="die">{DICE_FACES[dice[1]]}</span>
          </div>
          <p className="dice-sum">Итого: {dice[0] + dice[1]} шагов</p>
        </div>
      ) : (
        <div className="dice-prompt">
          <p>Брось кубики и посмотри что ждёт тебя на поле</p>
          <button
            className={`btn btn-primary btn-lg dice-btn ${rolling ? 'rolling' : ''}`}
            onClick={handleClick}
            disabled={!isMyTurn || rolling}
          >
            {rolling ? '🎲🎲 ...' : '🎲 Бросить кубики'}
          </button>
        </div>
      )}
    </div>
  )
}
