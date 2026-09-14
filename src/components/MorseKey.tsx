import { useEffect, useRef, useState } from 'react';
import { prepareAudio, startTone } from '../lib/audio';

export type KeySettings = { key: string; dashMs: number; letterMs: number; wordMs: number; volume: number };
export const defaultSettings: KeySettings = { key: ' ', dashMs: 250, letterMs: 700, wordMs: 1600, volume: 0.45 };

export function readSettings(): KeySettings {
  try {
    const s = JSON.parse(localStorage.getItem('learn-morse-settings') || 'null');
    return s && [' ', 'Enter', 'f', 'j'].includes(s.key) &&
      [s.dashMs, s.letterMs, s.wordMs, s.volume].every(Number.isFinite) &&
      s.dashMs >= 100 && s.dashMs <= 600 && s.letterMs >= 300 && s.letterMs <= 1600 &&
      s.wordMs > s.letterMs && s.wordMs <= 4000 && s.volume >= 0 && s.volume <= 1 ? s : defaultSettings;
  } catch { return defaultSettings; }
}

export function MorseKey({ onChange, onPendingChange, initialCode = '', disabled = false, resetKey = 0, settings = defaultSettings }: {
  onChange: (code: string) => void; onPendingChange?: (pending: boolean) => void; initialCode?: string;
  disabled?: boolean; resetKey?: string | number; settings?: KeySettings;
}) {
  const [pressed, setPressed] = useState(false);
  const [pending, setPending] = useState('');
  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState('Toca aquí para activar el teclado');
  const [audioError, setAudioError] = useState('');
  const current = useRef({ start: null as number | null, pending: '', code: initialCode, word: false, pointer: null as number | null, press: 0 });
  const callbacks = useRef(onChange); callbacks.current = onChange;
  const pendingCallback = useRef(onPendingChange); pendingCallback.current = onPendingChange;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stop = useRef<() => void>(() => {});
  const keyName = settings.key === ' ' ? 'Espacio' : settings.key.toUpperCase();
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const cancel = () => {
    clearTimers(); stop.current(); current.current.press++; current.current.start = null; current.current.pending = ''; current.current.pointer = null;
    setPending(''); setPressed(false); pendingCallback.current?.(false);
  };
  const reset = () => { cancel(); current.current.code = ''; current.current.word = false; setCode(''); callbacks.current(''); };
  useEffect(() => { cancel(); current.current.code = initialCode; current.current.word = false; setCode(initialCode); callbacks.current(initialCode); }, [resetKey]);
  useEffect(() => { if (disabled) cancel(); }, [disabled]);
  useEffect(() => {
    const lost = () => { cancel(); setStatus('Señal detenida. Vuelve a enfocar para continuar.'); };
    const hidden = () => { if (document.hidden) lost(); };
    window.addEventListener('blur', lost); document.addEventListener('visibilitychange', hidden);
    return () => { cancel(); window.removeEventListener('blur', lost); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  function down() {
    if (disabled || current.current.start !== null) return;
    clearTimers(); current.current.start = performance.now(); const press = ++current.current.press;
    setPressed(true); pendingCallback.current?.(true); setStatus('Transmitiendo…');
    void prepareAudio().then(() => { if (current.current.press === press && current.current.start !== null) stop.current = startTone(settings.volume); }).catch(() => { if (current.current.press === press) setAudioError('Audio no disponible. Puedes seguir con la señal visual.'); });
  }
  function up() {
    const state = current.current;
    if (state.start === null) return;
    const symbol = performance.now() - state.start >= settings.dashMs ? '-' : '.';
    state.start = null; state.press++; stop.current(); setPressed(false);
    state.pending += symbol; setPending(state.pending); setStatus('Pausa corta: otra señal · Pausa larga: nueva letra');
    timers.current.push(setTimeout(() => {
      if (!state.pending) return;
      state.code += (state.code ? (state.word ? ' / ' : ' ') : '') + state.pending;
      state.pending = ''; state.word = false;
      setPending(''); setCode(state.code); callbacks.current(state.code); pendingCallback.current?.(false); setStatus('Letra confirmada');
    }, settings.letterMs));
    timers.current.push(setTimeout(() => { state.word = true; setStatus('Pausa de palabra · Continúa cuando quieras'); }, settings.wordMs));
  }
  return <div className="key-workspace">
    <div className="transmission"><span className="eyebrow">TU SEÑAL</span><output data-testid="morse-code" aria-label="Código transmitido">{code || '—'}</output>{pending && <span className="pending-code" aria-label="Letra en construcción">{pending}</span>}</div>
    <button type="button" className={`morse-key ${pressed ? 'is-pressed' : ''}`} disabled={disabled}
      aria-label={`Transmitir morse con ${keyName}`} aria-pressed={pressed}
      onFocus={() => setStatus(`Teclado activo · Usa ${keyName}`)}
      onBlur={() => { if (current.current.start !== null) cancel(); setStatus('Toca aquí para activar el teclado'); }}
      onKeyDown={e => { if (e.key === settings.key) { e.preventDefault(); if (!e.repeat && current.current.pointer === null) down(); } }}
      onKeyUp={e => { if (e.key === settings.key) { e.preventDefault(); if (current.current.pointer === null) up(); } }}
      onPointerDown={e => { if (current.current.pointer !== null || current.current.start !== null || e.button !== 0) return; e.preventDefault(); e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId); current.current.pointer = e.pointerId; down(); }}
      onPointerUp={e => { if (current.current.pointer === e.pointerId) { up(); current.current.pointer = null; } }}
      onPointerCancel={e => { if (current.current.pointer === e.pointerId) cancel(); }} onLostPointerCapture={e => { if (current.current.pointer === e.pointerId) cancel(); }}>
      <span className="key-signal" aria-hidden="true"><i /><b /></span><span>{pressed ? 'Transmitiendo' : keyName}</span><small>Pulsa · punto &nbsp; Mantén — raya</small>
    </button>
    <div className="key-footer"><small>{status}</small><button type="button" className="text-button" onClick={reset} disabled={disabled}>Borrar transmisión</button></div>
    {audioError && <p role="status" className="notice">{audioError}</p>}
  </div>;
}
