import { useEffect, useRef, useState } from 'react';
import { lessons, type Lesson } from './content/lessons';
import { MORSE } from './lib/morse';
import { readProgress, saveAttempt, lessonPassed, type Attempt } from './lib/progress';
import { Practice } from './components/Practice';
import { MorseGuide } from './components/MorseGuide';
import { AccountPanel, CompetitionPanel, OnlineIdentity } from './online/Panels';

const pages = ['Aprender', 'Practicar', 'Competir', 'Perfil'] as const;
type Page = typeof pages[number];
type InstallEvent = Event & { prompt: () => Promise<void> };
const pageFromHash = () => pages.find(p => `#${p.toLowerCase()}` === location.hash) || 'Aprender';

function RadioArt() {
  return <div className="radio-scene" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="spark spark-one">✧</span><span className="spark spark-two">✦</span><div className="speech-signal">··· &nbsp; −−− &nbsp; ···<i /></div><div className="radio"><div className="antenna" /><div className="radio-face"><div className="radio-screen"><span>SIGNAL FOUND</span><b>· − ·</b><small>620 Hz &nbsp; ◉</small></div><div className="speaker"><i /><i /><i /><i /><i /><i /><i /></div><div className="radio-bottom"><span className="dial" /><span className="dial small" /><b>MORSE / 01</b></div></div></div><span className="scene-caption">CONECTA CON OTRO LENGUAJE</span></div>;
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [filter, setFilter] = useState('Todas');
  const [progress, setProgress] = useState(() => { try { return readProgress(localStorage); } catch { return { version: 1 as const, attempts: [], warning: 'El almacenamiento no está disponible. Tu progreso durará esta sesión.' }; } });
  const [storageWarning, setStorageWarning] = useState(progress.warning || '');
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideOrigin, setGuideOrigin] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const guideButton = useRef<HTMLButtonElement>(null);
  const [resume, setResume] = useState(() => { try { const d = JSON.parse(localStorage.getItem('learn-morse-draft') || 'null'); return lessons.find(l => l.id === d?.lessonId); } catch { return undefined; } });
  const courseLessons = lessons.filter(lesson => !lesson.infinite);
  const completedLessons = courseLessons.filter(l => lessonPassed(progress, l.id, l.exercises.length));
  const accuracy = progress.attempts.length ? Math.round(progress.attempts.reduce((sum, a) => sum + a.accuracy, 0) / progress.attempts.length) : null;
  const days = new Set(progress.attempts.map(a => a.date.slice(0, 10))).size;
  const nextLesson = lessons.find(l => !l.infinite && !completedLessons.includes(l)) || courseLessons[0] || lessons[0];
  useEffect(() => {
    const hash = () => { if (location.hash !== '#main') { setPage(pageFromHash()); setActiveLesson(null); } };
    const captureInstall = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    const connection = () => setOffline(!navigator.onLine);
    const swUpdate = (e: Event) => setUpdate((e as CustomEvent<ServiceWorker>).detail);
    window.addEventListener('hashchange', hash); window.addEventListener('beforeinstallprompt', captureInstall);
    window.addEventListener('online', connection); window.addEventListener('offline', connection); window.addEventListener('morse:update', swUpdate);
    return () => { window.removeEventListener('hashchange', hash); window.removeEventListener('beforeinstallprompt', captureInstall); window.removeEventListener('online', connection); window.removeEventListener('offline', connection); window.removeEventListener('morse:update', swUpdate); };
  }, []);
  function navigate(next: Page) { setPage(next); setActiveLesson(null); setGuideOpen(false); location.hash = next.toLowerCase(); window.scrollTo({ top: 0 }); }
  function begin(lesson: Lesson) { setActiveLesson(lesson); setResume(lesson); setGuideOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function record(attempt: Attempt) {
    setProgress(previous => {
      const next = saveAttempt(previous, attempt);
      try { localStorage.setItem('learn-morse-progress', JSON.stringify(next)); } catch { setStorageWarning('No se pudo guardar el progreso. Conservaremos tus intentos mientras esta página esté abierta.'); }
      return next;
    });
  }
  return <><a className="skip-link" href="#main">Saltar al contenido</a><header className="site-header"><div className="header-inner"><button className="brand" onClick={() => navigate('Aprender')} aria-label="Learn Morse, inicio"><span className="brand-mark" aria-hidden="true"><i /><b /><i /></span>learn<span>morse</span><small>BETA</small></button><nav aria-label="Principal">{pages.map((item, i) => <button key={item} className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined} onClick={() => navigate(item)}><span aria-hidden="true">{['▤', '⌁', '⚑', '◉'][i]}</span>{item}</button>)}</nav><button className="guest-badge" onClick={() => navigate('Perfil')}><OnlineIdentity /></button></div></header>
    {offline && <div className="connection-banner" role="status">Sin conexión · Puedes aprender y practicar con el contenido guardado. Las competencias requieren internet.</div>}
    {update && <div className="connection-banner">Hay una nueva versión. Guarda o termina tu ejercicio antes de actualizar. <button className="text-button" onClick={() => { update.postMessage('SKIP_WAITING'); }}>Actualizar app</button></div>}
    <main id="main" className="main-shell" tabIndex={-1}>
      {activeLesson ? <Practice key={activeLesson.id} lesson={activeLesson} onBack={() => setActiveLesson(null)} onRecord={record} /> : page === 'Aprender' ? <>
        <div className="welcome-line"><span>UN POCO DE PRÁCTICA, UN MUNDO DE SEÑALES.</span><span className="live-dot">A tu propio ritmo</span></div>
        <section className="hero"><div className="hero-copy"><span className="pill"><i /> CADA SEÑAL CUENTA</span><h1>Un pequeño pulso.<br />Un nuevo <em>lenguaje.</em></h1><p>Descubre el código morse, una señal a la vez.<br className="desktop-break" /> Aprende, practica y conecta jugando.</p><div className="hero-actions"><button className="button dark" onClick={() => begin(nextLesson)}>Comenzar a aprender <span>↗</span></button><button ref={guideButton} className="button secondary" aria-expanded={guideOpen} aria-haspopup="dialog" onClick={() => { const r = guideButton.current?.getBoundingClientRect(); setGuideOrigin(r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null); setGuideOpen(true); }}>Cómo funciona la tecla</button></div><div className="hero-footnote"><span className="tiny-key">␣</span> Solo necesitas una tecla. Y un poco de curiosidad.</div></div><RadioArt /></section>
        <MorseGuide open={guideOpen} origin={guideOrigin} onClose={() => { setGuideOpen(false); guideButton.current?.focus(); }} />
        <div className="dashboard-grid"><section className="learning-section"><div className="section-heading"><div><span className="eyebrow">DE TU PRIMER PUNTO A UNA GRAN HISTORIA</span><h2>Tu camino de señales</h2></div><span className="count-chip">{completedLessons.length} / {courseLessons.length} completas</span></div><div className="filter-row" aria-label="Filtrar lecciones">{['Todas', 'Introducción', 'Letras', 'Ampliación', 'Palabras', 'Frases', 'Párrafos', 'Textos largos'].map(stage => <button key={stage} aria-pressed={filter === stage} onClick={() => setFilter(stage)}>{stage}</button>)}</div><div className="lesson-list">{lessons.filter(l => filter === 'Todas' || l.stage === filter).map(lesson => { const done = completedLessons.includes(lesson); const number = lessons.indexOf(lesson) + 1; return <button className={`lesson-row ${done ? 'is-complete' : ''}`} key={lesson.id} onClick={() => begin(lesson)}><span className={`lesson-number ${number === 1 ? 'first' : ''}`}>{done ? '✓' : String(number).padStart(2, '0')}</span><span className="lesson-info"><small>{lesson.stage.toUpperCase()}</small><strong>{lesson.title}</strong><span>{lesson.description}</span></span><span className="lesson-meta"><small>{lesson.infinite ? 'Sin fin' : `${lesson.exercises.length} ejercicios`}</small><span className="lesson-arrow">↗</span></span></button>; })}</div></section>
        <aside className="dashboard-aside"><section className="card progress-card"><span className="eyebrow">TU FRECUENCIA</span><div className="profile-title"><span className="profile-orbit">✳</span><div><h3>Cada día, más cerca.</h3><p>Tu progreso en este navegador</p></div></div><div className="stats-row"><div><strong>{progress.attempts.length}</strong><span>prácticas</span></div><div><strong>{accuracy === null ? '—' : `${accuracy}%`}</strong><span>precisión</span></div><div><strong>{days}</strong><span>días activos</span></div></div><div className="progress-label"><span>Recorrido completado</span><b>{Math.round(completedLessons.length / courseLessons.length * 100)}%</b></div><progress value={completedLessons.length} max={courseLessons.length} /><p className="muted">Completa los ejercicios en ambas direcciones con al menos 85 % de precisión.</p></section>
          <section className="daily-card"><span className="eyebrow">UNA SEÑAL PARA EMPEZAR</span><div className="daily-symbol">· −</div><h3>Todo comienza con una A.</h3><p>Un punto, una raya. Dos pequeños gestos y ya estás hablando otro lenguaje.</p><button className="text-button" onClick={() => begin(lessons.find(l => l.symbols === 'ANSO') || lessons[0])}>Probar esta señal <span>→</span></button></section>
          {resume && <section className="card resume-card"><span className="eyebrow">TU ÚLTIMA FRECUENCIA</span><h3>{resume.title}</h3><button className="text-button" onClick={() => begin(resume)}>Retomar práctica →</button></section>}
          <section className="duel-teaser"><span aria-hidden="true">⚑</span><div><h3>Las señales se comparten.</h3><p>Invita a alguien y descubre quién traduce mejor.</p><button className="text-button" onClick={() => navigate('Competir')}>Explorar competencias ↗</button></div></section>
        </aside></div>
      </> : page === 'Practicar' ? <><div className="page-intro"><span className="eyebrow">TU PEQUEÑO LABORATORIO DE SEÑALES</span><h1>Encuentra tu ritmo.</h1><p>Elige qué practicar. Cambia de dirección, escucha y prueba de nuevo.</p></div><div className="practice-menu">{lessons.map((lesson, i) => <button className="card practice-choice" key={lesson.id} onClick={() => begin(lesson)}><span className="eyebrow">{lesson.stage}</span><span className="choice-code">{['·', '−', '· −', '− ·', '· · ·'][i % 5]}</span><h2>{lesson.title}</h2><p>{lesson.description}</p><span className="text-button">Practicar <b>↗</b></span></button>)}</div><details className="card alphabet-reference"><summary>Consultar el alfabeto morse</summary><p>Ñ es una extensión del curso. Las tildes se convierten a vocales sin acento.</p><div>{Object.entries(MORSE).map(([letter, code]) => <span key={letter}><b>{letter}</b><code>{code.replaceAll('.', '·')}</code></span>)}</div></details></> : page === 'Competir' ? <><div className="page-intro"><span className="eyebrow">DOS PERSONAS. UN MISMO LENGUAJE.</span><h1>Señales en compañía.</h1><p>Comparte un código de sala, prepara tu tecla y empieza el duelo.</p></div><CompetitionPanel /></> : <><div className="page-intro"><span className="eyebrow">TU HISTORIA, SEÑAL A SEÑAL</span><h1>Bitácora del explorador.</h1><p>Tu práctica local y tu perfil en línea, siempre identificados.</p></div><div className="profile-layout"><AccountPanel /><section className="card history-card"><span className="eyebrow">PRÁCTICA LOCAL · ESTE NAVEGADOR</span><h2>{progress.attempts.length} intentos, mucho por descubrir.</h2><p>Los intentos locales no se convierten automáticamente en XP verificada.</p>{progress.attempts.length === 0 ? <div className="empty-state"><span>· − ·</span><h3>Tu primera señal te espera.</h3><button className="button primary" onClick={() => begin(lessons[0])}>Empezar una lección →</button></div> : <div className="history-list">{progress.attempts.slice(-15).reverse().map(attempt => <div key={attempt.id}><span><b>{lessons.find(l => l.id === attempt.lessonId)?.title || 'Ejercicio'}</b><small>{attempt.direction === 'send' ? 'Español → morse' : 'Morse → español'} · {new Date(attempt.date).toLocaleDateString('es')}</small></span><strong>{Math.round(attempt.accuracy)}%</strong></div>)}</div>}</section></div></>}
      {storageWarning && <p className="notice" role="status">{storageWarning}</p>}
    </main><footer className="site-footer"><span className="footer-brand">· − · &nbsp; learnmorse</span><p>Hecho para aprender. Abierto para compartir.</p>{install ? <button className="text-button" onClick={() => void install.prompt().then(() => setInstall(null))}>Instalar app ↗</button> : <span>Un punto a la vez.</span>}</footer>
  </>;
}
