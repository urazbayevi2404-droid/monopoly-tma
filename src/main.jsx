import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.css'

const tg = window.Telegram?.WebApp

if (tg) {
  tg.ready()
  tg.expand()
  tg.setHeaderColor?.('#170d22')
  tg.setBackgroundColor?.('#170d22')
  tg.enableClosingConfirmation?.()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
