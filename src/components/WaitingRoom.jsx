export default function WaitingRoom({ room, roomCode, user, isHost, onStart }) {
  const players = Object.values(room.players || {})
  const shareText = `Играем в «Наш Город — Жаңа Адамдар»!\nКод комнаты: ${roomCode}`

  function share() {
    if (navigator.share) {
      navigator.share({ text: shareText })
    } else if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.switchInlineQuery(roomCode, ['users'])
    } else {
      navigator.clipboard?.writeText(roomCode)
      alert(`Код скопирован: ${roomCode}`)
    }
  }

  return (
    <div className="waiting-screen">
      <div className="waiting-header">
        <div className="brand-lockup brand-lockup-compact">
          <div className="brand-wordmark-box">
            <div className="brand-overline">community movement game</div>
            <div className="brand-wordmark-row">
              <div className="brand-wordmark">ZHANA</div>
              <div className="brand-wordmark brand-wordmark-accent">ADAMDAR</div>
            </div>
          </div>
        </div>
        <h1>🏙️ Наш Город</h1>
        <p>Комната ожидания</p>
      </div>

      <div className="room-code-block">
        <p className="code-label">Код комнаты</p>
        <div className="room-code">{roomCode}</div>
        <button className="btn btn-secondary" onClick={share}>
          📤 Поделиться кодом
        </button>
      </div>

      <div className="players-waiting">
        <h3>Игроки ({players.length}/8)</h3>
        <div className="players-list-waiting">
          {players.map(p => (
            <div key={p.id} className="player-waiting-row">
              <div className="player-avatar-sm">{p.name[0].toUpperCase()}</div>
              <span>{p.name}{p.id === room.hostId ? ' 👑' : ''}{p.id === user.id ? ' (ты)' : ''}</span>
              <span className="ready-dot">●</span>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <div className="host-actions">
          <p className="hint">Когда все зашли — нажми «Начать»</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={onStart}
            disabled={players.length < 2}
          >
            {players.length < 2 ? 'Нужно минимум 2 игрока' : '▶️ Начать игру'}
          </button>
        </div>
      ) : (
        <div className="waiting-msg">
          <div className="spinner-sm" />
          <p>Ждём пока хост начнёт игру...</p>
        </div>
      )}
    </div>
  )
}
