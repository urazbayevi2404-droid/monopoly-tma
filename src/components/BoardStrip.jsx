import { BOARD, CELL_EMOJIS } from '../data/board'

function getBoardPlacement(idx) {
  if (idx <= 9) {
    return { row: 10, col: 10 - idx }
  }
  if (idx <= 17) {
    return { row: 19 - idx, col: 1 }
  }
  if (idx <= 27) {
    return { row: 1, col: idx - 17 }
  }
  return { row: idx - 26, col: 10 }
}

function getCellKind(type) {
  switch (type) {
    case 'district':
      return 'Район'
    case 'problem':
      return 'Проблема'
    case 'opportunity':
      return 'Возможность'
    case 'mindset':
      return 'Сбой мышления'
    case 'fork':
      return 'Развилка'
    case 'crisis':
      return 'Кризис'
    default:
      return 'Старт'
  }
}

export default function BoardStrip({
  myPosition,
  players,
  order,
  districts,
  currentPlayerId,
  myId,
}) {
  const totalCells = BOARD.length
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

  const myCell = BOARD[myPosition] || BOARD[0]
  const currentPlayerName = players?.[currentPlayerId]?.name
  const myPlayersHere = posMap[myPosition] || []
  const districtOwner = myCell.type === 'district' ? districts?.[myPosition]?.owner : null
  const ownerName = districtOwner ? players?.[districtOwner]?.name : null

  return (
    <div className="board-strip">
      <div className="board-header">
        <div>
          <p className="board-kicker">Карта города</p>
          <h3>Поле целиком</h3>
        </div>
        <div className="board-turn-pill">
          <span className="board-turn-dot" />
          {currentPlayerName ? `Сейчас ходит ${currentPlayerName}` : 'Ожидание игроков'}
        </div>
      </div>

      <div className="board-map-shell">
        <div className="board-map">
          {BOARD.map(cell => {
            const placement = getBoardPlacement(cell.id)
            const playersHere = posMap[cell.id] || []
            const isMine = myPosition === cell.id
            const isActiveCell = playersHere.some(player => player.id === currentPlayerId)
            const isMyTokenHere = playersHere.some(player => player.id === myId)

            return (
              <div
                key={cell.id}
                className={[
                  'board-map-cell',
                  `cell-${cell.type}`,
                  isMine ? 'board-map-cell-current' : '',
                  isActiveCell ? 'board-map-cell-active' : '',
                  isMyTokenHere ? 'board-map-cell-me' : '',
                ].filter(Boolean).join(' ')}
                style={{
                  gridRow: placement.row,
                  gridColumn: placement.col,
                  '--cell-color': cell.color,
                }}
              >
                <div className="board-map-cell-top">
                  <span className="board-map-index">{cell.id + 1}</span>
                  <span className="board-map-icon">{CELL_EMOJIS[cell.type]}</span>
                </div>
                <div className="board-map-name">{cell.name}</div>
                {playersHere.length > 0 && (
                  <div className="board-map-tokens">
                    {playersHere.slice(0, 3).map(player => (
                      <span key={player.id} className="board-map-token" title={player.name}>
                        {player.name[0]}
                      </span>
                    ))}
                    {playersHere.length > 3 && (
                      <span className="board-map-token more">+{playersHere.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <div className="board-map-center">
            <div className="board-center-badge">Наш Город</div>
            <div className="board-center-title">Городская карта партии</div>
            <p className="board-center-text">
              Видно, где сейчас ты, где соперники и какой участок поля решает текущий ход.
            </p>
          </div>
        </div>
      </div>

      <div className="board-focus-card">
        <div className="board-focus-label">Твоя позиция</div>
        <div className="board-focus-main">
          <div className="board-focus-icon">{CELL_EMOJIS[myCell.type]}</div>
          <div>
            <div className="board-focus-name">{myCell.name}</div>
            <div className="board-focus-meta">
              Клетка {myPosition + 1} из {totalCells} · {getCellKind(myCell.type)}
            </div>
          </div>
        </div>

        <div className="board-focus-footer">
          {ownerName ? (
            <span>Владелец района: {ownerName}</span>
          ) : (
            <span>{myPlayersHere.length > 1 ? `На клетке игроков: ${myPlayersHere.length}` : 'Клетка свободна'}</span>
          )}
        </div>
      </div>
    </div>
  )
}
