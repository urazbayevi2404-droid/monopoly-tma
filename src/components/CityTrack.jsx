export default function CityTrack({ level }) {
  const pct = (level / 20) * 100
  const color = level >= 13 ? '#10B981' : level >= 8 ? '#F59E0B' : level >= 4 ? '#EF4444' : '#991B1B'
  const label = level >= 15 ? '🌟 Расцвет' : level >= 10 ? '✅ Стабильно' : level >= 5 ? '⚠️ Под угрозой' : '🔥 Критично!'

  return (
    <div className="city-track">
      <div className="city-track-header">
        <span className="city-label">🏙️ Уровень города</span>
        <span className="city-value" style={{ color }}>{level}/20 {label}</span>
      </div>
      <div className="city-bar-bg">
        <div
          className="city-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.5s, background-color 0.5s' }}
        />
      </div>
    </div>
  )
}
