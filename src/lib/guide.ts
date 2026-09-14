export const GUIDE_STEPS = [
  {
    id: 'dot',
    title: 'Un punto',
    hint: 'Pulsa Espacio un instante y suelta. Un toque corto es un punto (·). En este curso, E es un solo punto.',
    success: 'Eso es un punto. Un toque corto; todavía no es otra letra.',
    mismatch: 'Eso no fue un solo punto. Suelta enseguida, una sola vez.',
  },
  {
    id: 'dash',
    title: 'Una raya',
    hint: 'Mantén Espacio un poco más de un cuarto de segundo. Una pulsación sostenida es una raya (—). T es una sola raya.',
    success: 'Eso es una raya. Un pulso sostenido; una sola señal.',
    mismatch: 'Eso no fue una sola raya. Mantén un instante más, sin encadenar otra señal.',
  },
  {
    id: 'sameLetter',
    title: 'La misma letra',
    hint: 'Pulsa dos veces seguidas, sin esperar. Mientras la letra está en construcción, cada señal se pega a la anterior. I es ··. Aún no es otra letra.',
    success: 'Varias señales forman una sola letra. Si hubieras esperado, serían letras distintas.',
    mismatch: 'Eso ya son letras distintas. Pulsa otra vez antes de que se confirme.',
  },
  {
    id: 'nextLetter',
    title: 'Otra letra',
    hint: 'Escribe una letra, espera a que se confirme (unos 700 ms) y escribe otra. Aparece un espacio en el código: · — es E y luego T, no una sola letra.',
    success: 'Hay dos letras. El espacio en el código las separa; aún no es un espacio de palabra.',
    mismatch: 'Eso ya es un espacio entre palabras. Espera menos: confirma la letra y continúa.',
  },
  {
    id: 'nextWord',
    title: 'Otra palabra',
    hint: 'Escribe una letra, espera todavía más (unos 1,6 s) y continúa. Aparece una barra / . Eso es el espacio entre palabras, no un silencio extra ni otra tecla.',
    success: 'Hay un espacio entre palabras. El código usa / para ese silencio largo.',
    mismatch: 'Sigue esperando un poco más después de la letra, hasta que el estado hable de palabra.',
  },
] as const;

export type GuideStepId = typeof GUIDE_STEPS[number]['id'];
export type StepStatus = 'incomplete' | 'complete' | 'mismatch';

function lettersOf(code: string) {
  return code.trim() ? code.split(' / ').flatMap(word => word.split(' ').filter(Boolean)) : [];
}

export function stepOutcome(id: GuideStepId, code: string, pending: string): StepStatus {
  const letters = lettersOf(code);
  if (id === 'dot') {
    if (pending.includes('-') || code.includes('-') || pending.length > 1 || letters.length > 1 || code.includes('/')) return 'mismatch';
    return pending === '.' || code === '.' ? 'complete' : 'incomplete';
  }
  if (id === 'dash') {
    if (pending.includes('.') || code.includes('.') || pending.length > 1 || letters.length > 1 || code.includes('/')) return 'mismatch';
    return pending === '-' || code === '-' ? 'complete' : 'incomplete';
  }
  if (id === 'sameLetter') {
    if (letters.length >= 2 || code.includes('/')) return 'mismatch';
    return pending.length > 1 || (letters.length === 1 && letters[0].length > 1) ? 'complete' : 'incomplete';
  }
  if (id === 'nextLetter') {
    if (code.includes('/')) return 'mismatch';
    return letters.length >= 2 ? 'complete' : 'incomplete';
  }
  return code.includes('/') ? 'complete' : 'incomplete';
}
