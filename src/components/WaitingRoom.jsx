import { haptic } from '../telegram'

const MAX_PLAYERS = 8

const PLAYER_COLORS = [
  '#F5C842', '#A78BFA', '#34D399', '#F87171',
  '#60A5FA', '#FB923C', '#F472B6', '#22D3EE',
]

export default function WaitingRoom({ room, roomCode, user, isHost, onStart }) {
  const players = Object.values(room.players || {})

  function shareRoom() {
    haptic('light')
    const text = `Играем в "Наш Город"! Код комнаты: ${roomCode}`

    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
      return
    }

    if (window.Telegram?.WebApp?.switchInlineQuery) {
      window.Telegram.WebApp.switchInlineQuery(roomCode, ['users'])
      return
    }

    navigator.clipboard?.writeText(roomCode).catch(() => {})
  }

  return (
    <div className="waiting-screen screen-fade-in">
      <section className="waiting-header">
        <p className="eyebrow">Лобби ожидания</p>
        <div className="brand-wordmark-row center">
          <span className="brand-wordmark">ZHANA</span>
          <span className="brand-wordmark brand-wordmark-accent">ADAMDAR</span>
        </div>
        <h1>Соберите команду перед стартом</h1>
        <p>Хост запускает партию, когда в комнате будет минимум два игрока.</p>
      </section>

      <section className="room-code-block">
        <span className="code-label">Код комнаты</span>
        <div className="room-code">{roomCode}</div>
        <button className="btn btn-secondary" onClick={shareRoom}>
          Поделиться кодом
        </button>
      </section>

      <section className="players-waiting">
        <div className="waiting-section-head">
          <div>
            <p className="eyebrow">Игроки</p>
            <h2>{players.length}/{MAX_PLAYERS} в комнате</h2>
          </div>
          <span className="waiting-chip">{players.length >= 2 ? 'Можно стартовать' : 'Ждём ещё игроков'}</span>
        </div>

        <div className="players-list-waiting">
          {players.map((player, index) => (
            <article key={player.id} className="player-waiting-row" style={{ animationDelay: `${index * 0.09}s` }}>
              <div className="player-avatar-sm" style={{ '--avatar-color': PLAYER_COLORS[index % PLAYER_COLORS.length] }}>
                {player.name[0]?.toUpperCase()}
              </div>
              <div className="player-meta">
                <strong>
                  {player.name}
                  {player.id === user.id ? ' • ты' : ''}
                </strong>
                <span>{player.id === room.hostId ? 'Хост комнаты' : 'Подключён к лобби'}</span>
              </div>
              <div className="ready-dot" />
            </article>
          ))}

          {Array.from({ length: Math.max(0, MAX_PLAYERS - players.length) }).map((_, index) => (
            <div key={index} className="empty-slot">
              <div className="empty-slot-circle" />
              <span className="empty-slot-text">Свободный слот игрока</span>
            </div>
          ))}
        </div>
      </section>

      {isHost ? (
        <section className="waiting-cta">
          <p className="hint">
            {players.length >= 2
              ? 'Состав собран. Можно запускать карту и первый ход.'
              : 'Как только зайдёт ещё один человек, кнопка старта активируется.'}
          </p>
          {players.length >= 2 && (
            <button className="btn btn-primary btn-lg start-ready" onClick={() => { haptic('medium'); onStart() }}>
              Начать игру
            </button>
          )}
        </section>
      ) : (
        <section className="waiting-banner">
          <div className="spinner-sm" />
          <p>Ждём, пока хост откроет игру для всех.</p>
        </section>
      )}
    </div>
  )
}
