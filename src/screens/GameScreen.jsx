import { useState, useEffect } from 'react'
import { db, ref, onValue, update, get } from '../firebase'
import { safeUpdate, safeGet, getErrorMessage } from '../firebase-utils'
import {
  createInitialGameState, rollDice, getNewPosition, passedStart,
  drawCard, getPathResult, calcRent, checkEndConditions, applyEffects, cellLabel,
} from '../game/logic'
import { BOARD, DISTRICT_CONFIG } from '../data/board'
import { OPPORTUNITY_CARDS } from '../data/cards'
import CityTrack from '../components/CityTrack'
import PlayerList from '../components/PlayerList'
import BoardStrip from '../components/BoardStrip'
import DicePanel from '../components/DicePanel'
import CardPanel from '../components/CardPanel'
import ChallengePanel from '../components/ChallengePanel'
import MindsetPanel from '../components/MindsetPanel'
import DistrictPanel from '../components/DistrictPanel'
import WaitingRoom from '../components/WaitingRoom'

const PHASE_LABELS = {
  rolling: 'Бросок кубиков',
  reading_card: 'Чтение карточки',
  challenge_window: 'Окно обсуждения',
  challenging: 'Ответ на оспаривание',
  voting: 'Голосование',
  buying: 'Покупка района',
  mindset_answer: 'Ответ на вопрос',
  mindset_voting: 'Оценка ответа',
  resolving: 'Итог хода',
}

