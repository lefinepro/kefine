/**
 * Generate the hardcoded music sample shipped with the "extract music from
 * video" widget (issue #88). The widget needs *one* real, self-contained audio
 * file "for speed" — before the real audio-from-video pipeline exists — so we
 * synthesise a short, royalty-free lo-fi loop procedurally and write it as a
 * 16-bit PCM WAV into static/. Re-run with `node scripts/generate-music-sample.mjs`.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SAMPLE_RATE = 22050;
const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'static', 'kefine-extracted-track.wav');

/** Equal-temperament frequency for a MIDI note number. */
const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

// A gentle four-bar lo-fi chord progression (Am7 – Dm7 – G7 – Cmaj7) with a
// melody line floating on top. Each entry: [midi notes], duration in beats.
const CHORDS = [
  [57, 60, 64, 67], // Am7
  [50, 57, 60, 65], // Dm7
  [55, 59, 62, 65], // G7
  [48, 55, 60, 64] // Cmaj7
];
const MELODY = [76, 74, 72, 74, 72, 69, 67, 69]; // eighth-note phrase per bar

const BPM = 76;
const beat = 60 / BPM;
const barBeats = 4;

function envelope(t, duration, attack = 0.01, release = 0.18) {
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

/** Soft sine-ish voice with a touch of second harmonic for warmth. */
function voice(t, f) {
  const phase = 2 * Math.PI * f * t;
  return 0.7 * Math.sin(phase) + 0.18 * Math.sin(2 * phase) + 0.06 * Math.sin(3 * phase);
}

const totalBeats = CHORDS.length * barBeats;
const totalSamples = Math.floor(totalBeats * beat * SAMPLE_RATE);
const data = new Float32Array(totalSamples);

// Layer the sustained chords.
CHORDS.forEach((chord, bar) => {
  const start = bar * barBeats * beat;
  const duration = barBeats * beat;
  for (const midi of chord) {
    const f = freq(midi);
    for (let i = 0; i < duration * SAMPLE_RATE; i++) {
      const t = i / SAMPLE_RATE;
      const idx = Math.floor(start * SAMPLE_RATE) + i;
      if (idx < totalSamples) data[idx] += 0.13 * envelope(t, duration, 0.05, 0.4) * voice(t, f);
    }
  }
});

// Layer the melody — two eighth notes per beat across every bar.
MELODY.forEach((midi, step) => {
  const noteDur = beat / 2;
  for (let bar = 0; bar < CHORDS.length; bar++) {
    const start = (bar * barBeats + step * 0.5) * beat;
    const f = freq(midi);
    for (let i = 0; i < noteDur * SAMPLE_RATE; i++) {
      const t = i / SAMPLE_RATE;
      const idx = Math.floor(start * SAMPLE_RATE) + i;
      if (idx < totalSamples) data[idx] += 0.22 * envelope(t, noteDur, 0.008, 0.12) * voice(t, f);
    }
  }
});

// Normalise to avoid clipping, then write 16-bit PCM.
let peak = 0;
for (const sample of data) peak = Math.max(peak, Math.abs(sample));
const gain = peak > 0 ? 0.89 / peak : 1;

const bytesPerSample = 2;
const blockAlign = bytesPerSample; // mono
const byteRate = SAMPLE_RATE * blockAlign;
const dataSize = totalSamples * bytesPerSample;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(8 * bytesPerSample, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < totalSamples; i++) {
  const v = Math.max(-1, Math.min(1, data[i] * gain));
  buffer.writeInt16LE(Math.round(v * 32767), 44 + i * bytesPerSample);
}

writeFileSync(OUTPUT, buffer);
console.log(`Wrote ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KiB, ${(totalSamples / SAMPLE_RATE).toFixed(1)}s)`);
