import { useEffect, useRef, useState } from 'react';
import { type Lesson } from '../content/lessons';
import { decode, encode, evaluate, normalize } from '../lib/morse';
import { randomSignal } from '../lib/infinite';
import { playText, stopAudio } from '../lib/audio';
import type { Attempt } from '../lib/progress';
import { submitPractice } from '../online/client';
import { MorseKey, defaultSettings, readSettings, type KeySettings } from './MorseKey';

type Direction = 'send' | 'receive';
type Result = ReturnType<typeof evaluate>;
type SegmentReview = { id: string; segment: number; answer: string; result: Result; date: string };
type Draft = { lessonId: string; exercise: number; direction: Direction; segment: number; answers: string[]; answer: string; seconds: number; segmented: boolean; attemptId: string; reviews: SegmentReview[]; result: Result | null; finalResult: Result | null; targets?: string[] };

const splitSegments = (text: string, segmented: boolean) => segmented && text.split(/\s+/).length > 25 ? (text.match(/[^.!?]+[.!?]?/g) || [text]).map(s => s.trim()).filter(Boolean) : [text];
function validResult(value: unknown): value is Result {
  if (!value || typeof value !== 'object') return false;
  const r = value as Result;
  return Number.isFinite(r.accuracy) && r.accuracy >= 0 && r.accuracy <= 100 &&
    [r.distance, r.substitutions, r.insertions, r.deletions].every(n => Number.isInteger(n) && n >= 0);
}
function readDraft(lesson: Lesson): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem('learn-morse-draft') || 'null');
    if (!(d?.lessonId === lesson.id && Number.isInteger(d.exercise) && d.exercise >= 0 && Number.isInteger(d.segment) && d.segment >= 0 &&
      ['send', 'receive'].includes(d.direction) && Array.isArray(d.answers) && d.answers.every((s: unknown) => typeof s === 'string') &&
      typeof d.answer === 'string' && Number.isFinite(d.seconds) && d.seconds >= 0 && typeof d.segmented === 'boolean')) return null;
    const targets = Array.isArray(d.targets) && d.targets.every((s: unknown) => typeof s === 'string' && (s as string).length > 0) ? d.targets as string[] : undefined;
    if (lesson.infinite) {
      if (!targets || d.exercise >= targets.length) return null;
      for (const item of targets) decode(encode(item));
    } else if (d.exercise >= lesson.exercises.length) return null;
    const source = lesson.infinite ? targets![d.exercise] : lesson.exercises[d.exercise];
    const count = splitSegments(source, d.segmented).length;
    if (d.segment >= count || d.answers.length !== d.segment) return null;
    if (d.direction === 'send') decode(d.answer);
    for (const answer of d.answers) evaluate('', answer);
    const reviews = d.reviews ?? [];
    if (!Array.isArray(reviews) || !reviews.every((r: SegmentReview) => r && typeof r.id === 'string' &&
      Number.isInteger(r.segment) && r.segment >= 0 && r.segment < count && typeof r.answer === 'string' && typeof r.date === 'string' && validResult(r.result))) return null;
    if (d.result != null && !validResult(d.result)) return null;
    if (d.finalResult != null && (!validResult(d.finalResult) || !d.result || d.segment !== count - 1)) return null;
    return { ...d, targets, attemptId: typeof d.attemptId === 'string' && d.attemptId ? d.attemptId : crypto.randomUUID(), reviews, result: d.result ?? null, finalResult: d.finalResult ?? null };
  } catch { return null; }
}

