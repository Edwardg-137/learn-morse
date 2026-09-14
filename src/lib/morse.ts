/** International Morse repertoire plus Ñ (--.--) as an explicit course convention. */
export const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', Ñ: '--.--',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..',
};

const LETTERS = Object.fromEntries(Object.entries(MORSE).map(([letter, code]) => [code, letter]));

function clean(text: string, allowUnknown = false): string {
  if (typeof text !== 'string') throw new Error('La entrada debe ser texto.');
  const plain = text.normalize('NFC').replace(/[áéíóúü]/gi, vowel => vowel.normalize('NFD')[0]).replace(/¿/g, '');
  const invalid = [...plain].find(symbol => !/[a-zA-ZñÑ0-9.,?\s]/u.test(symbol) && !(allowUnknown && symbol === '�'));
  if (invalid) throw new Error(`El símbolo «${invalid}» no está admitido. Usa letras, Ñ, números, punto, coma o interrogación.`);
  return plain.toUpperCase().replace(/\s+/gu, ' ').trim();
}

export function normalize(text: string): string {
  return clean(text);
}

export function encode(text: string): string {
  return normalize(text).split(' ').map(word => [...word].map(letter => MORSE[letter]).join(' ')).join(' / ');
}

export function decode(code: string): string {
  if (typeof code !== 'string' || /[^.\-/\s]/u.test(code)) throw new Error('Usa puntos, rayas, espacios entre letras y / entre palabras.');
  if (!code.trim()) return '';
  return code.trim().split('/').map(word => {
    if (!word.trim()) throw new Error('Cada separación de palabra debe tener señales a ambos lados.');
    return word.trim().split(/\s+/u).map(letter => LETTERS[letter] ?? '�').join('');
  }).join(' ');
}

export function evaluate(expected: string, actual: string): {
  accuracy: number; distance: number; substitutions: number; insertions: number; deletions: number;
} {
  const target = normalize(expected);
  const answer = clean(actual, true);
  // ponytail: O(n*m) time, O(m) memory; use banded alignment if texts grow beyond this 500-word course.
  let previous = Array.from({ length: answer.length + 1 }, (_, insertions) => ({ distance: insertions, substitutions: 0, insertions, deletions: 0 }));
  for (let i = 1; i <= target.length; i++) {
    const current = [{ distance: i, substitutions: 0, insertions: 0, deletions: i }];
    for (let j = 1; j <= answer.length; j++) {
      const cost = Number(target[i - 1] !== answer[j - 1]);
      const diagonal = previous[j - 1];
      const deletion = previous[j];
      const insertion = current[j - 1];
      if (diagonal.distance + cost <= deletion.distance + 1 && diagonal.distance + cost <= insertion.distance + 1) {
        current.push({ ...diagonal, distance: diagonal.distance + cost, substitutions: diagonal.substitutions + cost });
      } else if (deletion.distance <= insertion.distance) {
        current.push({ ...deletion, distance: deletion.distance + 1, deletions: deletion.deletions + 1 });
      } else {
        current.push({ ...insertion, distance: insertion.distance + 1, insertions: insertion.insertions + 1 });
      }
    }
    previous = current;
  }
  const result = previous[answer.length];
  return { accuracy: 100 * Math.max(0, 1 - result.distance / Math.max(target.length, answer.length, 1)), ...result };
}
