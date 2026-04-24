import { useState, useEffect } from 'react'
import { getTelegramUser } from './telegram'
import { hasFirebaseConfig } from './firebase'
import Lobby from './screens/Lobby'
import GameScreen from './screens/GameScreen'
import GameOver from './screens/GameOver'
import SetupRequired from './screens/SetupRequired'

export default function App() {
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState('lobby') // lobby | game | gameover
  const [roomCode, setRoomCode] = useState(null)

  useEffect(() => {
    if (!hasFirebaseConfig) return
    setUser(getTelegramUser())
  }, [])

  if (!hasFirebaseConfig) {
    return <SetupRequired />
  }

  if (!user) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Загрузка...</p>
      </div>
    )
  }

  if (screen === 'lobby') {
    return (
      <Lobby
        user={user}
        onJoin={code => { setRoomCode(code); setScreen('game') }}
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
      onPlayAgain={() => { setRoomCode(null); setScreen('lobby') }}
    />
  )
}
