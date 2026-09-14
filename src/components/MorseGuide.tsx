import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { decode } from '../lib/morse';
import { GUIDE_STEPS, stepOutcome, type GuideStepId } from '../lib/guide';
import { MorseKey, defaultSettings } from './MorseKey';

export type GuideOrigin = { x: number; y: number; w: number; h: number };

const quiet = { ...defaultSettings, volume: 0.35 };
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function expandTransform(origin: GuideOrigin, card: DOMRect) {
  const sx = origin.w / Math.max(card.width, 1);
  const sy = origin.h / Math.max(card.height, 1);
  return `translate(${origin.x - card.left}px, ${origin.y - card.top}px) scale(${sx}, ${sy})`;
}

export function MorseGuide({ open, origin, onClose }: { open: boolean; origin: GuideOrigin | null; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [code, setCode] = useState('');
  const [pending, setPending] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [passed, setPassed] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const step = GUIDE_STEPS[index];
  const raw = stepOutcome(step.id as GuideStepId, code, pending);
  const outcome = passed ? 'complete' : raw;
  const decoded = code.trim() ? decode(code) : '';
  const last = index === GUIDE_STEPS.length - 1;

  function resetAttempt() {
    setPassed(false);
    setCode('');
    setPending('');
    setResetKey(key => key + 1);
  }

  function play(from: string, to: string, duration: number, done?: () => void) {
    const node = card.current;
    if (!node) { done?.(); return; }
    const animation = node.animate(
      [{ transform: from, opacity: from === 'none' ? 1 : .25 }, { transform: to, opacity: to === 'none' ? 1 : .2 }],
      { duration, easing: from === 'none' ? 'cubic-bezier(.55,.12,.35,1)' : 'cubic-bezier(.18,.84,.22,1)', fill: 'both' },
    );
    animation.onfinish = () => done?.();
    return animation;
  }

  function closeGuide() {
    if (closing.current) return;
    const node = card.current;
    if (reduceMotion() || !origin || !node) { onClose(); return; }
    closing.current = true;
    play('none', expandTransform(origin, node.getBoundingClientRect()), 380, () => {
      closing.current = false;
      onClose();
    });
  }

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    resetAttempt();
    closing.current = false;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); closeGuide(); } };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) { setReady(false); return; }
    const node = card.current;
    if (!node || reduceMotion() || !origin) { setReady(true); return; }
    setReady(false);
    const fallback = window.setTimeout(() => setReady(true), 650);
    const animation = play(expandTransform(origin, node.getBoundingClientRect()), 'none', 560, () => {
      window.clearTimeout(fallback);
      setReady(true);
    });
    return () => { window.clearTimeout(fallback); animation?.cancel(); };
  }, [open, origin]);

  useEffect(() => { if (raw === 'complete') setPassed(true); }, [raw]);

  if (!open) return null;

  let live = 'Enfoca el botón y prueba Espacio. Aquí verás qué acaba de pasar.';
  if (outcome === 'complete') live = step.success;
  else if (outcome === 'mismatch') live = step.mismatch;
  else if (pending) live = `Letra en construcción: ${pending.replaceAll('.', '·').replaceAll('-', '—')}. Todavía no cuenta.`;

  return <div className="guide-layer is-open">
    <div className="guide-backdrop" onClick={closeGuide} />
    <div id="guia-tecla" className={`card morse-guide ${ready ? '' : 'is-expanding'}`} role="dialog" aria-modal="true" aria-labelledby="guia-titulo" tabIndex={-1} ref={card}>
      <div className="guide-head">
        <div>
          <span className="eyebrow">GUÍA DE LA TECLA · PASO {index + 1} DE {GUIDE_STEPS.length}</span>
          <h2 id="guia-titulo">Cómo entiende esta app el morse</h2>
          <p>Un concepto cada vez. No puedes saltar un paso: primero lo pruebas, luego eliges repetir o seguir.</p>
        </div>
        <button type="button" className="guide-toggle" onClick={closeGuide}>Cerrar guía</button>
      </div>
      <ol className="guide-progress" aria-label="Progreso de la guía">
        {GUIDE_STEPS.map((item, i) => <li key={item.id} className={i < index ? 'is-done' : i === index ? 'is-current' : ''} aria-current={i === index ? 'step' : undefined}>{i < index ? '✓' : i + 1}</li>)}
      </ol>
      <div className="guide-body">
        <div className={`guide-step ${outcome === 'complete' ? 'is-done' : ''}`}>
          <h3>{step.title}</h3>
          <p>{step.hint}</p>
        </div>
        <div className="guide-practice">
          <p className="guide-live" role="status">{live}</p>
          <p className="guide-reading">{decoded ? <>En español: <b>{decoded}</b></> : 'Aún no hay una letra confirmada.'}</p>
          <div className={outcome === 'complete' ? 'guide-key is-locked' : 'guide-key'}>
            <MorseKey onChange={setCode} onPendingCode={setPending} settings={quiet} resetKey={resetKey} />
          </div>
          {outcome === 'complete' ? <div className="guide-actions">
            <button type="button" className="button secondary" onClick={resetAttempt}>Repetir este paso</button>
            <button type="button" className="button dark" onClick={() => last ? closeGuide() : (setIndex(index + 1), resetAttempt())}>{last ? 'Terminar' : 'Siguiente'}</button>
          </div> : outcome === 'mismatch' ? <div className="guide-actions">
            <button type="button" className="button secondary" onClick={resetAttempt}>Probar otra vez</button>
          </div> : <p className="muted">Completa este paso para continuar. La tecla es la misma que usarás en las lecciones.</p>}
        </div>
      </div>
    </div>
  </div>;
}
