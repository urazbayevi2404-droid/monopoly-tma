import { useEffect, useMemo, useRef, useState } from 'react'
import { BOARD, DISTRICT_CONFIG } from '../data/board'
import { haptic } from '../telegram'
import GameIcon from './GameIcon'

export const PLAYER_COLORS = [
  '#F5C842', '#A78BFA', '#34D399', '#F87171',
  '#60A5FA', '#FB923C', '#F472B6', '#22D3EE',
]

const GROUP_META = {
  1: { name: 'Спальный район', short: 'Жилой', color: '#60A5FA' },
  2: { name: 'Рынок', short: 'Рынок', color: '#F97316' },
  3: { name: 'Школы', short: 'Школы', color: '#34D399' },
  4: { name: 'Деловой центр', short: 'Центр', color: '#818CF8' },
  5: { name: 'Площадь', short: 'Площадь', color: '#14B8A6' },
  6: { name: 'Кампус', short: 'Кампус', color: '#F472B6' },
}

const TYPE_META = {
  start: { label: 'Старт', short: 'Старт', color: '#F5C842' },
  problem: { label: 'Проблема', short: 'Риск', color: '#EF4444' },
  opportunity: { label: 'Возможность', short: 'Шанс', color: '#34D399' },
  mindset: { label: 'Сбой мышления', short: 'Мышление', color: '#A78BFA' },
  fork: { label: 'Развилка', short: 'Выбор', color: '#F59E0B' },
  crisis: { label: 'Кризис', short: 'Кризис', color: '#DC2626' },
}

const TYPE_DESCRIPTIONS = {
  start: 'Стартовая точка. За круг игрок получает +2 влияния.',
  district: 'Городской район. Его можно купить и получать аренду.',
  problem: 'Проблема города. Нужно выбрать, как действовать дальше.',
  opportunity: 'Шанс ускорить развитие себя или города.',
  mindset: 'Проверка мышления и аргументации игрока.',
  fork: 'Развилка с риском и долгими последствиями.',
  crisis: 'Общий кризис, который бьет по всем сразу.',
}

function getCellMeta(cell) {
  if (cell.type === 'district') {
    const group = GROUP_META[cell.group]
    return {
      label: group?.name || cell.name,
      short: group?.short || cell.name,
      color: group?.color || '#F5C842',
      iconType: 'district',
    }
  }

  const meta = TYPE_META[cell.type] || TYPE_META.problem
  return {
    label: meta.label,
    short: meta.short,
    color: meta.color,
    iconType: cell.type,
  }
}

function buildRoute(from, to) {
  if (from === to) return [to]

  const steps = []
  let current = from
  while (current !== to) {
    current = (current + 1) % BOARD.length
    steps.push(current)
    if (steps.length > BOARD.length) break
  }
  return steps
}

function CellSheet({ cell, ownerName, onClose }) {
  const meta = getCellMeta(cell)
  const districtConfig = cell.type === 'district' ? DISTRICT_CONFIG[cell.group] : null

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet cell-sheet">
        <div className="sheet-handle" />
        <div className="sheet-section">
          <div className="sheet-icon" style={{ '--sheet-accent': meta.color }}>
            <GameIcon type={meta.iconType} />
          </div>
          <p className="sheet-kicker">{meta.label}</p>
          <h3 className="sheet-title">{cell.name}</h3>
          <p className="sheet-copy">{TYPE_DESCRIPTIONS[cell.type]}</p>
        </div>

        {districtConfig && (
          <div className="sheet-grid">
            <div className="sheet-stat"><span>Цена</span><strong>{districtConfig.price} 💫</strong></div>
            <div className="sheet-stat"><span>Аренда</span><strong>{districtConfig.rent} 💫</strong></div>
            <div className="sheet-stat"><span>Монополия</span><strong>{districtConfig.monopolyRent} 💫</strong></div>
            <div className="sheet-stat"><span>Владелец</span><strong>{ownerName || 'Свободно'}</strong></div>
          </div>
        )}

        <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
      </div>
    </>
  )
}

