import { useEffect, useState } from 'react'
import { haptic } from '../telegram'

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function randomDie() {
  return Math.floor(Math.random() * 6) + 1
}

export default function DicePanel({ dice, onRoll, isMyTurn }) {
  const [rolling, setRolling] = useState(false)
  const [previewDice, setPreviewDice] = useState([1, 2])

  useEffect(() => {
    if (dice && !rolling) setPreviewDice(dice)
  }, [dice, rolling])

  async function handleClick() {
    if (!isMyTurn || rolling) return

    haptic('medium')
    setRolling(true)

    const intervalId = window.setInterval(() => {
      setPreviewDice([randomDie(), randomDie()])
    }, 85)

    try {
      await new Promise(resolve => window.setTimeout(resolve, 800))
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
        <div className="dice-faces">
          <div className={`die ${rolling ? 'rolling' : ''}`}>{DICE_FACES[shownDice?.[0] || 1]}</div>
          <div className={`die ${rolling ? 'rolling' : ''}`}>{DICE_FACES[shownDice?.[1] || 2]}</div>
        </div>

        <div className="dice-sum-row">
          {rolling ? (
            <>
              <div className="dice-sum">Кубики летят</div>
              <div className="dice-sub">Через мгновение станет ясно, куда идёт фишка.</div>
            </>
          ) : shownDice ? (
            <>
              <div className="dice-sum">{diceSum} шагов</div>
              <div className="dice-sub">Маршрут уже отмечен на карте города.</div>
            </>
          ) : (
            <>
              <div className="dice-sum">Брось кубики</div>
              <div className="dice-sub">Ход начнётся сразу после анимации броска.</div>
            </>
          )}
        </div>
      </div>

      {!dice && !rolling && (
        <button className="btn btn-primary" onClick={handleClick} disabled={!isMyTurn || rolling}>
          Бросить кубики
        </button>
      )}

      {dice && !rolling && (
        <div className="sheet-banner neutral">
          Обрабатываем клетку, на которую пришёл игрок.
        </div>
      )}
    </div>
  )
}
