# 🛠️ Developer Guide

Как расширять и улучшать **Наш Город**.

## 🗂️ Структура кода

```
src/
├── App.jsx              # Управление состоянием экранов (Lobby → Game → GameOver)
├── main.jsx             # Инициализация React + Telegram Web App
├── firebase.js          # Firebase конфиг и импорты
├── firebase-utils.js    # Retry logic и error handling
├── telegram.js          # Telegram Web App API обёртки
│
├── game/
│   └── logic.js         # ВСЯ логика игры (очень важно!)
│                        # - rollDice, getNewPosition, getPathResult
│                        # - calcFinalScores, checkEndConditions
│                        # - applyEffects
│
├── data/
│   ├── board.js         # Доска (30 клеток, конфиг районов)
│   └── cards.js         # Все карточки (Проблемы, Сбои, Возможности, Развилки)
│
├── screens/
│   ├── Lobby.jsx        # Создать/войти в комнату
│   ├── GameScreen.jsx   # Основной экран игры (360 строк!)
│   ├── GameOver.jsx     # Показ результатов
│   └── WaitingRoom.jsx  # Ожидание игроков
│
├── components/          # Переиспользуемые компоненты UI
│   ├── CityTrack.jsx    # Полоса уровня города
│   ├── PlayerList.jsx   # Список игроков + их Влияние
│   ├── BoardStrip.jsx   # Визуализация доски
│   ├── DicePanel.jsx    # Кнопка броска кубика
│   ├── CardPanel.jsx    # Показ карточки + выбор пути
│   ├── ChallengePanel.jsx  # Форма оспаривания/ответа
│   ├── MindsetPanel.jsx # Вопрос + голосование по ответу
│   └── DistrictPanel.jsx # Купить район или нет
│
└── styles/
    └── main.css         # Все стили (CSS переменные для Telegram темы)
```

---

## 🔄 Поток данных

### Архитектура состояния

```
React Component State
        ↓
GameScreen.jsx listens to Firebase via onValue()
        ↓
room = {
  status: 'playing',
  players: { user_id: { position, influence, ... } },
  turn: { phase, card, declaredPath, ... },
  districts: { cell_id: { owner, ... } },
  cityLevel: 15,
  ...
}
        ↓
When action → safeUpdate() to Firebase
        ↓
Firebase triggers onValue() listener
        ↓
Component re-renders with new state
```

### Фазы игры (в turn.phase)

```
rolling
    ↓ (игрок кликает "Бросить")
cell_action → resolveCellAction()
    ↓ (если район, карточка, и т.д.)
reading_card (если карточка)
    ↓ (игрок объявляет путь)
challenge_window (12 сек для оспаривания)
    ↓ (может перейти к challenging)
challenging → voting
    ↓ (считаем голоса)
resolving (показ результата)
    ↓ (игрок кликает "Продолжить")
done → advanceTurn() → следующий игрок → rolling
```

---

## ✏️ Как добавить новую карточку

### 1. Добавь в src/data/cards.js

```javascript
export const PROBLEM_CARDS = [
  // ... существующие
  {
    id: 'problem_42',
    title: 'Новая проблема',
    description: 'Описание',
    pathA: 'Путь A: текст',
    pathB: 'Путь B: текст',
    pathC: 'Путь C: описание риска',
  },
]
```

### 2. Карточка будет автоматически выбираться из перемешанной колоды

В GameScreen.jsx функция `drawCard()` выбирает карточку из `logic.js`:

```javascript
const card = drawCard('problem', room.decks, room.drawnCounts)
```

Готово! 🎉

---

## 🎲 Как изменить механику пути

В `src/game/logic.js` функция `getPathResult()`:

```javascript
export function getPathResult(path, pathCDice, pathCInvested) {
  if (path === 'A') return { influenceDelta: 3, cityDelta: -2, pathResult: 'A' }
  if (path === 'B') return { influenceDelta: 2, cityDelta: 1, pathResult: 'B' }
  // ... путь C
}
```

Измени значения `influenceDelta` и `cityDelta` → экспортируй → готово!

---

## 🌐 Как добавить новую клетку на доску

### 1. Обнови доску в src/data/board.js

```javascript
export const BOARD = [
  { id: 0, type: 'start', label: '🏁 Старт' },
  // ...
  { id: 25, type: 'custom_event', group: 'special', label: '⭐ Новое событие' },
]
```

### 2. Добавь обработку в GameScreen.jsx → resolveCellAction()

```javascript
async function resolveCellAction(cell, pos) {
  // ...
  } else if (cell.type === 'custom_event') {
    // твоя логика
    await doCustomEvent()
  }
}
```

---

## 🐛 Отладка

### Смотри состояние Firebase

```javascript
// В консоли браузера:
import { db, ref } from './src/firebase'
import { onValue } from 'firebase/database'

onValue(ref(db, 'rooms/ABC123'), snap => {
  console.log('Room state:', snap.val())
})
```

### Просмотри логи

```javascript
// В GameScreen.jsx добавь:
useEffect(() => {
  if (room) console.log('Room updated:', room)
}, [room])
```

### Проверь ошибки

В браузере: **DevTools → Console** (F12)

---

## 🚀 Как задеплоить изменения

```bash
# 1. Локально протестируй
npm run dev

# 2. Закоммитить
git add .
git commit -m "✨ feature: new cards"

# 3. Пушить
git push

# 4. Vercel автоматически задеплоит!
# Проверь: vercel.com → Deployments
```

**Время деплоя**: 1–2 минуты

---

## 📊 Production Checklist

Перед публикацией убедись:

- [ ] `.env` имеет все Firebase ключи
- [ ] Firebase Database Rules в безопасном состоянии (не "test mode")
- [ ] `npm run build` работает без ошибок
- [ ] Протестировал на мобильном (Telegram)
- [ ] Обновил README если добавил фичу
- [ ] Нет `console.log()` в продакшене

---

## 🔒 Безопасность

### Firebase Rules (скопируй в Realtime Database → Rules)

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        "players": {
          "$userId": {
            ".validate": "newData.hasChildren(['id', 'name', 'influence', 'position'])"
          }
        }
      }
    }
  }
}
```

### Никогда не коммитай:
- `.env` (используй `.env.example`)
- `node_modules/`
- Приватные ключи

---

## 📚 Полезные ссылки

- **Firebase Realtime Database**: https://firebase.google.com/docs/database
- **React Docs**: https://react.dev
- **Telegram Web App API**: https://core.telegram.org/bots/webapps
- **Vite**: https://vitejs.dev

---

## 💡 Частые вопросы

### Как тестировать с несколькими игроками локально?

Открой приложение в нескольких вкладках браузера или используй **localhost** + другие девайсы на одной сети.

### Как очистить Firebase данные?

```javascript
// В Realtime Database Console:
// Выбери комнату и кликни Delete
```

### Как добавить анимации?

Используй CSS transitions или CSS animations в `main.css`:

```css
@keyframes slideIn {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.card-enter { animation: slideIn 0.3s ease-out; }
```

---

## 🎉 Готово к разработке!

Если что-то не ясно — смотри код! Он хорошо комментирован.

Happy coding! 🚀
