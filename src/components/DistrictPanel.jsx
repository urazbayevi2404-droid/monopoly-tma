import { BOARD, DISTRICT_CONFIG } from '../data/board'

export default function DistrictPanel({ cellId, room, isMyTurn, onBuy, onSkip }) {
  if (cellId === undefined || cellId === null) return null
  const cell = BOARD[cellId]
  if (!cell || cell.type !== 'district') return null
  const cfg = DISTRICT_CONFIG[cell.group]
  const myInfluence = room?.players?.[room?.playerOrder?.[room?.currentTurnIndex]]?.influence || 0
  const canAfford = myInfluence >= cfg.price

  if (!isMyTurn) {
    return (
      <div className="district-panel">
        <div className="district-info">
          <div className="district-icon">🏘️</div>
          <h3>{cell.name}</h3>
          <p>Свободный район</p>
        </div>
        <div className="waiting-msg">
          <div className="spinner-sm" />
          <p>Активный игрок решает...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="district-panel">
      <div className="district-info">
        <div className="district-icon" style={{ color: cell.color }}>🏘️</div>
        <h3>{cell.name}</h3>
        <div className="district-stats">
          <div className="stat-row">
            <span>Цена:</span>
            <strong>{cfg.price} 💫</strong>
          </div>
          <div className="stat-row">
            <span>Аренда:</span>
            <strong>{cfg.rent} 💫</strong>
          </div>
          <div className="stat-row">
            <span>Монополия:</span>
            <strong>{cfg.monopolyRent} 💫</strong>
          </div>
          <div className="stat-row">
            <span>У тебя:</span>
            <strong>{myInfluence} 💫</strong>
          </div>
        </div>
      </div>

      {!canAfford && (
        <p className="error-msg">Недостаточно Влияния для покупки</p>
      )}

      <div className="district-btns">
        <button
          className="btn btn-primary"
          onClick={onBuy}
          disabled={!canAfford}
        >
          🏘️ Купить за {cfg.price} 💫
        </button>
        <button className="btn btn-ghost" onClick={onSkip}>
          Пропустить
        </button>
      </div>
    </div>
  )
}