export function Practice({ lesson, onBack, onRecord }: { lesson: Lesson; onBack: () => void; onRecord: (attempt: Attempt) => void }) {
  const [draft] = useState(() => readDraft(lesson));
  const [targets, setTargets] = useState<string[]>(() => lesson.infinite ? (draft?.targets?.length ? draft.targets : [randomSignal()]) : []);
  const [exercise, setExercise] = useState(() => lesson.infinite ? draft?.exercise || 0 : Math.min(draft?.exercise || 0, lesson.exercises.length - 1));
  const [direction, setDirection] = useState<Direction>(draft?.direction || 'send');
  const [segmented, setSegmented] = useState(draft?.segmented ?? true);
  const [segment, setSegment] = useState(draft?.segment || 0);
  const [answers, setAnswers] = useState<string[]>(draft?.answers || []);
  const [answer, setAnswer] = useState(draft?.answer || '');
  const [pending, setPending] = useState(false);
  const [attemptId, setAttemptId] = useState(() => draft?.attemptId || crypto.randomUUID());
  const [reviews, setReviews] = useState<SegmentReview[]>(draft?.reviews || []);
  const [settings, setSettings] = useState(readSettings);
  const [presentation, setPresentation] = useState('visual');
  const [help, setHelp] = useState(false);
  const [paused, setPaused] = useState(!!draft && !draft.result);
  const [result, setResult] = useState<Result | null>(draft?.result || null);
  const [finalResult, setFinalResult] = useState<Result | null>(draft?.finalResult || null);
  const [resetKey, setResetKey] = useState(0);
  const [bubble, setBubble] = useState('');
  const [warning, setWarning] = useState('');
  const [onlineStatus, setOnlineStatus] = useState('');
  const [seconds, setSeconds] = useState(draft?.seconds || 0);
  const [unitMs, setUnitMs] = useState(140);
  const [playing, setPlaying] = useState(false);
  const playTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audioRequest = useRef(0);
  const lastPulse = useRef(performance.now());
  const previousCode = useRef(draft?.answer || '');
  const activeAttempt = useRef(attemptId); activeAttempt.current = attemptId;
  const submitting = useRef(false);
  const text = (lesson.infinite ? targets[exercise] : lesson.exercises[exercise]) || '';
  const segments = splitSegments(text, segmented);
  const index = Math.min(segment, segments.length - 1);
  const target = segments[index];
  const normalized = normalize(target);
  const completed = !!finalResult;

  useEffect(() => {
    if (paused || result) return;
    lastPulse.current = performance.now();
    const timer = setInterval(() => { const now = performance.now(); setSeconds(s => s + (now - lastPulse.current) / 1000); lastPulse.current = now; }, 250);
    return () => clearInterval(timer);
  }, [paused, result]);
  useEffect(() => {
    const lost = () => { setPaused(true); silence(); };
    const hidden = () => { if (document.hidden) lost(); };
    window.addEventListener('blur', lost); document.addEventListener('visibilitychange', hidden);
    return () => { window.removeEventListener('blur', lost); document.removeEventListener('visibilitychange', hidden); audioRequest.current++; stopAudio(); clearTimeout(playTimer.current); };
  }, []);
  useEffect(() => {
    try { localStorage.setItem('learn-morse-draft', JSON.stringify({ lessonId: lesson.id, exercise, direction, segment: index, answers, answer, seconds, segmented, attemptId, reviews, result, finalResult, targets: lesson.infinite ? targets : undefined })); }
    catch { setWarning('No se pudo guardar esta sesión. Mantén esta página abierta para conservarla.'); }
  }, [exercise, direction, index, answers, answer, Math.floor(seconds), segmented, attemptId, reviews, result, finalResult, targets]);
  useEffect(() => {
    if (!bubble) return;
    const timer = setTimeout(() => setBubble(''), 1300);
    return () => clearTimeout(timer);
  }, [bubble]);
  function silence() { audioRequest.current++; stopAudio(); clearTimeout(playTimer.current); setPlaying(false); }
  function clearInput() { setAnswer(''); setPending(false); setResult(null); previousCode.current = ''; setResetKey(k => k + 1); setBubble(''); silence(); }
  function startOver(nextExercise = exercise, nextDirection = direction) {
    submitting.current = false; clearInput();
    if (lesson.infinite) {
      setTargets(current => {
        const next = current.length ? [...current] : [randomSignal()];
        while (next.length <= nextExercise) next.push(randomSignal(Math.random, next[next.length - 1]));
        return next;
      });
    }
    setExercise(nextExercise); setDirection(nextDirection); setSegment(0); setAnswers([]); setSeconds(0); setFinalResult(null); setPaused(false); setOnlineStatus(''); setReviews([]); setAttemptId(crypto.randomUUID());
  }
  function capture(code: string) {
    setAnswer(code);
    if (!code || code === previousCode.current) return;
    previousCode.current = code;
    const translated = decode(code);
    const last = translated.length - 1;
    if (last >= 0 && translated[last] !== normalized[last]) setBubble('¡Casi! Prueba otra vez');
  }
  async function listen(value = target) {
    const request = ++audioRequest.current;
    setPlaying(true);
    try { const duration = await playText(value, unitMs, settings.volume); if (request !== audioRequest.current) return; if (!duration) { setPlaying(false); return; } clearTimeout(playTimer.current); playTimer.current = setTimeout(() => setPlaying(false), duration); }
    catch (e) { if (request === audioRequest.current) { setPlaying(false); setWarning(e instanceof Error ? e.message : 'No se pudo reproducir el audio.'); } }
  }
  async function check() {
    if (submitting.current || paused || result || finalResult || pending) return;
    try {
      const actual = direction === 'send' ? decode(answer) : answer;
      const checked = evaluate(target, actual);
      submitting.current = true; silence(); setResult(checked);
      setReviews(previous => [...previous, { id: crypto.randomUUID(), segment: index, answer: actual, result: checked, date: new Date().toISOString() }]);
      setBubble(checked.accuracy >= 85 ? '¡Señal recibida!' : '¡Casi!');
      const collected = [...answers, actual];
      if (index === segments.length - 1) {
        const overall = evaluate(text, collected.join(' ')); setFinalResult(overall);
        const id = attemptId;
        onRecord({ id, lessonId: lesson.id, exercise, direction, accuracy: overall.accuracy, seconds, date: new Date().toISOString() });
        const submitted = direction === 'send' ? [...answers.map(a => a.includes('�') ? '' : encode(a)), answer].join(' / ') : collected.join(' ');
        setOnlineStatus('Guardado en este navegador.');
        if (!lesson.infinite && (direction === 'receive' || !collected.some(a => a.includes('�')))) {
          const award = await submitPractice(lesson.id, exercise, direction, submitted, id);
          if (award && activeAttempt.current === id) setOnlineStatus(`Resultado verificado · +${award.awarded} XP · ${award.xp} XP totales`);
        }
      }
    } catch (e) { if (activeAttempt.current === attemptId) setWarning(e instanceof Error ? e.message : 'No se pudo guardar el resultado en línea. Tu intento local se conserva.'); }
    finally { if (activeAttempt.current === attemptId) submitting.current = false; }
  }
  function nextSegment() { const actual = direction === 'send' ? decode(answer) : answer; setAnswers(a => [...a, actual]); setSegment(index + 1); clearInput(); setPaused(false); }
  function retrySegment() { clearInput(); setPaused(false); }
  function updateSettings(s: KeySettings) {
    setSettings(s); silence(); setResetKey(k => k + 1);
    try { localStorage.setItem('learn-morse-settings', JSON.stringify(s)); } catch { setWarning('Los ajustes se usarán en esta sesión, pero no se pudieron guardar.'); }
  }
  const shownResult = finalResult || result;
  return <div className="practice-page">
    <button className="text-button back-button" onClick={onBack}>← Volver al recorrido</button>
    <div className="practice-heading"><div><span className="eyebrow">{lesson.infinite ? `${lesson.stage} · SEÑAL ${exercise + 1} · SIN FIN` : `${lesson.stage} · EJERCICIO ${exercise + 1} DE ${lesson.exercises.length}`}</span><h1>{lesson.title}</h1><p>{lesson.description}</p></div><span className="timer">◷ {Math.floor(seconds / 60)}:{String(Math.floor(seconds % 60)).padStart(2, '0')}</span></div>
    <div className="practice-columns"><section className="practice-card card">
      <div className="segmented-control"><button aria-pressed={direction === 'send'} onClick={() => startOver(exercise, 'send')}>Español a morse</button><button aria-pressed={direction === 'receive'} onClick={() => startOver(exercise, 'receive')}>Morse a español</button></div>
      <div className="exercise-toolbar"><span>Segmento {index + 1} / {segments.length}</span><button className="text-button" onClick={() => { setPaused(p => !p); silence(); }}>{paused ? 'Reanudar práctica' : 'Pausar práctica'}</button></div>
      {direction === 'receive' && <div className="presentation-options"><label>Presentación <select value={presentation} onChange={e => { setPresentation(e.target.value); setHelp(false); silence(); }}><option value="visual">Visual</option><option value="audio">Solo audio</option><option value="both">Visual y audio</option></select></label></div>}
      <div className={`challenge ${text.length > 100 ? 'long-challenge' : ''}`}><span className="eyebrow">{direction === 'send' ? 'TRANSMITE ESTE MENSAJE' : presentation === 'audio' ? 'ESCUCHA Y DESCUBRE EL MENSAJE' : '¿QUÉ DICE ESTA SEÑAL?'}</span>
        <p className={direction === 'receive' ? 'morse-target' : ''}>{direction === 'send' ? target : presentation === 'audio' ? '♪' : encode(target).replaceAll('.', '·')}</p>
        <button className="audio-button" onClick={() => playing ? silence() : void listen()} disabled={paused}>{playing ? '■ Detener audio' : '▷ Escuchar señal'}</button>
      </div>
      {paused && <div className="pause-notice" role="status">Práctica en pausa. Tu tiempo y progreso están guardados. <button onClick={() => setPaused(false)} className="text-button">Continuar</button></div>}
      <div className="answer-area">{bubble && <div className={`feedback-bubble ${result && result.accuracy >= 85 ? 'positive' : ''}`} role="status">{bubble}</div>}
        {direction === 'send' ? <MorseKey onChange={capture} onPendingChange={setPending} initialCode={answer} disabled={paused || !!result} settings={settings} resetKey={`${resetKey}:${direction}`} /> : <label className="answer-label">Tu traducción<textarea autoComplete="off" autoCapitalize="characters" spellCheck={false} value={answer} onChange={e => setAnswer(e.target.value)} disabled={paused || !!result} placeholder="Escribe lo que recibiste…" rows={4} /></label>}
      </div>
      {!result && <div className="exercise-actions"><button className="text-button" onClick={() => { if (!help && presentation === 'audio') { setPresentation('both'); setWarning('Ayuda activada: cambiamos a Visual y audio para mostrar la pista.'); } setHelp(h => !h); }}>{help ? 'Ocultar ayuda' : 'Ver una pista'}</button><button className="button primary" disabled={paused || pending || !answer.trim()} onClick={() => void check()}>Comprobar respuesta <span>→</span></button></div>}
      {help && <div className="hint"><strong>Una señal a la vez</strong><p>{normalized}</p><code>{encode(target)}</code><small>La ñ usa --.-- en este curso. Tildes y mayúsculas no cambian la respuesta.</small></div>}
      {shownResult && <div className={`result-card ${shownResult.accuracy >= 85 ? 'success' : ''}`}><span className="eyebrow">{completed ? 'EJERCICIO COMPLETO' : 'SEGMENTO REVISADO'}</span><h2>{shownResult.accuracy >= 85 ? '¡Señal recibida!' : 'Cada intento te acerca'}</h2><div className="result-stats"><strong>{Math.round(shownResult.accuracy)}% <small>precisión</small></strong><strong>{shownResult.substitutions + shownResult.insertions + shownResult.deletions} <small>errores</small></strong></div><p>{shownResult.substitutions} sustituciones · {shownResult.deletions} omisiones · {shownResult.insertions} inserciones</p><p className="review-answer"><b>Respuesta esperada:</b> {normalize(completed ? text : target)}</p>{onlineStatus && <p role="status">{onlineStatus}</p>}
        <div className="result-actions">{completed ? <><button className="button secondary" onClick={() => startOver()}>Repetir ejercicio</button><button className="button primary" onClick={() => startOver(lesson.infinite ? exercise + 1 : (exercise + 1) % lesson.exercises.length)}>{lesson.infinite ? 'Siguiente señal →' : 'Siguiente ejercicio →'}</button></> : <><button className="button secondary" onClick={retrySegment}>Repetir segmento</button><button className="button primary" onClick={nextSegment}>Siguiente segmento →</button></>}</div>
      </div>}
      {reviews.length > 0 && <details className="hint" open data-testid="segment-history"><summary>Historial de segmentos · {reviews.length} intentos</summary><p>Los errores anteriores se conservan aunque repitas. Total registrado: {reviews.reduce((sum, review) => sum + review.result.distance, 0)} errores.</p><ol>{reviews.map((review, i) => <li key={review.id}><b>Intento {i + 1} · Segmento {review.segment + 1} · {Math.round(review.result.accuracy)}%</b><p>Tu respuesta: {review.answer || 'Sin respuesta'}</p><small>{review.result.substitutions} sustituciones · {review.result.deletions} omisiones · {review.result.insertions} inserciones</small></li>)}</ol></details>}
      {warning && <p className="notice" role="status">{warning}</p>}
    </section><aside className="practice-aside"><section className="card lesson-note"><span className="eyebrow">BITÁCORA DE APRENDIZAJE</span><h2>El ritmo se aprende.</h2><p>{lesson.explanation}</p><div className="rhythm-guide"><span><b>·</b>Punto<br /><small>Pulsa y suelta</small></span><span><b>—</b>Raya<br /><small>Mantén un poco</small></span></div><p className="muted">Deja una pausa para separar letras. Una pausa más larga empieza otra palabra.</p></section>
      <details className="card settings"><summary>Ajustar mi señal <span>⌘</span></summary><label>Tecla de transmisión<select value={settings.key} onChange={e => updateSettings({ ...settings, key: e.target.value })}><option value=" ">Espacio</option><option value="f">F</option><option value="j">J</option><option value="Enter">Enter</option></select></label>
        <label>Raya desde {settings.dashMs} ms<input type="range" min="100" max="600" step="25" value={settings.dashMs} onChange={e => updateSettings({ ...settings, dashMs: +e.target.value })} /></label>
        <label>Pausa de letra {settings.letterMs} ms<input type="range" min="300" max="1600" step="50" value={settings.letterMs} onChange={e => updateSettings({ ...settings, letterMs: +e.target.value, wordMs: Math.max(settings.wordMs, +e.target.value + 200) })} /></label>
        <label>Pausa de palabra {settings.wordMs} ms<input type="range" min={settings.letterMs + 200} max="4000" step="100" value={settings.wordMs} onChange={e => updateSettings({ ...settings, wordMs: +e.target.value })} /></label>
        <label>Volumen<input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e => updateSettings({ ...settings, volume: +e.target.value })} /></label>
        <label>Velocidad de reproducción<select value={unitMs} onChange={e => { silence(); setUnitMs(+e.target.value); }}><option value="200">Muy despacio</option><option value="140">Tranquila</option><option value="100">Fluida</option><option value="60">Avanzada</option></select></label>
        <button className="text-button" onClick={() => updateSettings(defaultSettings)}>Restablecer ajustes</button>
      </details>
      {text.split(/\s+/).length > 25 && <div className="card settings"><label>Forma de practicar<select value={segmented ? 'segments' : 'continuous'} onChange={e => { startOver(); setSegmented(e.target.value === 'segments'); }}><option value="segments">Por oraciones</option><option value="continuous">Texto completo</option></select></label><p className="muted">{text.split(/\s+/).length} palabras. Puedes pausar y retomar a tu ritmo.</p></div>}
    </aside></div>
  </div>;
}
