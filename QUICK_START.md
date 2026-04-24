# ⚡ QUICK START (за 10 минут)

## 1️⃣ Firebase (2 минуты)

```
Открой: console.firebase.google.com
→ Create Project (имя: jana-adamdar-game)
→ Build → Realtime Database → Create → test mode → Enable
→ Project Settings (⚙️) → Your apps (Web)
→ Copy firebaseConfig
```

## 2️⃣ Проект (3 минуты)

```bash
cd monopoly-tma

cp .env.example .env
# Открой .env и вставь 7 значений из firebaseConfig

npm install
npm run dev
```

Открой: **http://localhost:5173**

## 3️⃣ Тест (5 минут)

- Введи имя
- Создай комнату → получишь код
- В другой вкладке: введи той же код (войди)
- Жди 2 игроков → кликни "Начать"
- Играй!

---

## 🚀 Деплой (опционально)

```bash
# Push на GitHub
git add . && git commit -m "init" && git push

# На vercel.com:
# 1. Sign in via GitHub
# 2. New Project → выбери monopoly-tma
# 3. Environment Variables → добавь 7 переменных
# 4. Deploy!

# Получишь URL типа: https://monopoly-tma.vercel.app
```

---

## 📝 Дальше читай

- **README.md** — полные инструкции
- **GAME_RULES.md** — правила игры
- **DEPLOYMENT.md** — развёртывание
- **DEVELOPER.md** — как расширять код

---

**Готово! Поздравляем с первой игрой! 🎉**
