// ---------------------------------------------------------------------------
// Tiny synthesized UI sounds (Web Audio) — no audio files to load.
// Design goal: soft, warm and professional. Short sine/triangle tones with a
// fast attack and an exponential decay, played only on explicit user actions
// and mixed well below speech volume so they read as feedback, not fanfare.
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null

/** Lazily create (and resume) the shared AudioContext inside a user gesture. */
function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  return ctx
}

interface Tone {
  /** Frequency in Hz. */
  freq: number
  /** Start offset from "now", seconds. */
  at?: number
  /** Decay length, seconds. */
  dur?: number
  type?: OscillatorType
  /** Peak gain — kept low; these are accents, not alerts. */
  gain?: number
  /** Optional pitch-glide target (Hz). */
  glideTo?: number
}

function play(tones: Tone[]) {
  const ac = ensureCtx()
  if (!ac) return
  try {
    const now = ac.currentTime + 0.01
    for (const { freq, at = 0, dur = 0.18, type = 'sine', gain = 0.08, glideTo } of tones) {
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, now + at)
      if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, now + at + dur)
      g.gain.setValueAtTime(0, now + at)
      g.gain.linearRampToValueAtTime(gain, now + at + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0002, now + at + dur)
      osc.connect(g)
      g.connect(ac.destination)
      osc.start(now + at)
      osc.stop(now + at + dur + 0.06)
    }
  } catch {
    /* audio is a nice-to-have — never let it break an interaction */
  }
}

export const sfx = {
  /** Neutral step change ("Not yet", skips). */
  tick() {
    play([{ freq: 660, dur: 0.07, gain: 0.04 }])
  },
  /** One item marked done — a soft rising fifth with a hint of shimmer. */
  done() {
    play([
      { freq: 587.33, dur: 0.12, gain: 0.07 }, // D5
      { freq: 880, at: 0.09, dur: 0.2, gain: 0.09 }, // A5
      { freq: 1760, at: 0.09, dur: 0.16, type: 'triangle', gain: 0.02 },
    ])
  },
  /** Undo — a gentle downward slide. */
  undo() {
    play([{ freq: 523.25, glideTo: 392, dur: 0.16, gain: 0.05 }])
  },
  /** Check-in finished — a warm ascending A-major arpeggio. */
  complete() {
    play([
      { freq: 440, dur: 0.22, gain: 0.06 }, // A4
      { freq: 554.37, at: 0.1, dur: 0.22, gain: 0.06 }, // C#5
      { freq: 659.25, at: 0.2, dur: 0.24, gain: 0.07 }, // E5
      { freq: 880, at: 0.3, dur: 0.34, gain: 0.08 }, // A5
      { freq: 1760, at: 0.3, dur: 0.3, type: 'triangle', gain: 0.02 },
    ])
  },
  /** Reward redeemed — a bright little sparkle over a warm base. */
  reward() {
    play([
      { freq: 659.25, dur: 0.3, type: 'triangle', gain: 0.025 }, // E5 base
      { freq: 987.77, dur: 0.1, gain: 0.06 }, // B5
      { freq: 1318.51, at: 0.08, dur: 0.14, gain: 0.07 }, // E6
      { freq: 1975.53, at: 0.16, dur: 0.22, gain: 0.05 }, // B6
    ])
  },
}
