import { encode } from './morse';

let context: AudioContext | undefined;
let playback = 0;
const voices = new Set<OscillatorNode>();
export function stopAudio() { playback++; for (const voice of voices) { try { voice.stop(); } catch { /* Already ended. */ } } voices.clear(); }
export async function prepareAudio() {
  context ??= new AudioContext();
  if (context.state !== 'running') await context.resume();
  if (context.state !== 'running') throw new Error('Activa el sonido de tu navegador para escuchar.');
  return context;
}
function tone(ctx: AudioContext, start: number, duration: number, volume: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.frequency.value = 620;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(volume, 1)) * 0.2, start + 0.005);
  if (Number.isFinite(duration)) {
    gain.gain.setValueAtTime(volume * 0.2, start + Math.max(0.005, duration - 0.008));
    gain.gain.linearRampToValueAtTime(0, start + duration);
  }
  oscillator.connect(gain).connect(ctx.destination);
  voices.add(oscillator);
  oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(start);
  if (Number.isFinite(duration)) oscillator.stop(start + duration + 0.01);
  return () => { try { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setTargetAtTime(0, ctx.currentTime, 0.003); oscillator.stop(ctx.currentTime + 0.02); } catch { /* Already stopped by cancellation. */ } };
}
export function startTone(volume: number): () => void {
  if (!context || context.state !== 'running' || volume === 0) return () => {};
  return tone(context, context.currentTime, Infinity, volume);
}
export async function playText(text: string, unitMs: number, volume: number) {
  const code = encode(text);
  stopAudio();
  const request = playback;
  const ctx = await prepareAudio();
  if (request !== playback) return 0;
  const unit = unitMs / 1000;
  let at = ctx.currentTime + 0.05;
  const words = code.split(' / ');
  for (let w = 0; w < words.length; w++) {
    const letters = words[w].split(' ');
    for (let l = 0; l < letters.length; l++) {
      for (const [i, symbol] of [...letters[l]].entries()) {
        const duration = (symbol === '-' ? 3 : 1) * unit;
        tone(ctx, at, duration, volume); at += duration;
        if (i < letters[l].length - 1) at += unit;
      }
      if (l < letters.length - 1) at += 3 * unit;
    }
    if (w < words.length - 1) at += 7 * unit;
  }
  return (at - ctx.currentTime) * 1000;
}
