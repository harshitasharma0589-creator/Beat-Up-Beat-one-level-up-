// Safe client-side Web Audio synthesis for Beat Up
// Produces beautiful melodic notes based on task completion progress and a happy full rhythmic beat arpeggio on level up.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Play a sweet, chime-like sound. 
 * The frequency scale goes higher as progress (0 to 1) increases.
 */
export function playProgressSound(progress: number) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (browser security restriction bypass)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Base frequency is 261.63 Hz (C4). We scale it up to 659.25 Hz (E5) or higher based on progress.
    const baseFreq = 329.63; // E4
    const scaleFactor = progress * 300; 
    const freq = baseFreq + scaleFactor;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Add a subtle second harmonic to make it sound richer and sweeter (like a bell)
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
    const gainNode2 = ctx.createGain();

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    gainNode2.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);

    osc2.start();
    osc2.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn("Web Audio chime could not play due to environment gesture rules:", err);
  }
}

/**
 * Plays a beautiful arpeggiated melodic theme: "a full beat flowing with happiness" 
 * representing an upbeat rhythmic celebration!
 */
export function playHappyRemixBeat() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Melodic notes sequence in C Major / Pentatonic for that ultra-sweet happy feeling
    // C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), A5 (880.00 Hz), C6 (1046.50 Hz)
    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.15, type: "sine" as OscillatorType },
      { freq: 659.25, time: 0.12, duration: 0.15, type: "sine" as OscillatorType },
      { freq: 783.99, time: 0.24, duration: 0.15, type: "sine" as OscillatorType },
      { freq: 880.00, time: 0.36, duration: 0.15, type: "triangle" as OscillatorType },
      { freq: 1046.50, time: 0.48, duration: 0.35, type: "sine" as OscillatorType },
      // Added background bass support to make it sound like a full, rich beat!
      { freq: 130.81, time: 0.0, duration: 0.6, type: "triangle" as OscillatorType }, // C3
      { freq: 196.00, time: 0.36, duration: 0.4, type: "triangle" as OscillatorType } // G3
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(note.freq > 200 ? 0.14 : 0.22, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch (err) {
    console.warn("Web Audio celebratory beat failed to play:", err);
  }
}

/**
 * Plays a gentle, ambient musical chime sequence representing an automatic timeline reminder near the deadline.
 */
export function playDeadlineWarningChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Rhythmic cascade alert: G5, E5, C5, G5, C6
    const alertNotes = [
      { freq: 783.99, time: 0.0, duration: 0.10, type: "sine" as OscillatorType },
      { freq: 659.25, time: 0.08, duration: 0.10, type: "sine" as OscillatorType },
      { freq: 523.25, time: 0.16, duration: 0.10, type: "sine" as OscillatorType },
      { freq: 783.99, time: 0.24, duration: 0.12, type: "triangle" as OscillatorType },
      { freq: 1046.50, time: 0.32, duration: 0.25, type: "sine" as OscillatorType }
    ];

    alertNotes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.08, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch (err) {
    console.warn("Web Audio deadline chime failed:", err);
  }
}

