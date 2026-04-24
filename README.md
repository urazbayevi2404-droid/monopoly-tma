# 🏙️ Наш Город — Telegram Mini App

Онлайн-игра для активистов. Каждый играет со своего телефона в Telegram, всё бесплатно, без лагов благодаря Firebase Realtime Database.

---

## 🚀 Быстрый старт (5 минут)

### Шаг 1: Firebase Setup (база данных)

1. Открой [console.firebase.google.com](https://console.firebase.google.com)
2. **Create Project** → название `jana-adamdar-game` → Continue
3. Отключи Google Analytics → Create Project
4. Слева: **Build → Realtime Database → Create Database**
5. Выбери регион (любой) → **Start in test mode** (потом настроишь)
6. Жди 30 секунд...
7. Слева: **Project Settings** (шестерёнка) → **Your apps** → нажми `</> (Web)`
8. Зарегистрируй приложение → получишь конфиг

**Скопируй весь `firebaseConfig` объект**

### Шаг 2: Клонируй репо и установи зависимости

```bash
cd monopoly-tma
npm install
```

### Шаг 3: Создай .env файл

```bash
cp .env.example .env
```

Открой `.env` и вставь значения из Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=jana-adamdar-game.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://jana-adamdar-game-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=jana-adamdar-game
VITE_FIREBASE_STORAGE_BUCKET=jana-adamdar-game.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### Шаг 4: Запусти локально

```bash
npm run dev
```

Открой **http://localhost:5173** → введи своё имя → создай игру!

**Режим разработки**: если нет Telegram, приложение просит имя через диалог.

---

## 📱 Как играть

1. **Создатель** кликает "✨ Создать игру"
2. Получает **6-значный код** (например `ABC123`)
3. Делится кодом с друзьями
4. Друзья вводят код → входят в комнату
5. Когда 2-8 человек в комнате, создатель кликает "🚀 Старт"
6. **Игра началась!**

Каждый ход:
- 🎲 Бросок кубика
- 📍 Приземлился на клетку → действие
- 🔀 На развилке выбираешь путь (A/B/C)
- 🗣️ Остальные могут оспорить выбор
- 🏆 Путь B правильный (город поднимается), A соблазнителен (город падает)

**Конец игры**: 7 ходов на игрока. Если город упал до 0 → все проиграли. Победитель = максимум Влияния + бонус от города.

---

## 🔧 Firebase Security Rules (ВАЖНО!)

После первого тестирования обнови правила безопасности в Firebase:

В **Realtime Database → Rules**:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        "players": {
          "$userId": {
            ".validate": "auth.uid !== null || newData.child('id').exists()"
          }
        }
      }
    }
  }
}
```

---

## 🚀 Деплой на Vercel (бесплатно, 2 минуты)

1. Создай репозиторий GitHub и запушь код:
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/твой-юзер/monopoly-tma.git
git push -u origin main
```

