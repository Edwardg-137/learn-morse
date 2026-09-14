import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { lessons } from '../content/lessons'
import { MorseKey, readSettings } from '../components/MorseKey'
import { decode } from '../lib/morse'
import { playText, prepareAudio, stopAudio } from '../lib/audio'
import { supabase } from './client'
import './online.css'
export { onlineAvailable, submitPractice } from './client'

function useAccount() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  useEffect(() => {
    if (!supabase) return
    let live = true
    void supabase.auth.getSession().then(({ data }) => { if (live) { setUser(data.session?.user ?? null); setLoading(false) } })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false) })
    return () => { live = false; data.subscription.unsubscribe() }
  }, [])
  return { user, loading }
}
function ConnectionNotice() {
  return <div className="online-notice"><span aria-hidden="true">📡</span><h3>Tu estación, pronto en línea</h3><p>Las cuentas y los duelos todavía no están disponibles. Puedes disfrutar de todas las lecciones y guardar tu práctica en este dispositivo.</p></div>
}
export function OnlineIdentity() {
  const { user, loading } = useAccount()
  const [profile, setProfile] = useState<{ id: string; alias: string; avatar: string; xp: number } | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [celebration, setCelebration] = useState('')
  const lastProfile = useRef<{ id: string; xp: number } | null>(null)
  useEffect(() => { if (!celebration) return; const timer = window.setTimeout(() => setCelebration(''), 1800); return () => window.clearTimeout(timer) }, [celebration])
  useEffect(() => {
    if (!supabase || !user) { setProfile(null); return }
    let live = true
    setUnavailable(false)
    const refresh = async () => {
      const { data, error } = await supabase!.from('profiles').select('id,alias,avatar,xp').eq('id', user.id).single()
      if (live) {
        setUnavailable(Boolean(error))
        if (!error) {
          const previous = lastProfile.current
          if (previous && previous.id === data.id && data.xp > previous.xp) {
            const level = 1 + Math.floor(data.xp / 100)
            setCelebration(`${Math.floor(data.xp / 100) > Math.floor(previous.xp / 100) ? `¡Nivel ${level}! · ` : ''}+${data.xp - previous.xp} XP`)
          }
          lastProfile.current = data; setProfile(data)
        }
      }
    }
    const changed = () => { void refresh() }
    changed()
    window.addEventListener('morse:profile', changed)
    const channel = supabase.channel(`identity:${user.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, changed).subscribe()
    return () => { live = false; window.removeEventListener('morse:profile', changed); void supabase!.removeChannel(channel) }
  }, [user?.id])
  if (profile && profile.id === user?.id) return <><span className="avatar-small" aria-hidden="true">{profile.avatar}</span><span className="online-identity-details">{profile.alias}<small>Nivel {1 + Math.floor(profile.xp / 100)} · {profile.xp} XP verificadas{unavailable ? ' · Sin actualizar' : ''}</small>{celebration && <span className="online-xp-bubble" role="status">{celebration}</span>}</span></>
  if (user || loading) return <><span className="avatar-small" aria-hidden="true">◉</span><span>Tu estación<small>{unavailable ? 'Perfil no disponible' : 'Conectando perfil…'}</small></span></>
  return <><span className="avatar-small" aria-hidden="true">◉</span><span>Explorador<small>Perfil local</small></span></>
}
export function AccountPanel() {
  const { user, loading } = useAccount()
  const [alias, setAlias] = useState('')
  const [avatar, setAvatar] = useState('🌱')
  const [xp, setXp] = useState(0)
  const [profileOwner, setProfileOwner] = useState<string | null>(null)
  const currentUser = useRef(user?.id); currentUser.current = user?.id
  const [stats, setStats] = useState<{ direction: string; accuracy: number }[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = useCallback(async () => {
    if (!user || !supabase) return
    const [profile, attempts] = await Promise.all([supabase.from('profiles').select('alias,avatar,xp').eq('id', user.id).single(), supabase.from('practice_attempts').select('direction,accuracy').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000)])
    if (currentUser.current !== user.id) return
    if (profile.error) { setMessage(profile.error.message); return }
    setAlias(profile.data.alias); setAvatar(profile.data.avatar); setXp(profile.data.xp)
    setProfileOwner(user.id)
    if (attempts.error) setMessage(attempts.error.message)
    else setStats(attempts.data)
  }, [user])
  useEffect(() => { void refresh(); const handler = () => { void refresh() }; window.addEventListener('morse:profile', handler); return () => window.removeEventListener('morse:profile', handler) }, [refresh])
  const run = async (action: () => Promise<void>) => { setBusy(true); setMessage(''); try { await action() } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo conectar.') } finally { setBusy(false) } }
  if (!supabase) return <ConnectionNotice />
  if (loading) return <p role="status">Conectando tu estación…</p>
  if (!user) return <div className="online-notice"><h3>Conserva tu progreso en línea</h3><p>Accede con Google para ganar XP verificada y enviar una invitación a otro aprendiz. Tu práctica local seguirá en este dispositivo.</p><button disabled={busy} onClick={() => void run(async () => { const { error } = await supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } }); if (error) throw error })}>Continuar con Google</button><p role="status">{message}</p></div>
  if (profileOwner !== user.id) return <div className="online-notice"><p role="status">{message || 'Cargando tu perfil verificado…'}</p>{message && <button onClick={() => { setMessage(''); void refresh() }}>Volver a conectar</button>}</div>
  return <section className="online-panel"><div className="online-profile"><span className="online-avatar" aria-hidden="true">{avatar}</span><div><h3>{alias || 'Tu estación'}</h3><p>Nivel {1 + Math.floor(xp / 100)} · {xp} XP verificadas</p><progress value={xp % 100} max={100} aria-label="Progreso hasta el siguiente nivel" /></div></div>
    <form onSubmit={event => { event.preventDefault(); void run(async () => { const { error } = await supabase!.rpc('update_profile', { new_alias: alias, new_avatar: avatar }); if (error) throw error; setMessage('Perfil guardado.'); window.dispatchEvent(new Event('morse:profile')) }) }}>
      <label>Alias<input value={alias} minLength={2} maxLength={24} required onChange={event => setAlias(event.target.value)} /></label>
      <label>Avatar<select value={avatar} onChange={event => setAvatar(event.target.value)}>{['🌱','🦊','🐸','🐱','🦉','🚀'].map(item => <option key={item}>{item}</option>)}</select></label>
      <button disabled={busy}>Guardar perfil</button>
    </form>
    <div className="online-stats">{['send','receive'].map(direction => { const rows = stats.filter(row => row.direction === direction); return <p key={direction}>{direction === 'send' ? 'Transmisión' : 'Recepción'}: {rows.length ? `${Math.round(rows.reduce((sum, row) => sum + Number(row.accuracy), 0) / rows.length)} %` : 'sin intentos verificados'}</p> })}</div>
    <p className="online-muted">Promedio de hasta 1000 intentos recientes. La XP local no se convierte automáticamente en XP verificada.</p>
    <button className="secondary" disabled={busy} onClick={() => void run(async () => { const { error } = await supabase!.auth.signOut(); if (error) throw error })}>Cerrar sesión</button><p role="status">{message}</p>
  </section>
}

type Member = { user_id: string; alias: string; avatar: string; ready: boolean; finished: boolean; forfeited: boolean; submitted: number; correct: number }
type Room = { id: string; code: string; direction: 'send' | 'receive'; stage: string; duration: number; presentation: 'visual' | 'audio'; status: 'waiting' | 'active' | 'finished'; starts_at: string | null; ends_at: string | null; expires_at: string; server_now: string; winner_id: string | null; segments: string[]; members: Member[]; my_answers: { segment_index: number; correct: boolean; answer: string }[] }
export function CompetitionPanel() {
  const { user, loading } = useAccount()
  const currentUser = useRef(user?.id); currentUser.current = user?.id
  const [room, setRoom] = useState<Room | null>(null)
  const [direction, setDirection] = useState('send')
  const [stage, setStage] = useState(lessons[0]?.stage ?? '')
  const [duration, setDuration] = useState(180)
  const [presentation, setPresentation] = useState('visual')
  const [code, setCode] = useState('')
  const [answer, setAnswer] = useState('')
  const [pending, setPending] = useState(false)
  const [settings] = useState(readSettings)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [time, setTime] = useState(Date.now())
  const [offset, setOffset] = useState(0)
  const audioEpoch = useRef(0)
  const latestState = useRef<{ id: string; timestamp: number } | null>(null)
  const accept = useCallback((next: Room) => {
    const timestamp = Date.parse(next.server_now)
    if (latestState.current?.id === next.id && timestamp < latestState.current.timestamp) return
    latestState.current = { id: next.id, timestamp }
    setRoom(next); setOffset(timestamp - Date.now())
    if (next.status === 'finished') window.dispatchEvent(new Event('morse:profile'))
  }, [])
  const action = async (name: string, params: Record<string, unknown>) => {
    if (!supabase) return
    const owner = user?.id
    setBusy(true); setMessage('')
    try { const { data, error } = await supabase.rpc(name, params); if (owner !== currentUser.current) return; if (error) throw error; accept(data); if (name === 'submit_segment') { setAnswer(''); stopAudio() } }
    catch (error) { setMessage(error instanceof Error ? error.message : (error as {message?:string}).message ?? 'Sin conexión. Vuelve a intentar; el reloj del servidor continúa.') }
    finally { setBusy(false) }
  }
  useEffect(() => {
    setRoom(null); setAudioReady(false)
    if (!user || !supabase) return
    let live = true
    // Membership RLS limits recovery to this account's actual rooms.
    void supabase.from('rooms').select('id').order('created_at', { ascending: false }).limit(1).then(async ({ data }) => { if (data?.[0] && live) { const result = await supabase!.rpc('duel_state', { p_room: data[0].id }); if (live && !result.error) accept(result.data) } })
    return () => { live = false }
  }, [user?.id, accept])
  useEffect(() => {
    if (!room || !supabase || room.status === 'finished') return
    let live = true
    const refresh = async () => { const { data, error } = await supabase!.rpc('duel_state', { p_room: room.id }); if (!live) return; if (error) setMessage('Conexión interrumpida. El reloj continúa; recuperaremos el resultado del servidor.'); else { accept(data); setMessage('') } }
    const interval = window.setInterval(() => { void refresh() }, 3000)
    const channel = supabase.channel(`duel:${room.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, () => { void refresh() }).on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${room.id}` }, () => { void refresh() }).on('postgres_changes', { event: '*', schema: 'public', table: 'duel_segments', filter: `room_id=eq.${room.id}` }, () => { void refresh() }).subscribe()
    return () => { live = false; window.clearInterval(interval); void supabase!.removeChannel(channel); audioEpoch.current++; stopAudio() }
  }, [room?.id, room?.status, accept])
  useEffect(() => {
    const id = window.setInterval(() => setTime(Date.now()), 250)
    const silence = () => { audioEpoch.current++; stopAudio() }
    const hidden = () => { if (document.hidden) silence() }
    window.addEventListener('blur', silence); document.addEventListener('visibilitychange', hidden)
    return () => { window.clearInterval(id); window.removeEventListener('blur', silence); document.removeEventListener('visibilitychange', hidden); silence() }
  }, [])
  useEffect(() => { setAnswer(''); setPending(false); audioEpoch.current++; stopAudio() }, [room?.id, room?.members.find(member => member.user_id === user?.id)?.submitted])
  const audio = async (value: string) => {
    if (settings.volume === 0) { setMessage('El volumen está en silencio. Actívalo en los ajustes de práctica antes de comprobar el audio.'); return }
    const request = ++audioEpoch.current
    try { await prepareAudio(); if (request !== audioEpoch.current) return; await playText(value, 100, settings.volume); if (request === audioEpoch.current) setAudioReady(true) }
    catch { if (request === audioEpoch.current) setMessage('No se pudo activar el audio. Comprueba el sonido antes de prepararte.') }
  }
  if (!supabase) return <ConnectionNotice />
  if (loading) return <p role="status">Conectando…</p>
  if (!user) return <div className="online-notice"><h3>Aprender juntos suena mejor</h3><p>Inicia sesión desde Perfil para crear o aceptar un duelo por invitación.</p></div>
  const me = room?.members.find(member => member.user_id === user.id)
  const index = me?.submitted ?? 0
  const now = time + offset
  const seconds = room?.ends_at ? Math.max(0, Math.ceil((Date.parse(room.ends_at) - now) / 1000)) : 0
  const playing = room?.status === 'active' && Boolean(room.starts_at && now >= Date.parse(room.starts_at)) && seconds > 0 && !me?.finished && index < room.segments.length
  return <section className="online-panel">
    {!room ? <><div className="online-heading"><h3>Un duelo, dos estaciones</h3><p>Comparte un código con un amigo. Ambos resolverán el mismo reto.</p></div>
      <form onSubmit={event => { event.preventDefault(); setAudioReady(false); void action('create_duel', { p_direction: direction, p_stage: stage, p_duration: duration, p_presentation: presentation }) }}>
        <label>Dirección<select value={direction} onChange={event => setDirection(event.target.value)}><option value="send">Español → Morse</option><option value="receive">Morse → Español</option></select></label>
        <label>Etapa<select value={stage} onChange={event => setStage(event.target.value)}>{[...new Set(lessons.map(lesson => lesson.stage))].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Duración<select value={duration} onChange={event => setDuration(Number(event.target.value))}>{[60,180,300,600].map(value => <option value={value} key={value}>{value / 60} min</option>)}</select></label>
        {direction === 'receive' && <label>Presentación<select value={presentation} onChange={event => setPresentation(event.target.value)}><option value="visual">Morse visual</option><option value="audio">Solo audio · 100 ms por punto</option></select></label>}
        <button disabled={busy}>Crear sala</button>
      </form><form onSubmit={event => { event.preventDefault(); setAudioReady(false); void action('join_duel', { p_code: code }) }}><label>Código de invitación<input value={code} onChange={event => setCode(event.target.value.toUpperCase())} maxLength={10} minLength={10} required autoComplete="off" /></label><button disabled={busy}>Unirme al duelo</button></form></> : <>
      <div className="online-room-head"><div><p className="online-muted">CÓDIGO DE INVITACIÓN</p><strong className="online-code">{room.code}</strong></div><span className="online-clock" aria-label="Tiempo restante">{room.status === 'waiting' ? `${room.duration / 60} min` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</span></div>
      <p>{room.direction === 'send' ? 'Español → Morse' : 'Morse → Español'} · {room.stage} · {room.presentation === 'audio' ? 'Solo audio, punto de 100 ms' : 'Visual'}</p>
      <div className="online-players">{room.members.map(member => <div key={member.user_id}><span aria-hidden="true">{member.avatar}</span> <strong>{member.alias}</strong><p>{member.correct} correctos · {member.submitted} enviados</p><small>{member.forfeited ? 'Se rindió' : member.finished ? 'Finalizó' : member.ready ? 'Preparado' : 'Esperando'}</small></div>)}{room.members.length < 2 && <div>Esperando otra estación…</div>}</div>
      {room.status === 'waiting' && <><p>La invitación caduca a las {new Date(room.expires_at).toLocaleTimeString()}. Ambos deben confirmar antes de comenzar.</p>{room.presentation === 'audio' && <button className="secondary" onClick={() => void audio('SOS')}>{audioReady ? '✓ Volver a probar audio' : 'Comprobar audio'}</button>}<button disabled={busy || me?.ready || (room.presentation === 'audio' && !audioReady)} onClick={() => void action('ready_duel', { p_room: room.id })}>{me?.ready ? 'Esperando al otro jugador' : 'Estoy preparado'}</button></>}
      {room.status === 'active' && <>
        {room.starts_at && now < Date.parse(room.starts_at) && <p role="status">Comenzamos en {Math.ceil((Date.parse(room.starts_at) - now) / 1000)}…</p>}
        {playing && <div className="online-challenge"><p>Segmento {index + 1} de {room.segments.length}</p>{room.presentation === 'audio' ? <button className="secondary" onClick={() => void audio(decode(room.segments[index] ?? ''))}>▶ Escuchar segmento</button> : <p className="online-target">{room.segments[index]}</p>}
          {room.direction === 'send' ? <MorseKey onChange={setAnswer} onPendingChange={setPending} settings={settings} disabled={busy} resetKey={`${room.id}:${index}`} /> : <label>Tu traducción<input value={answer} onChange={event => setAnswer(event.target.value)} maxLength={200} autoComplete="off" /></label>}
          <button disabled={busy || pending || !answer.trim()} onClick={() => void action('submit_segment', { p_room: room.id, p_index: index, p_answer: answer })}>Confirmar segmento</button>
          <p className="online-muted">Lo confirmado es definitivo. Las pausas separan letras y palabras.</p>
        </div>}
        {!playing && seconds === 0 && <p role="status">Plazo terminado. Esperando el resultado validado del servidor…</p>}
        {me?.finished && <p>Tu entrega quedó guardada. Esperando el cierre del duelo.</p>}
        {!me?.finished && <div className="online-actions"><button className="secondary" disabled={busy} onClick={() => void action('finish_duel', { p_room: room.id, p_forfeit: false })}>Entregar y finalizar</button><button className="secondary" disabled={busy} onClick={() => void action('finish_duel', { p_room: room.id, p_forfeit: true })}>Rendirme</button></div>}
      </>}
      {room.status === 'finished' && <div className="online-result"><h3>{room.winner_id === user.id ? '¡Ganaste el duelo!' : room.winner_id ? `${room.members.find(member => member.user_id === room.winner_id)?.alias ?? 'La otra estación'} ganó` : 'Duelo empatado'}</h3><p>Resultado confirmado por el servidor. La XP de participación requiere al menos un segmento correcto y no haberse rendido.</p><details><summary>Revisar mis respuestas</summary><ol>{room.my_answers.map(item => <li key={item.segment_index}>{item.answer || '(vacío)'} — {item.correct ? 'Correcto' : 'Por practicar'}</li>)}</ol></details><button onClick={() => { setRoom(null); setAnswer(''); setAudioReady(false); window.dispatchEvent(new Event('morse:profile')) }}>Otro duelo</button></div>}
      {room.status === 'waiting' && <button className="secondary" disabled={busy} onClick={() => setRoom(null)}>Volver a las salas</button>}
    </>}
    <p role="status">{message}</p>
  </section>
}
