export default function CityTrack({ level }) {
  const pct = (level / 20) * 100
  const color = level >= 13 ? '#34D399' : level >= 8 ? '#F5C842' : level >= 4 ? '#F97316' : '#EF4444'
  const label = level >= 15 ? 'Рост' : level >= 10 ? 'Стабильно' : level >= 5 ? 'Под давлением' : 'Критично'

  return (
    <section className="city-track-compact">
      <div className="city-track-row">
        <div>
          <p className="eyebrow">Уровень города</p>
          <h2 className="city-track-title">{level}/20</h2>
        </div>
        <span className="city-value-tag" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="city-bar-bg">
        <div className="city-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </section>
  )
}
