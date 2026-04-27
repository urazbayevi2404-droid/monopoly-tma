import { useEffect, useMemo, useRef, useState } from 'react'
import { BOARD, DISTRICT_CONFIG, CELL_EMOJIS } from '../data/board'
import { haptic } from '../telegram'

export const PLAYER_COLORS = [
  '#F5C842', '#A78BFA', '#34D399', '#F87171',
  '#60A5FA', '#FB923C', '#F472B6', '#22D3EE',
]

const GROUP_META = {
  1: { name: 'Спальный район', short: 'Жилой', icon: 'Дом', color: '#60A5FA' },
  2: { name: 'Рынок', short: 'Рынок', icon: 'Торг', color: '#F97316' },
  3: { name: 'Школьный квартал', short: 'Школа', icon: 'Знание', color: '#34D399' },
  4: { name: 'Деловой центр', short: 'Центр', icon: 'Бизнес', color: '#818CF8' },
  5: { name: 'Площадь', short: 'Площадь', icon: 'Парк', color: '#14B8A6' },
  6: { name: 'Кампус', short: 'Кампус', icon: 'Идея', color: '#F472B6' },
}

const CELL_META = {
  start: { label: 'Старт', short: 'Старт', color: '#F5C842' },
  problem: { label: 'Проблема', short: 'Риск', color: '#EF4444' },
  opportunity: { label: 'Возможность', short: 'Шанс', color: '#34D399' },
  mindset: { label: 'Сбой мышления', short: 'Майндсет', color: '#A78BFA' },
  fork: { label: 'Развилка', short: 'Выбор', color: '#F59E0B' },
  crisis: { label: 'Кризис', short: 'Кризис', color: '#DC2626' },
}

const TYPE_DESCRIPTIONS = {
  start: 'Стартовая клетка. За полный круг игрок получает +2 влияния.',
  district: 'Свободный городской район. Можно купить и потом собирать аренду.',
  problem: 'Городская проблема. Нужно выбрать, как действовать дальше.',
  opportunity: 'Окно возможностей. Даёт шанс усилить себя или город.',
  mindset: 'Проверка мышления. Игрок отвечает, остальные оценивают ответ.',
  fork: 'Развилка с долгосрочными последствиями для хода партии.',
  crisis: 'Городской кризис. Бьёт по уровню города и по игрокам одновременно.',
}

const CITY_LAYOUT = [
  [0, 1, 2, 3, 4, 5],
  [17, 18, 19, 20, 21, 6],
  [16, 31, 32, 33, 22, 7],
  [15, 30, 35, 34, 23, 8],
  [14, 29, 28, 27, 24, 9],
  [13, 12, 11, 10, 25, 26],
]

function buildCellPositionMap() {
  const map = {}
  CITY_LAYOUT.forEach((row, rowIndex) => {
    row.forEach((cellId, colIndex) => {
      map[cellId] = { row: rowIndex + 1, col: colIndex + 1 }
    })
  })
  return map
}

const CELL_POSITIONS = buildCellPositionMap()

function getCellMeta(cell) {
  if (cell.type === 'district') {
    const group = GROUP_META[cell.group]
    return {
      label: group?.name || cell.name,
      short: group?.short || cell.name,
      color: group?.color || '#F5C842',
      zone: `district-${cell.group}`,
    }
  }

  const meta = CELL_META[cell.type] || CELL_META.problem
  return {
    label: meta.label,
    short: meta.short,
    color: meta.color,
    zone: cell.type,
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
      <div className="sheet shell-sheet cell-sheet">
        <div className="sheet-handle" />
        <div className="sheet-section">
          <div className="sheet-icon" style={{ '--sheet-accent': meta.color }}>
            {CELL_EMOJIS[cell.type]}
          </div>
          <p className="sheet-kicker">{meta.label}</p>
          <h3 className="sheet-title">{cell.name}</h3>
          <p className="sheet-copy">{TYPE_DESCRIPTIONS[cell.type]}</p>
        </div>

        {districtConfig && (
          <div className="sheet-grid">
            <div className="sheet-stat">
              <span>Цена</span>
              <strong>{districtConfig.price} 💫</strong>
            </div>
            <div className="sheet-stat">
              <span>Аренда</span>
              <strong>{districtConfig.rent} 💫</strong>
            </div>
            <div className="sheet-stat">
              <span>Монополия</span>
              <strong>{districtConfig.monopolyRent} 💫</strong>
            </div>
            <div className="sheet-stat">
              <span>Владелец</span>
              <strong>{ownerName || 'Свободно'}</strong>
            </div>
          </div>
        )}

        <button className="btn btn-secondary" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </>
  )
}

