import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const onlineAvailable = Boolean(url && key)
export const supabase = onlineAvailable ? createClient(url!, key!) : null
export type PracticeAward = { accuracy: number; xp: number; awarded: number; duplicate: boolean }

export async function submitPractice(lessonId: string, index: number, direction: 'send' | 'receive', answer: string, attemptId: string): Promise<PracticeAward | null> {
  if (!supabase || !(await supabase.auth.getSession()).data.session) return null
  const { data, error } = await supabase.rpc('submit_practice', { p_lesson: lessonId, p_index: index, p_direction: direction, p_answer: answer, p_attempt: attemptId })
  if (error) throw new Error(error.message)
  window.dispatchEvent(new Event('morse:profile'))
  return data as PracticeAward
}
