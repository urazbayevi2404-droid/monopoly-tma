import { BOARD, DISTRICT_CONFIG } from '../data/board.js'
import { PROBLEM_CARDS, MINDSET_CARDS, OPPORTUNITY_CARDS, FORK_CARDS } from '../data/cards.js'

// Генерация 6-значного кода комнаты
export function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// Перемешать массив (Fisher-Yates)
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Начальное состояние игры
export function createInitialGameState(players, hostId) {
  const playerOrder = shuffle(Object.keys(players))
  const districts = {}
  BOARD.filter(c => c.type === 'district').forEach(c => {
    districts[c.id] = { owner: null, pioneer: null }
  })

  return {
    status: 'playing',
    hostId,
    playerOrder,
    currentTurnIndex: 0,
    turnNumber: 1,
    cityLevel: 10,
    lastPathResult: null,

    // Перемешанные колоды (храним как массив индексов)
    decks: {
      problem: shuffle(PROBLEM_CARDS.map((_, i) => i)),
      mindset: shuffle(MINDSET_CARDS.map((_, i) => i)),
      opportunity: shuffle(OPPORTUNITY_CARDS.map((_, i) => i)),
      fork: shuffle(FORK_CARDS.map((_, i) => i)),
    },
    drawnCounts: { problem: 0, mindset: 0, opportunity: 0, fork: 0 },

    districts,

    turn: {
      phase: 'rolling',       // rolling | cell_action | reading_card | path_declared |
                              // challenge_window | challenging | voting | resolving |
                              // buying | mindset_answer | mindset_voting | done
      dice: null,
      card: null,
      declaredPath: null,
      pathCDice: null,
      pathCInvested: false,
      phaseStartedAt: Date.now(),

      challenge: {
        active: false,
        challengerId: null,
        reason: null,
        response: null,
        votes: {},
        result: null,
      },

      mindset: {
        answer: null,
        votes: {},
        result: null,
      },
    },

    log: [],
  }
}

// Следующая карточка из колоды
export function drawCard(type, decks, drawnCounts) {
  const deck = decks[type]
  const count = drawnCounts[type]
  const cards = { problem: PROBLEM_CARDS, mindset: MINDSET_CARDS, opportunity: OPPORTUNITY_CARDS, fork: FORK_CARDS }
  const idx = deck[count % deck.length]
  return cards[type][idx]
}

// Результат броска кубиков
export function rollDice() {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]
}

// Новая позиция после броска
export function getNewPosition(currentPos, diceSum) {
  return (currentPos + diceSum) % BOARD.length
}

// Нужно ли проходить через Старт
export function passedStart(oldPos, newPos) {
  if (newPos >= oldPos) return false
  return newPos !== 0
}

// Последствия выбора пути
export function getPathResult(path, pathCDice, pathCInvested) {
  if (path === 'A') return { influenceDelta: 3, cityDelta: -2, pathResult: 'A' }
  if (path === 'B') return { influenceDelta: 2, cityDelta: 1, pathResult: 'B' }

  // Путь C
  const success = pathCDice >= 4
  if (pathCInvested) {
    return success
      ? { influenceDelta: 1, cityDelta: 1, pathResult: 'B' }   // +2 - 1 инвестиция = +1
      : { influenceDelta: -2, cityDelta: -1, pathResult: 'C_fail' } // -1 - 1 инвестиция = -2
  }
  return success
    ? { influenceDelta: 2, cityDelta: 0, pathResult: 'C_ok' }
    : { influenceDelta: -1, cityDelta: -1, pathResult: 'C_fail' }
}

// Аренда за район
export function calcRent(cellId, districts, playerOrder, players) {
  const cell = BOARD[cellId]
  if (cell.type !== 'district') return null
  const dist = districts[cellId]
  if (!dist.owner) return null
  const cfg = DISTRICT_CONFIG[cell.group]
  const ownerCells = BOARD.filter(c => c.type === 'district' && c.group === cell.group)
  const hasMonopoly = ownerCells.every(c => districts[c.id]?.owner === dist.owner)
  return { owner: dist.owner, amount: hasMonopoly ? cfg.monopolyRent : cfg.rent }
}

// Проверка условий конца игры
export function checkEndConditions(gameState) {
  if (gameState.cityLevel <= 0) return { reason: 'city_dead' }
  const totalTurns = gameState.playerOrder.length * 7
  if (gameState.turnNumber > totalTurns) return { reason: 'turns_done' }
  return null
}

// Городской бонус
export function getCityBonus(cityLevel) {
  if (cityLevel >= 18) return 6
  if (cityLevel >= 13) return 4
  if (cityLevel >= 8) return 2
  return 0
}

// Финальные очки
export function calcFinalScores(gameState) {
  const bonus = getCityBonus(gameState.cityLevel)
  return gameState.playerOrder.map(pid => {
    const p = gameState.players[pid]
    return {
      playerId: pid,
      name: p.name,
      influence: p.influence,
      cityBonus: bonus,
      total: p.influence + bonus,
      pathBCount: p.pathBCount || 0,
    }
  }).sort((a, b) => b.total - a.total || b.pathBCount - a.pathBCount)
}

// Применить результат карточки к состоянию игрока
export function applyEffects(effects, players, cityLevel) {
  let newCityLevel = cityLevel
  const newPlayers = { ...players }

  for (const e of effects) {
    if (e.type === 'influence') {
      newPlayers[e.pid] = {
        ...newPlayers[e.pid],
        influence: Math.max(0, (newPlayers[e.pid].influence || 0) + e.delta),
      }
    }
    if (e.type === 'city') {
      newCityLevel = Math.max(0, Math.min(20, newCityLevel + e.delta))
    }
    if (e.type === 'setFlag') {
      newPlayers[e.pid] = {
        ...newPlayers[e.pid],
        flags: {
          ...(newPlayers[e.pid]?.flags || {}),
          [e.flag]: e.value,
        },
      }
    }
  }

  return { players: newPlayers, cityLevel: newCityLevel }
}

// Лейбл для типа клетки
export function cellLabel(type) {
  const labels = {
    start: '🏁 Старт', district: '🏘️ Район', problem: '⚡ Проблема',
    mindset: '🧠 Сбой мышления', opportunity: '🌱 Возможность',
    fork: '🔀 Развилка', crisis: '🔥 Кризис',
  }
  return labels[type] || type
}

// Цвет для фазы (для UI)
export function phaseLabel(phase) {
  const labels = {
    rolling: 'Бросок кубиков',
    cell_action: 'Действие на клетке',
    reading_card: 'Карточка',
    path_declared: 'Путь объявлен',
    challenge_window: 'Оспаривание открыто',
    challenging: 'Оспаривание',
    voting: 'Голосование',
    resolving: 'Результат',
    buying: 'Купить район?',
    mindset_answer: 'Ответ на вопрос',
    mindset_voting: 'Голосование за ответ',
    done: 'Ход завершён',
  }
  return labels[phase] || phase
}
