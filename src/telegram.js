export function getTelegramUser() {
  const tg = window.Telegram?.WebApp
  if (tg?.initDataUnsafe?.user) {
    const u = tg.initDataUnsafe.user
    return {
      id: String(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Игрок',
      photo: u.photo_url || null,
    }
  }
  // Dev fallback — случайный ID чтобы тестировать без Telegram
  const devId = localStorage.getItem('dev_user_id') || `dev_${Math.random().toString(36).slice(2, 8)}`
  localStorage.setItem('dev_user_id', devId)
  const devName = localStorage.getItem('dev_user_name') || prompt('Твоё имя (режим разработки):') || 'Тестер'
  localStorage.setItem('dev_user_name', devName)
  return { id: devId, name: devName, photo: null }
}

export function haptic(type = 'light') {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type)
}

export function showAlert(msg) {
  if (window.Telegram?.WebApp?.showAlert) {
    window.Telegram.WebApp.showAlert(msg)
  } else {
    alert(msg)
  }
}

export function setMainButton(text, callback, options = {}) {
  const tg = window.Telegram?.WebApp
  if (!tg) return
  
  tg.MainButton.text = text
  tg.MainButton.onClick(callback)
  
  if (options.show !== false) {
    tg.MainButton.show()
  }
}

export function hideMainButton() {
  window.Telegram?.WebApp?.MainButton?.hide?.()
}

export function closeApp() {
  const tg = window.Telegram?.WebApp
  if (tg?.close) {
    tg.close()
  } else {
    window.close()
  }
}

export function shareToChat(message) {
  const tg = window.Telegram?.WebApp
  if (!tg) {
    navigator.clipboard?.writeText(message)
    alert('Скопировано в буфер обмена')
    return
  }
  
  if (tg.shareToChat) {
    tg.shareToChat(message)
  } else if (tg.switchInlineQuery) {
    tg.switchInlineQuery(message)
  }
}

export function setWebAppHeader(color = 'adaptive') {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.setHeaderColor?.(color)
  }
}
