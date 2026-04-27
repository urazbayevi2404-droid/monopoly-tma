import { useEffect, useMemo, useState } from 'react'
import { db, ref, onValue, update, get } from '../firebase'
import { safeUpdate, safeGet, getErrorMessage } from '../firebase-utils'
import {
  createInitialGameState, rollDice, getNewPosition, passedStart,
  drawCard, getPathResult, checkEndConditions, applyEffects,
} from '../game/logic'
import { BOARD, DISTRICT_CONFIG } from '../data/board'
import { OPPORTUNITY_CARDS } from '../data/cards'
import { playSfx } from '../game/sfx'
import { haptic } from '../telegram'
import CityTrack from '../components/CityTrack'
import PlayerList from '../components/PlayerList'
import BoardStrip from '../components/BoardStrip'
import DicePanel from '../components/DicePanel'
import CardPanel from '../components/CardPanel'
import ChallengePanel from '../components/ChallengePanel'
import MindsetPanel from '../components/MindsetPanel'
import DistrictPanel from '../components/DistrictPanel'
import WaitingRoom from '../components/WaitingRoom'

const PHASE_META = {
  rolling: { title: 'Бросок кубиков', note: 'Ход начинается с движения по карте.' },
  reading_card: { title: 'Карточка события', note: 'Выбери направление или активируй бонус.' },
  challenge_window: { title: 'Окно возражений', note: 'Остальные игроки ещё могут вмешаться.' },
  challenging: { title: 'Ответ на спор', note: 'Активный игрок объясняет свою позицию.' },
  voting: { title: 'Голосование', note: 'Комната решает, чей аргумент сильнее.' },
  buying: { title: 'Покупка района', note: 'Район можно закрепить за собой прямо сейчас.' },
  mindset_answer: { title: 'Проверка мышления', note: 'Нужен короткий и уверенный ответ.' },
  mindset_voting: { title: 'Оценка ответа', note: 'Игроки голосуют, насколько ответ попал в суть.' },
  resolving: { title: 'Итог хода', note: 'Фиксируем результат и передаём ход дальше.' },
}

function PhaseSheet({ title, subtitle, children, dockOpen, onToggle }) {
  return (
    <div className={`phase-sheet ${dockOpen ? 'is-open' : 'is-collapsed'}`}>
      <button className="phase-sheet-handle" onClick={onToggle} aria-label="Переключить панель хода" />
      <div className="phase-sheet-head">
        <div>
          <p className="eyebrow">Сейчас происходит</p>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {dockOpen && <div className="phase-sheet-body">{children}</div>}
    </div>
  )
}