export default function BoardStrip({ players, order, districts, currentPlayerId, myId }) {
  const [selectedCell, setSelectedCell] = useState(null)
  const [animatedPositions, setAnimatedPositions] = useState({})
  const previousPositionsRef = useRef({})
  const timersRef = useRef([])
  const ribbonRef = useRef(null)

  const realPositions = useMemo(() => {
    const next = {}
    if (!players || !order) return next
    order.forEach(pid => {
      next[pid] = players[pid]?.position ?? 0
    })
    return next
  }, [players, order])

  useEffect(() => () => {
    timersRef.current.forEach(timer => window.clearTimeout(timer))
  }, [])

  useEffect(() => {
    if (!order?.length) return

    timersRef.current.forEach(timer => window.clearTimeout(timer))
    timersRef.current = []

    const previous = previousPositionsRef.current
    const hasPrevious = Object.keys(previous).length > 0

    if (!hasPrevious) {
      setAnimatedPositions(realPositions)
      previousPositionsRef.current = realPositions
      return
    }

    setAnimatedPositions(prev => ({ ...prev, ...previous }))

    order.forEach(pid => {
      const from = previous[pid] ?? realPositions[pid]
      const to = realPositions[pid]

      if (from === to) {
        setAnimatedPositions(prev => ({ ...prev, [pid]: to }))
        return
      }

      const route = buildRoute(from, to)
      route.forEach((position, index) => {
        const timer = window.setTimeout(() => {
          setAnimatedPositions(prev => ({ ...prev, [pid]: position }))
        }, (index + 1) * 220)
        timersRef.current.push(timer)
      })
    })

    previousPositionsRef.current = realPositions
  }, [order, realPositions])

  const pinsByCell = useMemo(() => {
    const next = {}
    if (!order?.length) return next

    order.forEach((pid, colorIndex) => {
      const position = animatedPositions[pid] ?? realPositions[pid] ?? 0
      if (!next[position]) next[position] = []
      next[position].push({
        id: pid,
        name: players?.[pid]?.name || 'Игрок',
        color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
        isCurrent: pid === currentPlayerId,
        isMe: pid === myId,
      })
    })

    return next
  }, [animatedPositions, currentPlayerId, myId, order, players, realPositions])

  useEffect(() => {
    if (!ribbonRef.current || currentPlayerId == null) return
    const activePosition = animatedPositions[currentPlayerId] ?? realPositions[currentPlayerId] ?? 0
    const targetX = Math.max(0, 48 + activePosition * 92 - ribbonRef.current.clientWidth / 2)
    ribbonRef.current.scrollTo({ left: targetX, behavior: 'smooth' })
  }, [animatedPositions, currentPlayerId, realPositions])

  return (
    <>
      <section className="city-board card-shell">
        <div className="city-board-top">
          <div>
            <p className="eyebrow">Карта города</p>
            <h2 className="board-title">Городской маршрут</h2>
          </div>
          <p className="board-subtitle">Продолговатое поле с крупными точками. Тап по клетке открывает детали снизу.</p>
        </div>

        <div className="city-zones">
          {Object.values(GROUP_META).map(group => (
            <span key={group.short} className="zone-pill" style={{ '--zone-accent': group.color }}>
              <i />
              <strong>{group.short}</strong>
            </span>
          ))}
        </div>

        <div className="board-ribbon-shell" ref={ribbonRef}>
          <div className="board-ribbon-track">
            <div className="board-ribbon-line" />
            <div className="board-ribbon-halo board-ribbon-halo-a" />
            <div className="board-ribbon-halo board-ribbon-halo-b" />

            {BOARD.map((cell, index) => {
              const meta = getCellMeta(cell)
              const ownerId = districts?.[cell.id]?.owner
              const ownerName = ownerId ? players?.[ownerId]?.name : null
              const peopleHere = pinsByCell[cell.id] || []
              const isTop = index % 4 === 0 || index % 4 === 1
              const x = 48 + index * 92
              const y = isTop ? 88 : 212

              return (
                <button
                  key={cell.id}
                  className={`board-stop ${isTop ? 'is-top' : 'is-bottom'} ${peopleHere.some(pin => pin.isCurrent) ? 'is-active' : ''}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    '--stop-accent': meta.color,
                  }}
                  onClick={() => {
                    haptic('light')
                    setSelectedCell({ ...cell, ownerName })
                  }}
                >
                  <span className="board-stop-index">{cell.id + 1}</span>
                  <span className="board-stop-icon"><GameIcon type={meta.iconType} /></span>
                  <span className="board-stop-title">{meta.short}</span>
                  <span className="board-stop-name">{cell.name}</span>
                  {ownerName && <span className="board-stop-owner">{ownerName}</span>}
                  {peopleHere.length > 0 && <span className="board-stop-badge">{peopleHere.length}</span>}
                </button>
              )
            })}

            <div className="board-ribbon-center">
              <div className="city-center-badge">ZHANA ADAMDAR</div>
              <h3>Наш Город</h3>
              <p>Маршрут идёт через кварталы, рынок, школы, кризисы и развилки. Всё теперь читается как городская линия решений.</p>
            </div>

            {Object.entries(pinsByCell).flatMap(([cellId, pins]) => {
              const index = Number(cellId)
              const isTop = index % 4 === 0 || index % 4 === 1
              const x = 48 + index * 92
              const y = isTop ? 163 : 137

              return pins.map((pin, pinIndex) => (
                <div
                  key={pin.id}
                  className={`board-pin ${pin.isCurrent ? 'is-current' : ''}`}
                  style={{
                    left: `${x + (pinIndex % 2) * 18}px`,
                    top: `${y + Math.floor(pinIndex / 2) * 18}px`,
                    '--pin-color': pin.color,
                  }}
                  title={pin.name}
                >
                  <span className="board-pin-dot" />
                  <span className="board-pin-label">{pin.name[0]?.toUpperCase()}</span>
                </div>
              ))
            })}
          </div>
        </div>
      </section>

      {selectedCell && (
        <CellSheet
          cell={selectedCell}
          ownerName={selectedCell.ownerName}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </>
  )
}