2. Открой [vercel.com](https://vercel.com) → логинся через GitHub

3. **New Project** → выбери `monopoly-tma` репо

4. **Environment Variables** → добавь переменные из `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - (остальные 6 переменных)

5. **Deploy** → жди 2 минуты

URL будет типа `https://monopoly-tma.vercel.app`

---

## 🤖 Добавь в Telegram Bot

Создай бота через [@BotFather](https://t.me/botfather):

1. `/newbot`
2. Имя: `Jana Adamdar Game`
3. Username: `jana_adamdar_game_bot` (уникальное)
4. Получишь **TOKEN**

Добавь Web App в бота:

1. `/mybots` → выбери бота
2. **Bot Settings** → **Menu Button**
3. **Web App** → URL: `https://monopoly-tma.vercel.app`

Теперь в чате `/start` → кнопка "Играть" → открывается твоя игра!

---

## 🧪 Режим разработки

Если Telegram недоступен (локальное тестирование):
- Приложение попросит имя в диалоге
- Сохранит в localStorage
- Даст случайный ID `dev_xxxxx`
- Работает как обычно

Чтобы очистить dev сессию:
```javascript
// В консоли браузера:
localStorage.removeItem('dev_user_id')
localStorage.removeItem('dev_user_name')
```

---

## 📊 Структура проекта

```
monopoly-tma/
├── src/
│   ├── App.jsx              # главный компонент
│   ├── main.jsx             # инициализация
│   ├── firebase.js          # Firebase конфиг
│   ├── firebase-utils.js    # retry logic, error handling
│   ├── telegram.js          # Telegram Web App API
│   ├── game/
│   │   └── logic.js         # вся логика игры
│   ├── data/
│   │   ├── board.js         # доска (30 клеток)
│   │   └── cards.js         # все карточки
│   ├── screens/
│   │   ├── Lobby.jsx        # выбор комнаты
│   │   ├── GameScreen.jsx   # основной экран игры
│   │   ├── GameOver.jsx     # результаты
│   │   └── WaitingRoom.jsx  # ожидание игроков
│   ├── components/          # React компоненты UI
│   └── styles/
│       └── main.css         # стили
├── index.html               # HTML точка входа
├── vite.config.js           # Vite конфиг
├── package.json
└── .env                      # переменные окружения (не коммитить!)
```

---

## 🛠 Команды

```bash
# Локальная разработка
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## 🎮 Механика игры (для фасилитаторов)

### Три ресурса
- **💫 Влияние** — личные очки (0-20)
- **🏙️ Уровень города** — общий счётчик (0-20)
- **📍 Позиция** — место на доске (0-29)

### Пути
- **Путь A**: +3 Влияния, Город –2 (соблазнителен, но опасен)
- **Путь B**: +2 Влияния, Город +1 (правильное решение)
- **Путь C**: ?50/50? — риск (кубик)

### Конец игры
- После 7 ходов каждого
- ИЛИ если Город упал до 0 (все проиграли)
- Городской бонус: Город ≥18? +6 всем | ≥13? +4 | ≥8? +2 | иначе 0
- **Победитель** = макс. (Влияние + Бонус)

### Голос совести
Когда игрок объявляет путь, у остальных 12 сек оспорить его выбор. Если оспорят:
- Активный игрок отвечает на обвинение
- Все голосуют 25 сек
- Если оспариватель выиграл: путь инвертируется A↔B
- Оспариватель +1 или –1 Влияния в зависимости от исхода

---

## 🐛 Troubleshooting

### "Комната не найдена"
- Проверь, правильно ли ввёл код (заглавные буквы!)
- Может быть хост заново создал комнату

### "Firebase ошибка"
- Проверь `.env` — скопировал ли все значения?
- В Firebase → Database → пусто? Это нормально, создастся при первой игре
- Правила безопасности на "test mode"? Если нет — обнови Rules

### "Телефон зависает при броске"
- Проверь интернет
- Перезагрузи страницу (Ctrl+R)
- Firebase может быть перегружен при >100 одновремен. соединений (но это редко)

### "Telegram не интегрируется"
- Убедись, что запустил бота и добавил Web App в Menu Button
- URL в Menu Button совпадает с твоим деплоем?

---

## 📝 Лицензия

Свободный код для активистов. Используй как хочешь!

---

## 🙏 Спасибо

Сделано для **Жаңа Адамдар** — партии новых людей.

3. Добавь переменные окружения из `.env` в настройках Vercel (Settings → Environment Variables)
4. Deploy → получишь URL вида `https://your-app.vercel.app`

### ШАГ 5 — Telegram Bot

1. Открой Telegram → найди `@BotFather`
2. Напиши `/newbot` → введи название и username
3. Напиши `/newapp` → выбери своего бота → введи данные:
   - Title: `Наш Город`
   - Description: `Настольная игра о гражданском лидерстве`
   - Web App URL: `https://your-app.vercel.app` (твой URL из Vercel)
4. Готово! Бот создан.

### ШАГ 6 — Играть!

1. Открой своего бота в Telegram → Menu → Наш Город
2. Нажми **Создать игру** → получи код
3. Поделись кодом активистам
4. Каждый открывает бота и вводит код
5. Хост нажимает **Начать игру**

---

## Правила игры (кратко)

| Путь | Влияние | Город |
|------|---------|-------|
| **A** — пассивное решение | +3 | –2 |
| **B** — системное решение | +2 | +1 |
| **C** — рискованное (кубик) | ± | ± |

**Голос совести:** любой игрок может оспорить выбор за 12 секунд. Голосование → победитель получает +1 Влияния, проигравший –1.

**Конец игры:** 7 ходов на игрока. Высокий Город даёт всем бонус: 8–12 → +2, 13–17 → +4, 18–20 → +6.

**Если Город упал до 0 — все проигрывают.**

---

## Структура проекта

```
src/
├── data/
│   ├── board.js       — 36 клеток поля
│   └── cards.js       — все карточки (Проблемы, Сбой, Возможности, Развилки)
├── game/
│   └── logic.js       — вся игровая логика
├── screens/
│   ├── Lobby.jsx      — создать / войти
│   ├── GameScreen.jsx — основная игра
│   └── GameOver.jsx   — итоги
├── components/        — переиспользуемые компоненты
└── styles/main.css    — стили (Telegram theme variables)
```

---

## Firebase правила безопасности (опционально для продакшена)

В Firebase Console → Realtime Database → Rules замени на:
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```
Для полной игры этого достаточно. Это приватная игра — код комнаты знают только приглашённые.

---

## Технический стек

- **React 18 + Vite** — фронтенд
- **Firebase Realtime Database** — синхронизация состояния в реальном времени
- **Telegram Web App API** — авторизация, haptic feedback, нативный UI
- **Vercel** — хостинг

Всё бесплатно в пределах ~100 одновременных игроков (Firebase free tier).
