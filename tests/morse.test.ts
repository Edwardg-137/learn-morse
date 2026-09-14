import test from 'node:test';
import assert from 'node:assert/strict';
import { MORSE, normalize, encode, decode, evaluate } from '../src/lib/morse.ts';
import { lessons } from '../src/content/lessons.ts';

test('Spanish normalization preserves Ñ and rejects unsupported symbols', () => {
  assert.equal(normalize('  ¿Qué   pingüino\nsoñó? ÁÉÍÓÚ  '), 'QUE PINGUINO SOÑO? AEIOU');
  assert.equal(normalize('nin\u0303o'), 'NIÑO');
  for (const text of ['hola!', 'ç', 'ß', '🙂', '�', 'sí: no']) assert.throws(() => normalize(text));
  assert.equal(normalize(' \n '), '');
});

test('encoding uses exact Morse patterns and separates letters and words', () => {
  assert.equal(encode('SOS'), '... --- ...');
  assert.equal(encode('año 19, sí.'), '.- --.-- --- / .---- ----. --..-- / ... .. .-.-.-');
  assert.equal(encode('¿0?'), '----- ..--..');
  assert.equal(decode('... --- ... / .- --.-- ---'), 'SOS AÑO');
  assert.equal(decode('  ...   ---\n...  /  .- '), 'SOS A');
  assert.equal(encode(''), '');
  assert.equal(decode(''), '');
  for (const text of ['ABC', '-x-', '/ .-', '.- // -...']) assert.throws(() => decode(text));
  assert.equal(decode('...... / .-'), '� A');
});

test('all initial symbols round trip and have distinct patterns', () => {
  const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ0123456789.,?';
  assert.equal(encode('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '.- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --..');
  assert.equal(encode('0123456789'), '----- .---- ..--- ...-- ....- ..... -.... --... ---.. ----.');
  assert.equal(Object.keys(MORSE).length, symbols.length);
  assert.equal(new Set(Object.values(MORSE)).size, symbols.length);
  for (const symbol of symbols) assert.equal(decode(encode(symbol)), symbol);
});

test('scoring counts substitutions, omissions, and additions without shifting later letters', () => {
  assert.deepEqual(evaluate('CASA', 'COSA'), { accuracy: 75, distance: 1, substitutions: 1, insertions: 0, deletions: 0 });
  assert.deepEqual(evaluate('CASA', 'CSA'), { accuracy: 75, distance: 1, substitutions: 0, insertions: 0, deletions: 1 });
  assert.deepEqual(evaluate('CASA', 'CASAS'), { accuracy: 80, distance: 1, substitutions: 0, insertions: 1, deletions: 0 });
  assert.deepEqual(evaluate('', ''), { accuracy: 100, distance: 0, substitutions: 0, insertions: 0, deletions: 0 });
  assert.deepEqual(evaluate('A', ''), { accuracy: 0, distance: 1, substitutions: 0, insertions: 0, deletions: 1 });
  assert.deepEqual(evaluate('', 'A'), { accuracy: 0, distance: 1, substitutions: 0, insertions: 1, deletions: 0 });
  assert.equal(evaluate('¿Niño?', 'NIÑO?').accuracy, 100);
  assert.equal(evaluate('A', decode('......')).accuracy, 0);
  assert.throws(() => evaluate('�', 'A'));
  assert.throws(() => evaluate('A', '!'));
});

test('catalog has distinct variants, complete symbols, and valid original exercise text', () => {
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length);
  const practiced = new Set<string>();
  const stages = new Set<string>();
  for (const lesson of lessons) {
    stages.add(lesson.stage);
    assert.ok(lesson.title && lesson.description && lesson.explanation, lesson.id);
    assert.ok(lesson.examples.length > 0, lesson.id);
    assert.ok(lesson.exercises.length >= 2, lesson.id);
    assert.equal(new Set(lesson.exercises).size, lesson.exercises.length, lesson.id);
    for (const text of [...lesson.examples, ...lesson.exercises]) {
      const normalized = normalize(text);
      assert.ok(normalized.length > 0, lesson.id);
      assert.equal(decode(encode(text)), normalized);
      for (const symbol of normalized) if (symbol !== ' ') practiced.add(symbol);
      for (const symbol of normalized) if (symbol !== ' ') assert.ok(lesson.symbols.includes(symbol), `${lesson.id}: ${symbol}`);
    }
    for (const text of lesson.exercises) {
      const words = normalize(text).split(' ').length;
      if (lesson.stage === 'Frases') assert.ok(words >= 5 && words <= 25, `${lesson.id}: ${words}`);
      if (lesson.stage === 'Párrafos') assert.ok(words >= 30 && words <= 150, `${lesson.id}: ${words}`);
      if (lesson.stage === 'Textos largos') assert.ok(words >= 150 && words <= 500, `${lesson.id}: ${words}`);
    }
  }
  assert.equal(stages.size, 7);
  for (const symbol of 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ0123456789.,?') assert.ok(practiced.has(symbol), symbol);
  assert.ok(lessons.some(lesson => lesson.stage === 'Textos largos' && lesson.exercises.some(text => normalize(text).split(' ').length >= 450)));
});