export default function BoardStrip({
  players,
  order,
  districts,
  currentPlayerId,
  myId,
}) {
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
        }, (index + 1) * 210)
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
  const activeCellCoords = CELL_POSITIONS[activePosition]
  const activeColorIndex = order?.findIndex(pid => pid === currentPlayerId) ?? 0
  const activeColor = PLAYER_COLORS[(activeColorIndex + PLAYER_COLORS.length) % PLAYER_COLORS.length]

  return (
    <>
      <section className="city-board card-shell">
        <div className="city-board-top">
          <div>
            <p className="eyebrow">Карта города</p>
            <h2 className="board-title">Районы, риски и точки роста</h2>
          </div>
          <p className="board-subtitle">Тапни по клетке и открой описание района или события.</p>
        </div>

        <div className="city-zones">
          {Object.entries(GROUP_META).map(([id, group]) => (
            <span key={id} className={`zone-pill zone-pill-${id}`}>
              <strong>{group.short}</strong>
              <span>{group.icon}</span>
            </span>
          ))}
        </div>

        <div className="city-board-grid-wrap">
          <div className="city-board-grid">
            {BOARD.map(cell => {
              const coords = CELL_POSITIONS[cell.id]
              const meta = getCellMeta(cell)
              const playersHere = pinsByCell[cell.id] || []
              const ownerId = districts?.[cell.id]?.owner
              const ownerName = ownerId ? players?.[ownerId]?.name : null

              return (
                <button
                  key={cell.id}
                  className={`city-cell city-cell-${meta.zone}`}
                  style={{
                    gridRow: coords.row,
                    gridColumn: coords.col,
                    '--cell-accent': meta.color,
                  }}
                  onClick={() => {
                    haptic('light')
                    setSelectedCell({ ...cell, ownerName })
                  }}
                >
                  <span className="city-cell-number">{cell.id + 1}</span>
                  <span className="city-cell-icon">{CELL_EMOJIS[cell.type]}</span>
                  <span className="city-cell-label">{meta.short}</span>
                  <span className="city-cell-name">{cell.name}</span>
                  {ownerName && <span className="city-cell-owner">Владелец: {ownerName}</span>}
                  {playersHere.length > 0 && (
                    <span className="city-cell-traffic">{playersHere.length} на клетке</span>
                  )}
                </button>
              )
            })}

            <div className="city-center">
              <div className="city-center-badge">ZHANA ADAMDAR</div>
              <h3>Наш Город</h3>
              <p>Настолка о влиянии, решениях и балансе между личной выгодой и жизнью города.</p>
            </div>

            {activeCellCoords && (
              <div
                className="active-cell-ring"
                style={{
                  gridRow: activeCellCoords.row,
                  gridColumn: activeCellCoords.col,
                  '--ring-color': activeColor,
                }}
              />
            )}

            {Object.entries(pinsByCell).flatMap(([cellId, pins]) => {
              const coords = CELL_POSITIONS[cellId]
              return pins.map((pin, pinIndex) => (
                <div
                  key={pin.id}
                  className={`board-pin ${pin.isCurrent ? 'is-current' : ''} ${pin.isMe ? 'is-me' : ''}`}
                  style={{
                    gridRow: coords.row,
                    gridColumn: coords.col,
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
