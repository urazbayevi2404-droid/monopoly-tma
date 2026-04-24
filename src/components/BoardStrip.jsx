import { BOARD, CELL_EMOJIS, DISTRICT_CONFIG } from '../data/board'

export default function BoardStrip({ myPosition, players, order, districts }) {
  const cellsBefore = 2
  const cellsAfter = 3
  const totalCells = BOARD.length

  const cells = []
  for (let i = -cellsBefore; i <= cellsAfter; i++) {
    const idx = ((myPosition + i) % totalCells + totalCells) % totalCells
    cells.push({ cell: BOARD[idx], offset: i, idx })
  }

  // Кто где стоит
  const posMap = {}
  if (players && order) {
    order.forEach(pid => {
      const pos = players[pid]?.position
      if (pos !== undefined) {
        if (!posMap[pos]) posMap[pos] = []
        posMap[pos].push({ id: pid, name: players[pid].name })
      }
    })
  }

  return (
    <div className="board-strip">
      <div className="board-cells">
        {cells.map(({ cell, offset, idx }) => {
          const isCurrent = offset === 0
          const playersHere = posMap[idx] || []
          const districtOwner = cell.type === 'district' ? districts?.[idx]?.owner : null
          const ownerName = districtOwner && players?.[districtOwner]?.name

          return (
            <div
              key={idx}
              className={`board-cell ${isCurrent ? 'board-cell-current' : ''} ${cell.type}`}
              style={{ '--cell-color': cell.color }}
            >
              <div className="cell-type-icon">{CELL_EMOJIS[cell.type]}</div>
              <div className="cell-name">{cell.name}</div>
              {ownerName && <div className="cell-owner">👤 {ownerName}</div>}
              {playersHere.length > 0 && (
                <div className="cell-players">
                  {playersHere.map(p => (
                    <div key={p.id} className="cell-player-dot" title={p.name}>
                      {p.name[0]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="board-position-label">
        📍 Клетка {myPosition + 1} из {totalCells} · {BOARD[myPosition]?.name}
      </div>
    </div>
  )
}