export default function GameScreen({ roomCode, user, onGameOver }) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Слушаем состояние комнаты в Firebase
  useEffect(() => {
    const unsubscribe = onValue(ref(db, `rooms/${roomCode}`), snap => {
      if (snap.exists()) {
        setRoom(snap.val())
        setLoading(false)
        setError('')
      }
    }, (err) => {
      setError(getErrorMessage(err))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [roomCode])

  // Проверяем конец игры
  useEffect(() => {
    if (!room || room.status !== 'playing') return
    const end = checkEndConditions(room)
    if (end && room.status !== 'finished') {
      safeUpdate(`rooms/${roomCode}`, { status: 'finished', endReason: end.reason })
        .catch(err => setError(getErrorMessage(err)))
      onGameOver()
    }
  }, [room, roomCode, onGameOver])

  const isHost = room?.hostId === user.id
  const gameStarted = room?.status === 'playing'
  const currentPlayerId = gameStarted ? room.playerOrder?.[room.currentTurnIndex] : null
  const isMyTurn = currentPlayerId === user.id
  const phase = room?.turn?.phase

  function getOpportunityCard(cardId) {
    return OPPORTUNITY_CARDS.find(card => card.id === cardId) || null
  }

  // Запустить игру (только хост)
  async function startGame() {
    try {
      const snap = await safeGet(`rooms/${roomCode}`)
      const r = snap.val()
      const playerCount = Object.keys(r.players || {}).length
      if (playerCount < 2) { alert('Нужно минимум 2 игрока!'); return }

      const initialState = createInitialGameState(r.players, r.hostId)
      await safeUpdate(`rooms/${roomCode}`, initialState)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  // Бросить кубик (только текущий игрок)
  async function handleRoll() {
    if (!isMyTurn || phase !== 'rolling') return
    const dice = rollDice()
    const diceSum = dice[0] + dice[1]
    const oldPos = room.players[user.id].position
    const newPos = getNewPosition(oldPos, diceSum)
    const cell = BOARD[newPos]
    const startBonus = passedStart(oldPos, newPos) ? 2 : 0

    const updates = {
      [`rooms/${roomCode}/players/${user.id}/position`]: newPos,
      [`rooms/${roomCode}/turn/dice`]: dice,
      [`rooms/${roomCode}/turn/phase`]: 'cell_action',
      [`rooms/${roomCode}/turn/phaseStartedAt`]: Date.now(),
    }

    if (startBonus > 0) {
      const newInfluence = (room.players[user.id].influence || 0) + startBonus
      updates[`rooms/${roomCode}/players/${user.id}/influence`] = newInfluence
    }

    try {
      await safeUpdate('/', updates)
    } catch (err) {
      setError(getErrorMessage(err))
      return
    }

    // Немедленно обработать простые клетки
    setTimeout(() => resolveCellAction(cell, newPos), 300)
  }

  async function resolveCellAction(cell, pos) {
    if (cell.type === 'start') {
      await advanceTurn()
    } else if (cell.type === 'crisis') {
      await applyCrisis()
    } else if (cell.type === 'district') {
      const dist = room.districts?.[pos]
      if (!dist?.owner) {
        await update(ref(db, `rooms/${roomCode}/turn`), { phase: 'buying', phaseStartedAt: Date.now() })
      } else if (dist.owner !== user.id) {
        await applyRent(pos, dist.owner)
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
    const updates = { 'cityLevel': Math.max(0, room.cityLevel - 2) }
    const newPlayers = {}
    for (const pid of room.playerOrder) {
      newPlayers[pid] = {
        ...room.players[pid],
        influence: Math.max(0, room.players[pid].influence - 1),
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
    const cfg = DISTRICT_CONFIG[cell.group]
    const ownerCells = BOARD.filter(c => c.type === 'district' && c.group === cell.group)
    const hasMonopoly = ownerCells.every(c => (room.districts?.[c.id]?.owner) === ownerId)
    const amount = Math.min(
      hasMonopoly ? cfg.monopolyRent : cfg.rent,
      room.players[user.id].influence
    )

    await update(ref(db, `rooms/${roomCode}/players`), {
      [user.id]: { ...room.players[user.id], influence: Math.max(0, room.players[user.id].influence - amount) },
      [ownerId]: { ...room.players[ownerId], influence: (room.players[ownerId].influence || 0) + amount },
    })
    await advanceTurn()
  }

  // Объявить путь
  async function declarePath(path) {
    if (!isMyTurn || phase !== 'reading_card') return
    await update(ref(db, `rooms/${roomCode}/turn`), {
      phase: 'challenge_window',
      declaredPath: path,
      phaseStartedAt: Date.now(),
      challenge: {
        active: false, challengerId: null, reason: null,
        response: null, votes: {}, result: null,
      },
    })
    // Автоматически закрыть окно оспаривания через 12 секунд если не оспорено
    setTimeout(async () => {
      const snap = await get(ref(db, `rooms/${roomCode}/turn`))
      const t = snap.val()
      if (t?.phase === 'challenge_window' && !t?.challenge?.active) {
        await resolvePath(t.declaredPath, false, null)
      }
    }, 12000)
  }

  // Оспорить выбор
  async function challengePath(reason) {
    if (isMyTurn || phase !== 'challenge_window' || !reason.trim()) return
    await update(ref(db, `rooms/${roomCode}/turn`), {
      phase: 'challenging',
      'challenge/active': true,
      'challenge/challengerId': user.id,
      'challenge/reason': reason,
      phaseStartedAt: Date.now(),
    })
  }

  // Ответить на оспаривание (активный игрок)
  async function respondToChallenge(response) {
    if (!isMyTurn || phase !== 'challenging') return
    await update(ref(db, `rooms/${roomCode}/turn`), {
      phase: 'voting',
      'challenge/response': response,
      phaseStartedAt: Date.now(),
    })
    // Закрыть голосование через 25 секунд
    setTimeout(async () => {
      const snap = await get(ref(db, `rooms/${roomCode}/turn`))
      const t = snap.val()
      if (t?.phase === 'voting') {
        await resolveVote(t)
      }
    }, 25000)
  }

  // Проголосовать
  async function vote(voteValue) {
    if (isMyTurn || phase !== 'voting') return
    if (room.turn?.challenge?.challengerId === user.id) return // challenger не голосует
    await update(ref(db, `rooms/${roomCode}/turn/challenge/votes`), {
      [user.id]: voteValue,
    })

    // Проверить все ли проголосовали
    const snap = await get(ref(db, `rooms/${roomCode}/turn`))
    const t = snap.val()
    const voters = room.playerOrder.filter(pid =>
      pid !== currentPlayerId && pid !== t.challenge.challengerId
    )
    const votedCount = Object.keys(t.challenge.votes || {}).length
    if (votedCount >= voters.length) {
      await resolveVote(t)
    }
  }

  async function resolveVote(turnState) {
    const votes = turnState.challenge?.votes || {}
    const challengeVotes = Object.values(votes).filter(v => v === 'challenge').length
    const originalVotes = Object.values(votes).filter(v => v === 'original').length
    const challengeWon = challengeVotes > originalVotes

    // Бонус/штраф оспаривателю
    const cid = turnState.challenge.challengerId
    const challenger = room.players[cid]
    const challengerInfluenceDelta = challengeWon ? 1 : -1
    await update(ref(db, `rooms/${roomCode}/players/${cid}`), {
      influence: Math.max(0, (challenger.influence || 0) + challengerInfluenceDelta),
    })

    const finalPath = challengeWon
      ? (turnState.declaredPath === 'A' ? 'B' : 'A')
      : turnState.declaredPath

    await resolvePath(finalPath, challengeWon, turnState.challenge.challengerId)
  }

  async function resolvePath(path, challengeWon, challengerId) {
    let diceForC = null
    if (path === 'C') {
      diceForC = Math.ceil(Math.random() * 6)
    }
    const { influenceDelta, cityDelta, pathResult } = getPathResult(
      path, diceForC, room.turn?.pathCInvested || false
    )

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
      'turn/pathCDice': diceForC,
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

    const card = getOpportunityCard(room.turn.card.id)
    if (!card) {
      setError('Не удалось найти карточку возможности')
      return
    }

    const effects = typeof card.effect === 'function'
      ? (card.effect(room, currentPlayerId) || [])
      : []

    const result = applyEffects(effects, room.players, room.cityLevel || 10)
    const influenceDelta =
      (result.players[currentPlayerId]?.influence || 0) - (room.players[currentPlayerId]?.influence || 0)
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
        ? 'Эффект карточки применен.'
        : 'Эта карточка пока не автоматизирована. Ход продолжен без эффекта.',
      'turn/phaseStartedAt': Date.now(),
    })
  }

  async function buyDistrict() {
    if (!isMyTurn || phase !== 'buying') return
    const pos = room.players[user.id].position
    const cell = BOARD[pos]
    const cfg = DISTRICT_CONFIG[cell.group]
    if (room.players[user.id].influence < cfg.price) { alert('Недостаточно Влияния'); return }

    await update(ref(db, `rooms/${roomCode}`), {
      [`players/${user.id}/influence`]: room.players[user.id].influence - cfg.price,
      [`districts/${pos}/owner`]: user.id,
      'turn/phase': 'done',
    })
    await advanceTurn()
  }

  async function skipBuying() {
    if (!isMyTurn || phase !== 'buying') return
    await advanceTurn()
  }

  async function finishResolving() {
    if (!isMyTurn || phase !== 'resolving') return
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

  // Ответ на сбой мышления
  async function submitMindsetAnswer(answer) {
    if (!isMyTurn || phase !== 'mindset_answer') return
    await update(ref(db, `rooms/${roomCode}/turn`), {
      phase: 'mindset_voting',
      'mindset/answer': answer,
      phaseStartedAt: Date.now(),
    })
    setTimeout(async () => {
      const snap = await get(ref(db, `rooms/${roomCode}/turn`))
      const t = snap.val()
      if (t?.phase === 'mindset_voting') await resolveMindset(t)
    }, 20000)
  }

  async function voteMindset(v) {
    if (isMyTurn || phase !== 'mindset_voting') return
    await update(ref(db, `rooms/${roomCode}/turn/mindset/votes`), { [user.id]: v })
    const snap = await get(ref(db, `rooms/${roomCode}/turn`))
    const t = snap.val()
    const voterCount = room.playerOrder.filter(p => p !== currentPlayerId).length
    if (Object.keys(t.mindset?.votes || {}).length >= voterCount) {
      await resolveMindset(t)
    }
  }

  async function resolveMindset(turnState) {
    const votes = Object.values(turnState.mindset?.votes || {})
    const correct = votes.filter(v => v === 'correct').length
    const wrong = votes.filter(v => v === 'wrong').length
    const isCorrect = correct >= wrong

    const delta = isCorrect ? 2 : -1
    const cityDelta = isCorrect ? 1 : -1

    await update(ref(db, `rooms/${roomCode}`), {
      cityLevel: Math.max(0, Math.min(20, (room.cityLevel || 10) + cityDelta)),
      [`players/${currentPlayerId}/influence`]: Math.max(0, (room.players[currentPlayerId]?.influence || 0) + delta),
      'turn/phase': 'resolving',
      'turn/mindset/result': isCorrect ? 'correct' : 'wrong',
      'turn/influenceDelta': delta,
      'turn/cityDelta': cityDelta,
      'turn/phaseStartedAt': Date.now(),
    })
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Подключаемся...</p></div>
  if (!room) return <div className="loading-screen"><p>Комната не найдена</p></div>

  if (error) {
    return (
      <div className="game-screen">
        <div className="error-panel">
          <div className="error-icon">⚠️</div>
          <h3>Произошла ошибка</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => setError('')}>
            Закрыть
          </button>
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

  const currentPlayerData = room.players?.[currentPlayerId]
  const myData = room.players?.[user.id]
  const phaseLabel = PHASE_LABELS[phase] || 'Игровая фаза'

  return (
    <div className="game-screen">
      <CityTrack level={room.cityLevel || 10} />

      <PlayerList
        players={room.players}
        order={room.playerOrder}
        currentPlayerId={currentPlayerId}
        myId={user.id}
      />

      <BoardStrip
        myPosition={myData?.position || 0}
        players={room.players}
        order={room.playerOrder}
        districts={room.districts || {}}
        currentPlayerId={currentPlayerId}
        myId={user.id}
      />

      <div className="turn-indicator">
        {isMyTurn
          ? <span className="my-turn-badge">🎯 Твой ход</span>
          : <span className="other-turn-badge">⏳ Ход: {currentPlayerData?.name}</span>
        }
      </div>

      <div className={`action-area phase-${phase || 'idle'}`}>
        <div className="phase-ribbon">
          <div>
            <p className="phase-kicker">Сейчас происходит</p>
            <h3>{phaseLabel}</h3>
          </div>
          <span className="phase-step">
            Ход {room.turnNumber || 1} · игрок {room.currentTurnIndex + 1}/{room.playerOrder.length}
          </span>
        </div>
        {phase === 'rolling' && isMyTurn && (
          <DicePanel dice={room.turn?.dice} onRoll={handleRoll} isMyTurn={isMyTurn} />
        )}

        {phase === 'rolling' && !isMyTurn && (
          <div className="waiting-msg">
            <div className="spinner-sm" />
            <p>{currentPlayerData?.name} бросает кубик...</p>
          </div>
        )}

        {(phase === 'reading_card' || phase === 'challenge_window') && room.turn?.card && (
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
        )}

        {phase === 'challenging' && (
          <ChallengePanel
            turn={room.turn}
            isMyTurn={isMyTurn}
            userId={user.id}
            onRespond={respondToChallenge}
          />
        )}

        {phase === 'voting' && (
          <ChallengePanel
            turn={room.turn}
            isMyTurn={isMyTurn}
            userId={user.id}
            onVote={vote}
            isVoting
          />
        )}

        {phase === 'buying' && (
          <DistrictPanel
            cellId={currentPlayerData?.position}
            room={room}
            isMyTurn={isMyTurn}
            onBuy={buyDistrict}
            onSkip={skipBuying}
          />
        )}

        {phase === 'mindset_answer' && (
          <MindsetPanel
            turn={room.turn}
            isMyTurn={isMyTurn}
            onSubmit={submitMindsetAnswer}
          />
        )}

        {phase === 'mindset_voting' && (
          <MindsetPanel
            turn={room.turn}
            isMyTurn={isMyTurn}
            userId={user.id}
            onVote={voteMindset}
            isVoting
          />
        )}

        {phase === 'resolving' && (
          <div className="resolving-panel">
            <div className="result-card">
              {room.turn?.card?.type === 'crisis' && (
                <>
                  <div className="result-icon">🔥</div>
                  <h3>Кризис города!</h3>
                  <p>Город –2, все –1 Влияния</p>
                </>
              )}
              {room.turn?.card?.type !== 'crisis' && (
                <>
                  <div className={`result-icon ${room.turn?.pathResult === 'B' ? 'good' : 'bad'}`}>
                    {room.turn?.pathResult === 'B' ? '✅' : room.turn?.pathResult === 'A' ? '❌' : '🎲'}
                  </div>
                  <h3>{room.turn?.resultTitle || `Путь ${room.turn?.resolvedPath || ''}`}</h3>
                  {room.turn?.resultText && (
                    <p className="result-text">{room.turn.resultText}</p>
                  )}
                  <div className="result-deltas">
                    <span className={room.turn?.influenceDelta > 0 ? 'positive' : 'negative'}>
                      💫 {room.turn?.influenceDelta > 0 ? '+' : ''}{room.turn?.influenceDelta} Влияния
                    </span>
                    <span className={room.turn?.cityDelta > 0 ? 'positive' : 'negative'}>
                      🏙️ {room.turn?.cityDelta > 0 ? '+' : ''}{room.turn?.cityDelta} Город
                    </span>
                  </div>
                </>
              )}
              {isMyTurn && (
                <button className="btn btn-primary" onClick={finishResolving}>
                  Продолжить →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
