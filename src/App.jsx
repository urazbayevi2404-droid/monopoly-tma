import { useEffect, useState } from 'react'
import { getTelegramUser } from './telegram'
import { hasFirebaseConfig } from './firebase'
import Lobby from './screens/Lobby'
import GameScreen from './screens/GameScreen'
import GameOver from './screens/GameOver'
import SetupRequired from './screens/SetupRequired'

function BrandedLoading() {
  return (
    <div className="loading-screen branded-loading">
      <div className="brand-overline">community movement game</div>
      <div className="brand-wordmark-row center">
        <span className="brand-wordmark">ZHANA</span>
        <span className="brand-wordmark brand-wordmark-accent">ADAMDAR</span>
      </div>
      <div className="spinner" />
      <p>Запускаем городскую сессию...</p>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState('lobby')
  const [roomCode, setRoomCode] = useState(null)

  useEffect(() => {
    if (!hasFirebaseConfig) return
    setUser(getTelegramUser())
  }, [])

  if (!hasFirebaseConfig) {
    return <SetupRequired />
  }

  if (!user) {
    return <BrandedLoading />
  }

  if (screen === 'lobby') {
    return (
      <Lobby
        user={user}
        onJoin={code => {
          setRoomCode(code)
          setScreen('game')
        }}
      />
    )
  }

  if (screen === 'game') {
    return (
      <GameScreen
        roomCode={roomCode}
        user={user}
        onGameOver={() => setScreen('gameover')}
      />
    )
  }

  return (
    <GameOver
      roomCode={roomCode}
      user={user}
      onPlayAgain={() => {
        setRoomCode(null)
        setScreen('lobby')
      }}
    />
  )
}
