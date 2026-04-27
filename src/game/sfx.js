let audioContext = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!audioContext) audioContext = new AudioCtx()
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  return audioContext
}

function playTone(ctx, {
  frequency,
  startAt,
  duration,
  type = 'sine',
  gain = 0.035,
}) {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startAt)

  gainNode.gain.setValueAtTime(0.0001, startAt)
  gainNode.gain.exponentialRampToValueAtTime(gain, startAt + 0.015)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.03)
}

const SEQUENCES = {
  roll: [
    { frequency: 260, offset: 0, duration: 0.07, type: 'triangle', gain: 0.03 },
    { frequency: 320, offset: 0.08, duration: 0.07, type: 'triangle', gain: 0.03 },
    { frequency: 420, offset: 0.16, duration: 0.12, type: 'square', gain: 0.04 },
  ],
  buy: [
    { frequency: 440, offset: 0, duration: 0.07, type: 'triangle', gain: 0.035 },
    { frequency: 660, offset: 0.08, duration: 0.1, type: 'triangle', gain: 0.04 },
    { frequency: 880, offset: 0.2, duration: 0.15, type: 'sine', gain: 0.045 },
  ],
  turn: [
    { frequency: 300, offset: 0, duration: 0.05, type: 'sine', gain: 0.025 },
    { frequency: 520, offset: 0.07, duration: 0.09, type: 'triangle', gain: 0.03 },
  ],
}

export function playSfx(name, enabled = true) {
  if (!enabled) return
  const ctx = getAudioContext()
  const sequence = SEQUENCES[name]

  if (!ctx || !sequence) return

  const startAt = ctx.currentTime + 0.01
  sequence.forEach(note => playTone(ctx, {
    frequency: note.frequency,
    startAt: startAt + note.offset,
    duration: note.duration,
    type: note.type,
    gain: note.gain,
  }))
}