export default function GameScreen({ roomCode, user, onGameOver }) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [diceToast, setDiceToast] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('city_game_sound') !== 'off')

  useEffect(() => {
    const unsubscribe = onValue(ref(db, `rooms/${roomCode}`), snap => {
      if (snap.exists()) {
        setRoom(snap.val())
        setLoading(false)
        setError('')
      }
    }, err => {
      setError(getErrorMessage(err))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [roomCode])

  useEffect(() => {
    if (!room || room.status !== 'playing') return
    const end = checkEndConditions(room)
    if (end && room.status !== 'finished') {
      safeUpdate(`rooms/${roomCode}`, { status: 'finished', endReason: end.reason })
        .catch(err => setError(getErrorMessage(err)))
      onGameOver()
    }
  }, [room, roomCode, onGameOver])

  useEffect(() => {
    if (!room?.turn?.phase) return
    setSheetOpen(true)
  }, [room?.turn?.phase, room?.turn?.card?.id])

  useEffect(() => {
    localStorage.setItem('city_game_sound', soundEnabled ? 'on' : 'off')
  }, [soundEnabled])

  const isHost = room?.hostId === user.id
  const gameStarted = room?.status === 'playing'
  const currentPlayerId = gameStarted ? room.playerOrder?.[room.currentTurnIndex] : null
  const currentPlayerData = room?.players?.[currentPlayerId]
  const isMyTurn = currentPlayerId === user.id
  const phase = room?.turn?.phase
  const phaseMeta = PHASE_META[phase] || { title: 'Фаза хода', note: 'Следи за развитием партии.' }
  const myData = room?.players?.[user.id]

  const districtCell = useMemo(() => {
    if (!currentPlayerData) return null
    return BOARD[currentPlayerData.position]
  }, [currentPlayerData])

  function getOpportunityCard(cardId) {
    return OPPORTUNITY_CARDS.find(card => card.id === cardId) || null
  }

  async function startGame() {
    try {
      const snap = await safeGet(`rooms/${roomCode}`)
      const currentRoom = snap.val()
      const count = Object.keys(currentRoom.players || {}).length
      if (count < 2) {
        alert('Нужно минимум 2 игрока')
        return
      }

      playSfx('turn', soundEnabled)
      await safeUpdate(`rooms/${roomCode}`, createInitialGameState(currentRoom.players, currentRoom.hostId))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleRoll() {
    if (!isMyTurn || phase !== 'rolling') return

    haptic('medium')
    playSfx('roll', soundEnabled)

    const dice = rollDice()
    const diceSum = dice[0] + dice[1]
    const oldPosition = room.players[user.id].position
    const newPosition = getNewPosition(oldPosition, diceSum)
    const cell = BOARD[newPosition]
    const startBonus = passedStart(oldPosition, newPosition) ? 2 : 0

    const updates = {
      [`rooms/${roomCode}/players/${user.id}/position`]: newPosition,
      [`rooms/${roomCode}/turn/dice`]: dice,
      [`rooms/${roomCode}/turn/phase`]: 'cell_action',
      [`rooms/${roomCode}/turn/phaseStartedAt`]: Date.now(),
    }

    if (startBonus > 0) {
      updates[`rooms/${roomCode}/players/${user.id}/influence`] = (room.players[user.id].influence || 0) + startBonus
    }

    try {
      await safeUpdate('/', updates)
    } catch (err) {
      setError(getErrorMessage(err))
      return
    }

    setDiceToast(diceSum)
    window.setTimeout(() => setDiceToast(null), 1500)
    window.setTimeout(() => resolveCellAction(cell), 320)
  }

  async function resolveCellAction(cell) {
    if (cell.type === 'start') {
      await advanceTurn()
    } else if (cell.type === 'crisis') {
      await applyCrisis()
    } else if (cell.type === 'district') {
      const district = room.districts?.[cell.id]
      if (!district?.owner) {
        await update(ref(db, `rooms/${roomCode}/turn`), { phase: 'buying', phaseStartedAt: Date.now() })
      } else if (district.owner !== user.id) {
        await applyRent(cell.id, district.owner)
      } else {
        await advanceTurn()
      }
    } else if (cell.type === 'problem') {
      const card = drawCard('problem', room.decks, room.drawnCounts)
      await update(ref(db, `rooms/${roomCode}`), {
        'turn/phase': 'reading_card',
        'turn/card': { type: 'problem', id: card.id },
        'turn/phaseStartedAt': Date.now(),
        'drawnCounts/problem': (room.drawnCounts?.problem || 0) + 1,
      })
    } else if (cell.type === 'mindset') {
      const card = drawCard('mindset', room.decks, room.drawnCounts)
      await update(ref(db, `rooms/${roomCode}`), {
        'turn/phase': 'mindset_answer',
        'turn/card': { type: 'mindset', id: card.id },
        'turn/phaseStartedAt': Date.now(),
        'drawnCounts/mindset': (room.drawnCounts?.mindset || 0) + 1,
      })
    } else if (cell.type === 'opportunity') {
      const card = drawCard('opportunity', room.decks, room.drawnCounts)
      await update(ref(db, `rooms/${roomCode}`), {
        'turn/phase': 'reading_card',
        'turn/card': { type: 'opportunity', id: card.id },
        'turn/phaseStartedAt': Date.now(),
        'drawnCounts/opportunity': (room.drawnCounts?.opportunity || 0) + 1,
      })
    } else if (cell.type === 'fork') {
      const card = drawCard('fork', room.decks, room.drawnCounts)
      await update(ref(db, `rooms/${roomCode}`), {
        'turn/phase': 'reading_card',
        'turn/card': { type: 'fork', id: card.id },
        'turn/phaseStartedAt': Date.now(),
        'drawnCounts/fork': (room.drawnCounts?.fork || 0) + 1,
      })
    }
  }

  async function applyCrisis() {
    const newPlayers = {}
    for (const playerId of room.playerOrder) {
      newPlayers[playerId] = {
        ...room.players[playerId],
        influence: Math.max(0, room.players[playerId].influence - 1),
      }
    }

    await update(ref(db, `rooms/${roomCode}`), {
      cityLevel: Math.max(0, (room.cityLevel || 10) - 2),
      players: newPlayers,
      'turn/phase': 'resolving',
      'turn/card': { type: 'crisis' },
      'turn/phaseStartedAt': Date.now(),
    })
  }

  async function applyRent(cellId, ownerId) {
    const cell = BOARD[cellId]
    const config = DISTRICT_CONFIG[cell.group]
    const ownerCells = BOARD.filter(boardCell => boardCell.type === 'district' && boardCell.group === cell.group)
    const hasMonopoly = ownerCells.every(boardCell => room.districts?.[boardCell.id]?.owner === ownerId)
    const amount = Math.min(hasMonopoly ? config.monopolyRent : config.rent, room.players[user.id].influence)

    await update(ref(db, `rooms/${roomCode}/players`), {
      [user.id]: { ...room.players[user.id], influence: Math.max(0, room.players[user.id].influence - amount) },
      [ownerId]: { ...room.players[ownerId], influence: (room.players[ownerId].influence || 0) + amount },
    })

    await advanceTurn()
  }

  async function declarePath(path) {
    if (!isMyTurn || phase !== 'reading_card') return
    haptic('light')

    await update(ref(db, `rooms/${roomCode}/turn`), {
      phase: 'challenge_window',
      declaredPath: path,
      phaseStartedAt: Date.now(),
      challenge: {
        active: false,
        challengerId: null,
        reason: null,
        response: null,
        votes: {},
        result: null,
      },
    })

    window.setTimeout(async () => {
      const snap = await get(ref(db, `rooms/${roomCode}/turn`))
      const turn = snap.val()
      if (turn?.phase === 'challenge_window' && !turn?.challenge?.active) {
        await resolvePath(turn.declaredPath, false, null)
      }
    }, 12000)
  }

  async function challengePath(reason) {
    if (isMyTurn || phase !== 'challenge_window' || !reason.trim()) return
    haptic('medium')

    await update(ref(db, `rooms/${roomCode}/turn`), {
      phase: 'challenging',
      'challenge/active': true,
      'challenge/challengerId': user.id,
      'challenge/reason': reason,
      phaseStartedAt: Date.now(),
    })
  }

  async function respondToChallenge(response) {
    if (!isMyTurn || phase !== 'challenging') return
    haptic('light')

    await update(ref(db, `rooms/${roomCode}/turn`), {
      phase: 'voting',
      'challenge/response': response,
      phaseStartedAt: Date.now(),
    })

    window.setTimeout(async () => {
      const snap = await get(ref(db, `rooms/${roomCode}/turn`))
      const turn = snap.val()
      if (turn?.phase === 'voting') await resolveVote(turn)
    }, 25000)
  }

  async function vote(voteValue) {
    if (isMyTurn || phase !== 'voting') return
    if (room.turn?.challenge?.challengerId === user.id) return

    haptic('light')
    await update(ref(db, `rooms/${roomCode}/turn/challenge/votes`), { [user.id]: voteValue })

    const snap = await get(ref(db, `rooms/${roomCode}/turn`))
    const turn = snap.val()
    const voters = room.playerOrder.filter(playerId => playerId !== currentPlayerId && playerId !== turn.challenge.challengerId)
    if (Object.keys(turn.challenge.votes || {}).length >= voters.length) {
      await resolveVote(turn)
    }
  }

  async function resolveVote(turnState) {
    const votes = turnState.challenge?.votes || {}
    const challengeWon = Object.values(votes).filter(value => value === 'challenge').length >
      Object.values(votes).filter(value => value === 'original').length
    const challengerId = turnState.challenge.challengerId

    await update(ref(db, `rooms/${roomCode}/players/${challengerId}`), {
      influence: Math.max(0, (room.players[challengerId].influence || 0) + (challengeWon ? 1 : -1)),
    })

    const finalPath = challengeWon
      ? (turnState.declaredPath === 'A' ? 'B' : 'A')
      : turnState.declaredPath

    await resolvePath(finalPath, challengeWon, challengerId)
  }

  async function resolvePath(path) {
    let diceForPathC = null
    if (path === 'C') diceForPathC = Math.ceil(Math.random() * 6)

    const { influenceDelta, cityDelta, pathResult } = getPathResult(path, diceForPathC, room.turn?.pathCInvested || false)
    const newInfluence = Math.max(0, (room.players[currentPlayerId]?.influence || 0) + influenceDelta)
    const newCity = Math.max(0, Math.min(20, (room.cityLevel || 10) + cityDelta))
    const pathBCount = pathResult === 'B'
      ? (room.players[currentPlayerId]?.pathBCount || 0) + 1
      : (room.players[currentPlayerId]?.pathBCount || 0)

    await update(ref(db, `rooms/${roomCode}`), {
      cityLevel: newCity,
      lastPathResult: pathResult,
      [`players/${currentPlayerId}/influence`]: newInfluence,
      [`players/${currentPlayerId}/pathBCount`]: pathBCount,
      'turn/phase': 'resolving',
      'turn/pathCDice': diceForPathC,
      'turn/resolvedPath': path,
      'turn/pathResult': pathResult,
      'turn/influenceDelta': influenceDelta,
      'turn/cityDelta': cityDelta,
      'turn/resultTitle': null,
      'turn/resultText': null,
      'turn/phaseStartedAt': Date.now(),
    })
  }

  async function resolveOpportunity() {
    if (!isMyTurn || phase !== 'reading_card' || room.turn?.card?.type !== 'opportunity') return

    haptic('medium')
    const card = getOpportunityCard(room.turn.card.id)
    if (!card) {
      setError('Карточка не найдена')
      return
    }

    const effects = typeof card.effect === 'function' ? (card.effect(room, currentPlayerId) || []) : []
    const result = applyEffects(effects, room.players, room.cityLevel || 10)
    const influenceDelta = (result.players[currentPlayerId]?.influence || 0) - (room.players[currentPlayerId]?.influence || 0)
    const cityDelta = result.cityLevel - (room.cityLevel || 10)

    await update(ref(db, `rooms/${roomCode}`), {
      players: result.players,
      cityLevel: result.cityLevel,
      'turn/phase': 'resolving',
      'turn/resolvedPath': null,
      'turn/pathResult': 'opportunity',
      'turn/influenceDelta': influenceDelta,
      'turn/cityDelta': cityDelta,
      'turn/resultTitle': card.title,
      'turn/resultText': typeof card.effect === 'function'
        ? 'Эффект карточки успешно применён.'
        : 'Эта карточка пока показана без автоматического эффекта.',
      'turn/phaseStartedAt': Date.now(),
    })
  }

  async function buyDistrict() {
    if (!isMyTurn || phase !== 'buying') return

    haptic('heavy')
    playSfx('buy', soundEnabled)

    const position = room.players[user.id].position
    const cell = BOARD[position]
    const config = DISTRICT_CONFIG[cell.group]

    if (room.players[user.id].influence < config.price) {
      alert('Недостаточно влияния')
      return
    }

    await update(ref(db, `rooms/${roomCode}`), {
      [`players/${user.id}/influence`]: room.players[user.id].influence - config.price,
      [`districts/${position}/owner`]: user.id,
      'turn/phase': 'done',
    })

    await advanceTurn()
  }

  async function skipBuying() {
    if (!isMyTurn || phase !== 'buying') return
    haptic('light')
    await advanceTurn()
  }

  async function finishResolving() {
    if (!isMyTurn || phase !== 'resolving') return
    haptic('light')
    await advanceTurn()
  }

  async function advanceTurn() {
    const nextIndex = (room.currentTurnIndex + 1) % room.playerOrder.length
    const newTurnNumber = (room.turnNumber || 1) + 1
    const end = checkEndConditions({
      cityLevel: room.cityLevel,
      turnNumber: newTurnNumber,
      playerOrder: room.playerOrder,
    })

    if (end) {
      await update(ref(db, `rooms/${roomCode}`), { status: 'finished', endReason: end.reason })
      onGameOver()
      return
    }

    playSfx('turn', soundEnabled)

    await update(ref(db, `rooms/${roomCode}`), {
      currentTurnIndex: nextIndex,
      turnNumber: newTurnNumber,
      turn: {
        phase: 'rolling',
        dice: null,
        card: null,
        declaredPath: null,
        pathCDice: null,
        pathCInvested: false,
        resolvedPath: null,
        pathResult: null,
        influenceDelta: null,
        cityDelta: null,
        resultTitle: null,
        resultText: null,
        phaseStartedAt: Date.now(),
        challenge: { active: false, challengerId: null, reason: null, response: null, votes: {}, result: null },
        mindset: { answer: null, votes: {}, result: null },
      },
    })
  }

  async function submitMindsetAnswer(answer) {
    if (!isMyTurn || phase !== 'mindset_answer') return
    haptic('light')

    await update(ref(db, `rooms/${roomCode}/turn`), {
      phase: 'mindset_voting',
      'mindset/answer': answer,
      phaseStartedAt: Date.now(),
    })

    window.setTimeout(async () => {
      const snap = await get(ref(db, `rooms/${roomCode}/turn`))
      const turn = snap.val()
      if (turn?.phase === 'mindset_voting') await resolveMindset(turn)
    }, 20000)
  }

  async function voteMindset(value) {
    if (isMyTurn || phase !== 'mindset_voting') return
    haptic('light')

    await update(ref(db, `rooms/${roomCode}/turn/mindset/votes`), { [user.id]: value })
    const snap = await get(ref(db, `rooms/${roomCode}/turn`))
    const turn = snap.val()
    const voterCount = room.playerOrder.filter(playerId => playerId !== currentPlayerId).length
    if (Object.keys(turn.mindset?.votes || {}).length >= voterCount) {
      await resolveMindset(turn)
    }
  }

  async function resolveMindset(turnState) {
    const votes = Object.values(turnState.mindset?.votes || {})
    const correct = votes.filter(value => value === 'correct').length
    const isCorrect = correct >= votes.filter(value => value === 'wrong').length
    const influenceDelta = isCorrect ? 2 : -1
    const cityDelta = isCorrect ? 1 : -1

    await update(ref(db, `rooms/${roomCode}`), {
      cityLevel: Math.max(0, Math.min(20, (room.cityLevel || 10) + cityDelta)),
      [`players/${currentPlayerId}/influence`]: Math.max(0, (room.players[currentPlayerId]?.influence || 0) + influenceDelta),
      'turn/phase': 'resolving',
      'turn/mindset/result': isCorrect ? 'correct' : 'wrong',
      'turn/influenceDelta': influenceDelta,
      'turn/cityDelta': cityDelta,
      'turn/phaseStartedAt': Date.now(),
    })
  }

  function renderPhaseBody() {
    if (!room) return null

    if (phase === 'rolling') {
      if (isMyTurn) {
        return <DicePanel dice={room.turn?.dice} onRoll={handleRoll} isMyTurn />
      }

      return (
        <div className="waiting-action">
          <div className="spinner-sm" />
          <span>{currentPlayerData?.name} готовит бросок кубиков</span>
        </div>
      )
    }

    if ((phase === 'reading_card' || phase === 'challenge_window') && room.turn?.card) {
      return (
        <CardPanel
          card={room.turn.card}
          phase={phase}
          isMyTurn={isMyTurn}
          declaredPath={room.turn?.declaredPath}
          onDeclare={room.turn?.card?.type === 'opportunity' ? resolveOpportunity : declarePath}
          onChallenge={challengePath}
          room={room}
          userId={user.id}
        />
      )
    }

    if (phase === 'challenging') {
      return (
        <ChallengePanel
          turn={room.turn}
          isMyTurn={isMyTurn}
          userId={user.id}
          onRespond={respondToChallenge}
        />
      )
    }

    if (phase === 'voting') {
      return (
        <ChallengePanel
          turn={room.turn}
          isMyTurn={isMyTurn}
          userId={user.id}
          onVote={vote}
          isVoting
        />
      )
    }

    if (phase === 'buying') {
      return (
        <DistrictPanel
          cellId={districtCell?.id}
          room={room}
          isMyTurn={isMyTurn}
          onBuy={buyDistrict}
          onSkip={skipBuying}
        />
      )
    }

    if (phase === 'mindset_answer') {
      return <MindsetPanel turn={room.turn} isMyTurn={isMyTurn} onSubmit={submitMindsetAnswer} />
    }

    if (phase === 'mindset_voting') {
      return (
        <MindsetPanel
          turn={room.turn}
          isMyTurn={isMyTurn}
          userId={user.id}
          onVote={voteMindset}
          isVoting
        />
      )
    }

    if (phase === 'resolving') {
      return (
        <div className="result-card">
          <div className="result-icon">
            {room.turn?.card?.type === 'crisis' ? '🔥' : room.turn?.pathResult === 'B' ? '✅' : room.turn?.pathResult === 'A' ? '⚠️' : '🎲'}
          </div>
          <div className="result-title">
            {room.turn?.card?.type === 'crisis'
              ? 'Кризис ударил по городу'
              : room.turn?.resultTitle || `Путь ${room.turn?.resolvedPath || ''}`}
          </div>
          <p className="result-text">
            {room.turn?.card?.type === 'crisis'
              ? 'Город потерял 2 уровня, а каждый игрок лишился 1 влияния.'
              : room.turn?.resultText || 'Результат шага зафиксирован. Можно передавать ход дальше.'}
          </p>
          <div className="result-deltas">
            <span className={room.turn?.influenceDelta >= 0 ? 'positive' : 'negative'}>
              {room.turn?.influenceDelta >= 0 ? '+' : ''}{room.turn?.influenceDelta} 💫
            </span>
            <span className={room.turn?.cityDelta >= 0 ? 'positive' : 'negative'}>
              {room.turn?.cityDelta >= 0 ? '+' : ''}{room.turn?.cityDelta} 🏙️
            </span>
          </div>
          {isMyTurn && (
            <button className="btn btn-primary" onClick={finishResolving}>
              Передать ход
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="waiting-action">
        <div className="spinner-sm" />
        <span>Подготавливаем следующий этап хода...</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Подключаемся к комнате...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="loading-screen">
        <p>Комната не найдена</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="game-layout screen-fade-in">
        <div className="centered-shell">
          <div className="error-panel">
            <div className="error-icon">⚠️</div>
            <h3>Ошибка</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => setError('')}>Закрыть</button>
          </div>
        </div>
      </div>
    )
  }

  if (room.status === 'waiting') {
    return (
      <WaitingRoom
        room={room}
        roomCode={roomCode}
        user={user}
        isHost={isHost}
        onStart={startGame}
      />
    )
  }

  return (
    <div className="game-layout screen-fade-in">
      <header className="game-header-zone">
        <div className="game-header-row">
          <div>
            <p className="eyebrow">Матч #{roomCode}</p>
            <h1>Наш Город</h1>
          </div>
          <button
            className={`sound-toggle ${soundEnabled ? 'is-on' : 'is-off'}`}
            onClick={() => {
              haptic('light')
              setSoundEnabled(value => !value)
            }}
          >
            {soundEnabled ? 'Звук: вкл' : 'Звук: выкл'}
          </button>
        </div>

        <CityTrack level={room.cityLevel || 10} />

        <PlayerList
          players={room.players}
          order={room.playerOrder}
          currentPlayerId={currentPlayerId}
          myId={user.id}
        />
      </header>

      <main className="game-map-zone">
        <section className="game-status-card">
          <div className="turn-main">
            <div>
              <p className="eyebrow">Ход {room.turnNumber || 1}</p>
              <h2>{isMyTurn ? 'Твой ход' : `Ход игрока ${currentPlayerData?.name || ''}`}</h2>
            </div>
            <div className={`turn-badge ${isMyTurn ? 'mine' : ''}`}>
              {room.currentTurnIndex + 1}/{room.playerOrder.length}
            </div>
          </div>
          <p className="turn-description">{phaseMeta.note}</p>
        </section>

        <BoardStrip
          players={room.players}
          order={room.playerOrder}
          districts={room.districts || {}}
          currentPlayerId={currentPlayerId}
          myId={user.id}
        />
      </main>

      <div className="game-dock">
        <div className="game-dock-copy">
          <p className="eyebrow">Активная сцена</p>
          <strong>{phaseMeta.title}</strong>
          <span>{isMyTurn ? 'У тебя есть действие' : 'Следи за ходом соперника'}</span>
        </div>
        <button className="btn btn-secondary game-dock-toggle" onClick={() => setSheetOpen(value => !value)}>
          {sheetOpen ? 'Свернуть' : 'Открыть'}
        </button>
      </div>

      <PhaseSheet
        title={phaseMeta.title}
        subtitle={phaseMeta.note}
        dockOpen={sheetOpen}
        onToggle={() => setSheetOpen(value => !value)}
      >
        {renderPhaseBody()}
      </PhaseSheet>

      {diceToast !== null && (
        <div className="dice-toast">
          <div className="dice-toast-num">{diceToast}</div>
          <div className="dice-toast-sub">шагов вперёд</div>
        </div>
      )}
    </div>
  )
}
