# 📚 Documentation Index

Полная документация проекта **Наш Город** — Telegram Mini App для активистов.

---

## 🚀 Для пользователей

### [QUICK_START.md](QUICK_START.md) ⚡
**За 10 минут от нуля до первой игры**
- Firebase setup
- Локальный запуск
- Тестирование

### [README.md](README.md) 📖
**Полное руководство**
- Детальные инструкции
- Структура проекта
- Troubleshooting
- Правила безопасности Firebase

### [GAME_RULES.md](GAME_RULES.md) 🎮
**Правила игры для игроков и фасилитаторов**
- Механика за 60 секунд
- Три пути (A, B, C)
- Голос совести (оспаривание)
- Подсчёт очков

### [DEPLOYMENT.md](DEPLOYMENT.md) 🌐
**Публикация на Vercel**
- GitHub setup
- Vercel конфиг
- Telegram Bot интеграция
- Обновления кода

---

## 👨‍💻 Для разработчиков

### [DEVELOPER.md](DEVELOPER.md) 🛠️
**Расширение и улучшение кода**
- Архитектура состояния
- Как добавить новую карточку
- Отладка
- Production checklist

### [GAME_RULES.md → Правила разработки](GAME_RULES.md)
Перед добавлением фичи убедись что она соответствует игровой механике

---

## 🗂️ Структура проекта

```
monopoly-tma/
├── src/
│   ├── game/logic.js        ← ВСЯ логика игры
│   ├── data/cards.js        ← 50+ карточек
│   ├── data/board.js        ← Доска (30 клеток)
│   ├── screens/             ← 4 основных экрана
│   ├── components/          ← 8 переиспользуемых компонентов
│   └── styles/main.css      ← Все стили
│
├── QUICK_START.md           ← Начни здесь!
├── README.md                ← Подробно
├── GAME_RULES.md            ← Правила
├── DEPLOYMENT.md            ← Деплой
├── DEVELOPER.md             ← Разработка
└── package.json
```

---

## 🎯 Сценарии использования

### Я хочу...

#### Просто поиграть онлайн
→ [QUICK_START.md](QUICK_START.md) + [GAME_RULES.md](GAME_RULES.md)

#### Задеплоить свою версию
→ [QUICK_START.md](QUICK_START.md) + [DEPLOYMENT.md](DEPLOYMENT.md)

#### Добавить свои карточки
→ [DEVELOPER.md](DEVELOPER.md) → "Как добавить новую карточку"

#### Изменить механику игры
→ [DEVELOPER.md](DEVELOPER.md) → "Как изменить пути"

#### Разобраться как работает код
→ [DEVELOPER.md](DEVELOPER.md) → "Архитектура состояния"

#### Исправить ошибку
→ [README.md](README.md) → "Troubleshooting"

---

## 🔗 Быстрые ссылки

| Что | Ссылка |
|-----|--------|
| Firebase Console | https://console.firebase.google.com |
| Vercel Dashboard | https://vercel.com |
| Telegram BotFather | https://t.me/botfather |
| React Documentation | https://react.dev |
| Firebase DB Docs | https://firebase.google.com/docs/database |

---

## 💡 Примеры команд

```bash
# Локальная разработка
npm run dev

# Проверка структуры проекта
npm run verify

# Пересборка для продакшена
npm run build

# Просмотр продакшена локально
npm run preview
```

---

## 📞 Помощь

1. **Ошибка при запуске?**
   → [README.md → Troubleshooting](README.md#troubleshooting)

2. **Непонятны правила?**
   → [GAME_RULES.md](GAME_RULES.md)

3. **Не получается задеплоить?**
   → [DEPLOYMENT.md](DEPLOYMENT.md)

4. **Хочу добавить функцию?**
   → [DEVELOPER.md](DEVELOPER.md)

5. **Нашёл баг?**
   → [README.md → Issues](README.md)

---

## ✨ Статус проекта

- ✅ Базовая механика игры
- ✅ Firebase синхронизация
- ✅ Telegram Web App интеграция
- ✅ 50+ карточек
- ✅ Оспаривание выборов
- ✅ Подсчёт очков с бонусами
- 🚀 Ready for production!

---

## 📄 Лицензия

Свободный код. Используй как угодно! 🎉

---

**Последнее обновление**: апрель 2026

Сделано для **Жаңа Адамдар** ✊
