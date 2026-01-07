import { useState, useEffect } from 'react'
import './index.css'
import Roulette from './components/Roulette'

interface Participant {
  name: string;
}

function App() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const [foodRain, setFoodRain] = useState<{ id: number, emoji: string, left: string, duration: string, delay: string }[]>([])

  const fetchParticipants = () => {
    fetch('/api/participants')
      .then(res => res.json())
      .then(data => {
        setParticipants(data)
      })
      .catch(err => console.error("Error fetching participants:", err))
  }

  const fetchHistory = () => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching history:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchParticipants()
    fetchHistory()
  }, [])

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newName.trim() || newName.length < 2) {
      alert("Por favor ingresa un nombre válido (mínimo 2 caracteres).")
      return
    }

    if (participants.some(p => p.name.toLowerCase() === newName.trim().toLowerCase())) {
      alert("Este nombre ya está en la lista.")
      return
    }

    fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() })
    }).then(() => {
      setNewName('')
      fetchParticipants()
    })
  }

  const handleDeleteParticipant = (name: string) => {
    if (window.confirm(`¿Seguro que quieres eliminar a ${name}?`)) {
      fetch(`/api/participants/${encodeURIComponent(name)}`, { method: 'DELETE' })
        .then(() => fetchParticipants())
    }
  }

  const handleClearHistory = () => {
    if (window.confirm("¿Seguro que quieres borrar todo el historial?")) {
      fetch('/api/history', { method: 'DELETE' })
        .then(() => fetchHistory())
    }
  }

  const handleSpin = () => {
    if (isSpinning || participants.length === 0) return;

    setWinner(null);
    setTargetIndex(null);
    setFoodRain([]);

    fetch('/api/spin', { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error("Error en el servidor");
        return res.json();
      })
      .then(data => {
        setTargetIndex(data.target_index);
        setIsSpinning(true);
      })
      .catch(err => {
        alert("Error al iniciar el giro. Revisa la consola.");
        console.error(err);
      });
  }

  const startFoodRain = () => {
    const foodEmojis = ['🍎', '🍕', '🍔', '🍟', '🍩', '🍦', '🍇', '🍉', '🍗', '🍜', '🍱', '🍤', '🥞', '🥐'];
    const newRain = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      emoji: foodEmojis[Math.floor(Math.random() * foodEmojis.length)],
      left: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 3}s`,
      delay: `${Math.random() * 2}s`
    }));
    setFoodRain(newRain);
  }

  const handleSpinEnd = (selected: Participant) => {
    setIsSpinning(false);
    setWinner(selected);
    setTargetIndex(null);
    startFoodRain();

    fetchParticipants();
    fetchHistory();
  }

  if (loading) return <div className="app-container">Cargando Accua Game...</div>

  return (
    <div className="app-container">
      <div className="header-section">
        <h1 className="title-glow">💧 Accua Game 🎡</h1>
        <p className="subtitle">Asignación para el Compartir Semanal</p>
      </div>

      <div className="main-content">
        <div className="glass-card">
          <div className="roulette-static-preview" style={{ transform: 'scale(0.8)' }}>
            <Roulette
              participants={participants}
              onSpinEnd={() => { }}
              isSpinning={false}
              targetIndex={null}
            />
          </div>

          <button
            className="spin-button"
            onClick={handleSpin}
            disabled={isSpinning || participants.length === 0}
          >
            {isSpinning ? 'Girando...' : (participants.length === 0 ? 'Sin participantes' : '¡GIRAR RULETA!')}
          </button>
        </div>

        <div className="glass-card" style={{ flex: 1, minWidth: '350px' }}>
          <h3>👥 Gestión de Participantes</h3>
          <div className="management-section">
            <form className="participant-form" onSubmit={handleAddParticipant}>
              <div className="input-group">
                <input
                  className="form-input"
                  type="text"
                  placeholder="Escribe el nombre aquí..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <button className="add-button" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                + Añadir Participante
              </button>
            </form>

            <div style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)' }}>
              Lista Aktiva ({participants.length}):
            </div>
            <ul className="participant-list">
              {participants.map(p => (
                <li key={p.name} className="participant-item">
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{p.name}</span>
                  <button className="delete-btn" onClick={() => handleDeleteParticipant(p.name)}>🗑️</button>
                </li>
              ))}
              {participants.length === 0 && (
                <li className="participant-item" style={{ opacity: 0.5, fontStyle: 'italic', justifyContent: 'center' }}>
                  Añade nombres para empezar
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '1100px', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>📅 Historial del Compartir Semanal</h3>
          {history.length > 0 && (
            <button className="delete-btn" style={{ fontSize: '0.8rem', opacity: 0.6 }} onClick={handleClearHistory}>
              Limpiar Historial
            </button>
          )}
        </div>

        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Semana</th>
                <th>Fecha</th>
                <th>Designado</th>
                <th>Mes</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, idx) => (
                <tr key={idx}>
                  <td><span className="week-badge">{entry.week}</span></td>
                  <td>{entry.date}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{entry.name}</td>
                  <td style={{ opacity: 0.7 }}>{entry.month}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                    No hay asignaciones registradas todavía. ¡Gira la ruleta!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fullscreen Spin Overlay */}
      {isSpinning && (
        <div className="fullscreen-spin-overlay">
          <h2 className="spinning-title">¡Mucha Suerte!</h2>
          <Roulette
            participants={participants}
            onSpinEnd={handleSpinEnd}
            isSpinning={isSpinning}
            targetIndex={targetIndex}
            className="fullscreen"
          />
        </div>
      )}

      {/* Food Rain Celebration */}
      {foodRain.length > 0 && (
        <div className="food-rain-container">
          {foodRain.map(item => (
            <div
              key={item.id}
              className="food-item"
              style={{ left: item.left, animationDuration: item.duration, animationDelay: item.delay }}
            >
              {item.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Winner Modal */}
      {winner && (
        <div className="result-overlay" onClick={() => setWinner(null)}>
          <div className="celebration-container">
            <div className="winner-card" onClick={e => e.stopPropagation()}>
              <h2 className="bounce-animation">🎊 ¡TENEMOS EL ELEGIDO! 🎊</h2>
              <p className="winner-label">El encargado de esta semana es:</p>
              <div className="winner-name-huge">{winner.name}</div>
              <div className="winner-email-info">¡A disfrutar de ese compartir! 🍲✨</div>
              <button className="spin-button" style={{ marginTop: '2rem' }} onClick={() => setWinner(null)}>
                ¡Genial!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
