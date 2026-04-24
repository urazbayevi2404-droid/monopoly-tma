# 🚀 Deployment Guide

Полное руководство по развёртыванию **Наш Город** на Vercel.

## За 5 минут на продакшене

### 1️⃣ Подготовка GitHub

```bash
cd monopoly-tma

# Инициализируй git если ещё нет
git init

# Добавь файлы (но не .env!)
git add .
git commit -m "🎮 initial commit: monopoly tma game"

# Создай репозиторий на github.com и замени URL
git remote add origin https://github.com/YOUR_USERNAME/monopoly-tma.git
git branch -M main
git push -u origin main
```

### 2️⃣ Vercel Setup

1. Открой [vercel.com](https://vercel.com)
2. Кликни **Sign in** → выбери **GitHub**
3. Авторизуйся
4. **New Project** → выбери репозиторий `monopoly-tma`
5. **Create Project** → жди 2 минуты

### 3️⃣ Переменные окружения

После создания проекта:

1. **Settings** → **Environment Variables**
2. Добавь 8 переменных из своего `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. **Save** → **Deployments** → **Redeploy**

### 4️⃣ Готово!

Твой сайт доступен по ссылке типа:
```
https://monopoly-tma.vercel.app
```

---

## Добавление в Telegram Bot

### Create Bot (если ещё нет)

1. Напиши [@BotFather](https://t.me/botfather) в Telegram
2. `/newbot`
3. Имя: `Jana Adamdar Game`
4. Username: `jana_adamdar_game_bot`
5. Получишь **TOKEN**: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### Связь с Web App

1. Напиши [@BotFather](https://t.me/botfather)
2. `/mybots` → выбери бота
3. **Bot Settings** → **Menu Button**
4. **Web App**
5. Label: `🎮 Играть`
6. URL: `https://monopoly-tma.vercel.app`

### Тестирование

1. Напиши боту `/start`
2. Кликни на кнопку **Играть**
3. Должна открыться игра!

---

## Обновление кода

Каждый раз когда пушишь в `main`:

```bash
git add .
git commit -m "✨ update: new cards"
git push
```

Vercel **автоматически пересоберёт и задеплоит** за 1-2 минуты! 🚀

---

## 🔧 Troubleshooting

### "Build failed"

Смотри **Deployments** → последний деплой → **Logs**

Частые проблемы:
- Забыл Environment Variables? Добавь их в Vercel Settings
- Синтаксис ошибка? Проверь `npm run build` локально

### "Telegram не открывает приложение"

- URL в Menu Button совпадает с твоим Vercel URL?
- Скопировал полный URL? Не забыл `https://`?
- Попробуй обновить бота: `/mybots` → **Bot Settings** → обнови Menu Button

### "Приложение загружается бесконечно"

- Firebase ключи верные?
- Database в тест режиме?
- Проверь **Network** tab (Ctrl+Shift+K → Network)

---

## 📊 Мониторинг

### Vercel Dashboard

- **Deployments** — история всех деплоев
- **Logs** — логи сборки
- **Analytics** — посещаемость

### Firebase Console

- **Realtime Database** → активные коннекции
- **Usage** → сколько прочитано/написано данных
- Free tier: 100 одновременных соединений

---

## 💰 Затраты

- **Vercel**: бесплатно ∞
- **Firebase**: бесплатно на 100 одновремен. соединений (~10 игр по 10 человек)
- **Telegram**: бесплатно ∞

**Итого: $0/месяц**

---

## Готово! 🎉

Твоя игра в сети! Делись кодом и наслаждайся!

Если что-то не работает — смотри **README.md** или создай issue на GitHub.
