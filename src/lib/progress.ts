export type Attempt = { id: string; lessonId: string; exercise: number; direction: 'send' | 'receive'; accuracy: number; seconds: number; date: string };
export type Progress = { version: 1; attempts: Attempt[]; warning?: string };
export function readProgress(storage: Pick<Storage, 'getItem'>): Progress {
  try {
    const raw = storage.getItem('learn-morse-progress');
    if (!raw) return { version: 1, attempts: [] };
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.attempts) || !data.attempts.every((a: Attempt) =>
      a && typeof a.id === 'string' && typeof a.lessonId === 'string' && Number.isInteger(a.exercise) && a.exercise >= 0 &&
      ['send', 'receive'].includes(a.direction) && Number.isFinite(a.accuracy) && a.accuracy >= 0 && a.accuracy <= 100 &&
      Number.isFinite(a.seconds) && a.seconds >= 0 && typeof a.date === 'string')) throw new Error('Datos incompatibles');
    return data;
  } catch { return { version: 1, attempts: [], warning: 'No pudimos recuperar tu progreso local. Puedes practicar; revisa el almacenamiento de este navegador.' }; }
}
export const saveAttempt = (state: Progress, attempt: Attempt): Progress => state.attempts.some(a => a.id === attempt.id) ? state : { ...state, attempts: [...state.attempts, attempt] };
export const lessonPassed = (state: Progress, lessonId: string, count: number) => count > 0 &&
  ['send', 'receive'].every(direction => Array.from({ length: count }, (_, i) => i).every(exercise =>
    state.attempts.some(a => a.lessonId === lessonId && a.exercise === exercise && a.direction === direction && a.accuracy >= 85)));
