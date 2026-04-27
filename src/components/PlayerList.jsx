import { PLAYER_COLORS } from './BoardStrip'

export default function PlayerList({ players, order, currentPlayerId, myId }) {
  if (!players || !order) return null

  return (
    <div className="player-list">
      {order.map((playerId, index) => {
        const player = players[playerId]
        if (!player) return null

        const isCurrent = playerId === currentPlayerId
        const isMe = playerId === myId
        const color = PLAYER_COLORS[index % PLAYER_COLORS.length]

        return (
          <div key={playerId} className={`player-chip ${isCurrent ? 'current' : ''} ${isMe ? 'mine' : ''}`}>
            <div className="player-chip-avatar" style={{ background: color }}>
              {player.name[0]?.toUpperCase()}
            </div>
            <div className="player-chip-copy">
              <span className="player-chip-name">
                {player.name.split(' ')[0]}
                {isMe ? ' • ты' : ''}
              </span>
              <span className="player-chip-influence">{player.influence || 0} 💫</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
