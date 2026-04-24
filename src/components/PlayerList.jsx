export default function PlayerList({ players, order, currentPlayerId, myId }) {
  if (!players || !order) return null
  return (
    <div className="player-list">
      {order.map(pid => {
        const p = players[pid]
        if (!p) return null
        const isCurrent = pid === currentPlayerId
        const isMe = pid === myId
        return (
          <div key={pid} className={`player-chip ${isCurrent ? 'current' : ''} ${isMe ? 'mine' : ''}`}>
            <div className="player-chip-avatar">{p.name[0].toUpperCase()}</div>
            <div className="player-chip-info">
              <span className="player-chip-name">{p.name}{isMe ? ' ★' : ''}</span>
              <span className="player-chip-influence">💫 {p.influence || 0}</span>
            </div>
            {isCurrent && <div className="current-dot" />}
          </div>
        )
      })}
    </div>
  )
}
