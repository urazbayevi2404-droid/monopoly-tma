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
  3: { name: 'Школьный квартал', short: 'Школы', color: '#34D399' },
  4: { name: 'Деловой центр', short: 'Центр', color: '#818CF8' },
  5: { name: 'Площадь', short: 'Площадь', color: '#14B8A6' },
  6: { name: 'Кампус', short: 'Кампус', color: '#F472B6' },
}

const TYPE_META = {
  start: { label: 'Старт', short: 'Старт', color: '#F5C842' },
  problem: { label: 'Проблема', short: 'Риск', color: '#EF4444' },
  opportunity: { label: 'Возможность', short: 'Шанс', color: '#34D399' },
  mindset: { label: 'Сбой мышления', short: 'Майндсет', color: '#A78BFA' },
  fork: { label: 'Развилка', short: 'Выбор', color: '#F59E0B' },
  crisis: { label: 'Кризис', short: 'Кризис', color: '#DC2626' },
}

const TYPE_DESCRIPTIONS = {
  start: 'Стартовая точка. За полный круг игрок получает +2 влияния.',
  district: 'Городской район. Его можно купить и зарабатывать на посещениях.',
  problem: 'Напряжённая ситуация для города. Нужно выбрать путь действия.',
  opportunity: 'Редкое окно роста. Может дать бонус тебе или городу.',
  mindset: 'Проверка мышления и аргументации. Остальные оценивают ответ.',
  fork: 'Развилка с долгими последствиями. Решение влияет на весь темп партии.',
  crisis: 'Кризисный удар по городу и по участникам сразу.',
}

const CELL_LAYOUT = [
  { x: 10, y: 81 }, { x: 17, y: 83 }, { x: 24, y: 84 }, { x: 32, y: 85 }, { x: 40, y: 84 }, { x: 49, y: 83 },
  { x: 58, y: 82 }, { x: 67, y: 81 }, { x: 75, y: 79 }, { x: 83, y: 75 }, { x: 89, y: 68 }, { x: 92, y: 59 },
  { x: 93, y: 49 }, { x: 91, y: 39 }, { x: 87, y: 30 }, { x: 81, y: 22 }, { x: 73, y: 17 }, { x: 64, y: 14 },
  { x: 55, y: 13 }, { x: 46, y: 14 }, { x: 37, y: 15 }, { x: 28, y: 18 }, { x: 20, y: 23 }, { x: 14, y: 30 },
  { x: 10, y: 38 }, { x: 8, y: 47 }, { x: 8, y: 56 }, { x: 10, y: 65 }, { x: 17, y: 72 }, { x: 25, y: 76 },
  { x: 34, y: 77 }, { x: 44, y: 78 }, { x: 54, y: 77 }, { x: 64, y: 74 }, { x: 73, y: 70 }, { x: 81, y: 64 },
]

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
  }, [realPositions, order])

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

  const activePosition = animatedPositions[currentPlayerId] ?? realPositions[currentPlayerId] ?? 0
  const activeCoords = CELL_LAYOUT[activePosition]
  const activeColorIndex = order?.findIndex(pid => pid === currentPlayerId) ?? 0
  const activeColor = PLAYER_COLORS[(activeColorIndex + PLAYER_COLORS.length) % PLAYER_COLORS.length]

  return (
    <>
      <section className="city-board card-shell">
        <div className="city-board-top">
          <div>
            <p className="eyebrow">Карта города</p>
            <h2 className="board-title">Живой контур районов</h2>
          </div>
          <p className="board-subtitle">Теперь поле работает как вытянутый городской массив, а не как ровный квадратный планшет.</p>
        </div>

        <div className="city-zones">
          {Object.entries(GROUP_META).map(([id, group]) => (
            <span key={id} className="zone-pill" style={{ '--zone-accent': group.color }}>
              <i />
              <strong>{group.short}</strong>
            </span>
          ))}
        </div>

        <div className="city-map-shell">
          <div className="city-map-shape">
            <div className="city-map-glow city-map-glow-a" />
            <div className="city-map-glow city-map-glow-b" />

            <div className="district-mass mass-center" />
            <div className="district-mass mass-market" />
            <div className="district-mass mass-campus" />

            <div className="city-map-center">
              <div className="city-center-badge">ZHANA ADAMDAR</div>
              <h3>Наш Город</h3>
              <p>Неровный, живой, конфликтный. Игровое поле теперь воспринимается как настоящий городской силуэт.</p>
            </div>

            {BOARD.map(cell => {
              const coords = CELL_LAYOUT[cell.id]
              const meta = getCellMeta(cell)
              const playersHere = pinsByCell[cell.id] || []
              const ownerId = districts?.[cell.id]?.owner
              const ownerName = ownerId ? players?.[ownerId]?.name : null

              return (
                <button
                  key={cell.id}
                  className={`city-node ${cell.type === 'district' ? `district-group-${cell.group}` : `type-${cell.type}`}`}
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                    '--node-accent': meta.color,
                  }}
                  onClick={() => {
                    haptic('light')
                    setSelectedCell({ ...cell, ownerName })
                  }}
                >
                  <span className="city-node-index">{cell.id + 1}</span>
                  <span className="city-node-icon"><GameIcon type={meta.iconType} /></span>
                  <span className="city-node-title">{meta.short}</span>
                  <span className="city-node-caption">{cell.name}</span>
                  {ownerName && <span className="city-node-owner">{ownerName}</span>}
                  {playersHere.length > 0 && <span className="city-node-people">{playersHere.length}</span>}
                </button>
              )
            })}

            {activeCoords && (
              <div
                className="active-node-ring"
                style={{
                  left: `${activeCoords.x}%`,
                  top: `${activeCoords.y}%`,
                  '--ring-color': activeColor,
                }}
              />
            )}

            {Object.entries(pinsByCell).flatMap(([cellId, pins]) => {
              const coords = CELL_LAYOUT[cellId]
              return pins.map((pin, pinIndex) => (
                <div
                  key={pin.id}
                  className={`board-pin ${pin.isCurrent ? 'is-current' : ''} ${pin.isMe ? 'is-me' : ''}`}
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                    '--pin-color': pin.color,
                    '--pin-offset-x': `${(pinIndex % 2) * 18 - 9}px`,
                    '--pin-offset-y': `${Math.floor(pinIndex / 2) * 18 - 8}px`,
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
