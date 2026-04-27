import { useState } from 'react'
import { BOARD, DISTRICT_CONFIG } from '../data/board'
import { haptic } from '../telegram'
import GameIcon from './GameIcon'

const GROUP_META = {
  1: { label: 'Спальный район', color: '#60A5FA' },
  2: { label: 'Рынок', color: '#F97316' },
  3: { label: 'Школьный квартал', color: '#34D399' },
  4: { label: 'Деловой центр', color: '#818CF8' },
  5: { label: 'Площадь', color: '#14B8A6' },
  6: { label: 'Кампус', color: '#F472B6' },
}

export default function DistrictPanel({ cellId, room, isMyTurn, onBuy, onSkip }) {
  const [confirmed, setConfirmed] = useState(false)

  if (cellId === undefined || cellId === null) return null

  const cell = BOARD[cellId]
  if (!cell || cell.type !== 'district') return null

  const district = DISTRICT_CONFIG[cell.group]
  const meta = GROUP_META[cell.group]
  const activePlayerId = room?.playerOrder?.[room?.currentTurnIndex]
  const influence = room?.players?.[activePlayerId]?.influence || 0
  const canAfford = influence >= district.price

  async function handleBuy() {
    haptic('medium')
    setConfirmed(true)
    await new Promise(resolve => window.setTimeout(resolve, 550))
    await onBuy()
  }

  if (!isMyTurn) {
    return (
      <div className="sheet-section">
        <div className="district-hero" style={{ '--district-accent': meta.color }}>
          <div className="district-icon"><GameIcon type="district" /></div>
          <div>
            <p className="sheet-kicker">{meta.label}</p>
            <h3 className="sheet-title">{cell.name}</h3>
          </div>
        </div>

        <div className="sheet-banner neutral">
          Активный игрок решает, покупать ли этот район.
        </div>
      </div>
    )
  }

  return (
    <div className="sheet-section district-panel">
      <div className="district-hero" style={{ '--district-accent': meta.color }}>
        <div className="district-icon"><GameIcon type="district" /></div>
        <div>
          <p className="sheet-kicker">{meta.label}</p>
          <h3 className="sheet-title">{cell.name}</h3>
        </div>
      </div>

      <div className="district-price">
        <span className="district-price-label">Цена</span>
        <strong>{district.price} 💫</strong>
      </div>

      <div className="sheet-grid">
        <div className="sheet-stat"><span>Аренда</span><strong>{district.rent} 💫</strong></div>
        <div className="sheet-stat"><span>Монополия</span><strong>{district.monopolyRent} 💫</strong></div>
        <div className="sheet-stat"><span>У тебя</span><strong>{influence} 💫</strong></div>
        <div className="sheet-stat"><span>После покупки</span><strong>{influence - district.price} 💫</strong></div>
      </div>

      {!canAfford && (
        <div className="sheet-banner danger">
          Недостаточно влияния для покупки этого района.
        </div>
      )}

      {confirmed ? (
        <div className="purchase-confirmation">
          <div className="purchase-confirmation-mark">✓</div>
          <p>Район закреплён за тобой</p>
        </div>
      ) : (
        <>
          <button className="btn btn-primary" onClick={handleBuy} disabled={!canAfford}>
            Купить район
          </button>
          <button className="btn-inline-link" onClick={() => { haptic('light'); onSkip() }}>
            Пропустить
          </button>
        </>
      )}
    </div>
  )
}
