import { writeFile } from 'node:fs/promises'
import { lessons } from '../src/content/lessons.ts'
import { normalize } from '../src/lib/morse.ts'

const literal = (value: string) => `'${value.replaceAll("'", "''")}'`
const rows = lessons.flatMap(lesson => lesson.exercises.map((exercise, index) => `(${literal(lesson.id)},${index},${literal(lesson.stage)},${literal(normalize(exercise))},'1')`))
await writeFile(new URL('./seed.sql', import.meta.url), `-- Generated from the versioned course; run node supabase/generate-seed.ts after catalog changes.\ninsert into public.lesson_catalog(lesson_id,exercise_index,stage,target,version) values\n${rows.join(',\n')}\non conflict(lesson_id,exercise_index) do nothing;\n`, 'utf8')
console.log(`Generated ${rows.length} server exercises.`)
