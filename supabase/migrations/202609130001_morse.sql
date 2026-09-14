-- Rules/catalog version 1. All scoring writes go through transactional RPCs.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  alias text not null default 'Radioamigo' check (char_length(alias) between 2 and 24),
  avatar text not null default '🌱' check (avatar in ('🌱','🦊','🐸','🐱','🦉','🚀')),
  xp integer not null default 0 check (xp >= 0), last_attempt timestamptz
);
create function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id) values(new.id); return new; end $$;
create trigger user_profile after insert on auth.users for each row execute function public.new_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
create table public.lesson_catalog (
  lesson_id text not null, exercise_index integer not null, stage text not null,
  target text not null check (char_length(target) between 1 and 6000), version text not null default '1',
  primary key(lesson_id,exercise_index)
);
create table public.practice_attempts (
  user_id uuid not null references profiles on delete cascade, attempt_id uuid not null,
  lesson_id text not null, exercise_index integer not null, direction text not null check(direction in ('send','receive')),
  accuracy numeric not null, created_at timestamptz not null default now(), version text not null,
  primary key(user_id,attempt_id)
);
create table public.xp_events (
  user_id uuid not null references profiles on delete cascade, event_key text not null,
  amount integer not null check(amount>0), created_at timestamptz not null default now(), primary key(user_id,event_key)
);
create table public.rooms (
  id uuid primary key default gen_random_uuid(), code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  host_id uuid not null references profiles, direction text not null check(direction in ('send','receive')),
  stage text not null, duration integer not null check(duration in (60,180,300,600)),
  presentation text not null check(presentation in ('visual','audio')),
  status text not null default 'waiting' check(status in ('waiting','active','finished')),
  created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 minutes',
  starts_at timestamptz, ends_at timestamptz, winner_id uuid references profiles
);
create table public.room_members (
  room_id uuid not null references rooms on delete cascade, user_id uuid not null references profiles,
  ready boolean not null default false, finished boolean not null default false, forfeited boolean not null default false,
  primary key(room_id,user_id)
);
create table public.room_challenges (
  room_id uuid primary key references rooms on delete cascade, targets text[] not null, version text not null default '1'
);
create table public.duel_segments (
  room_id uuid not null, user_id uuid not null, segment_index integer not null,
  answer text not null, distance integer not null, denominator integer not null, correct boolean not null,
  received_at timestamptz not null default clock_timestamp(),
  primary key(room_id,user_id,segment_index), foreign key(room_id,user_id) references room_members
);

create function public.morse_normalize(value text) returns text language plpgsql immutable set search_path=public as $$
declare result text;
begin
  result := trim(regexp_replace(translate(normalize(value,NFC),'áéíóúüÁÉÍÓÚÜ¿','aeiouuAEIOUU'),'[[:space:]]+',' ','g'));
  if result ~ '[^a-zA-ZñÑ0-9 .,?�]' then raise exception 'Texto con caracteres no admitidos'; end if;
  return upper(result);
end $$;
create function public.morse_encode(value text) returns text language plpgsql immutable set search_path=public as $$
declare alphabet text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ0123456789.,?';
codes text[] := array['.-','-...','-.-.','-..','.','..-.','--.','....','..','.---','-.-','.-..','--','-.','---','.--.','--.-','.-.','...','-','..-','...-','.--','-..-','-.--','--..','--.--','-----','.----','..---','...--','....-','.....','-....','--...','---..','----.','.-.-.-','--..--','..--..'];
result text[] := '{}'; c text;
begin
  foreach c in array regexp_split_to_array(morse_normalize(value),'') loop
    result := array_append(result, case when c=' ' then '/' else codes[strpos(alphabet,c)] end);
  end loop; return array_to_string(result,' ');
end $$;
create function public.morse_decode(value text) returns text language plpgsql immutable set search_path=public as $$
declare alphabet text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ0123456789.,?'; token text; result text := ''; pos integer; word text;
codes text[] := string_to_array(morse_encode(alphabet),' ');
begin
  if value ~ '[^. /[:space:]\-]' then raise exception 'Secuencia morse no válida'; end if;
  value:=regexp_replace(value,'[[:space:]]+',' ','g');
  if trim(value)='' then return ''; end if;
  foreach word in array string_to_array(value,'/') loop
    if trim(word)='' then raise exception 'Cada separación de palabra necesita señales a ambos lados'; end if;
    if result<>'' then result:=result||' '; end if;
    foreach token in array regexp_split_to_array(trim(word),'[[:space:]]+') loop
      pos:=array_position(codes,token); result := result || coalesce(substr(alphabet,pos,1),'�');
    end loop;
  end loop; return morse_normalize(result);
end $$;
create function public.morse_distance(expected text, actual text) returns integer language plpgsql immutable set search_path=public as $$
declare prev integer[]; curr integer[]; i integer; j integer; n integer:=char_length(expected); m integer:=char_length(actual);
begin
  if expected=actual then return 0; end if;
  if n=0 then return m; end if; if m=0 then return n; end if;
  -- ponytail: O(n*m) edit distance; use a compiled implementation if long incorrect submissions become frequent.
  prev:=array(select generate_series(0,m));
  for i in 1..n loop
    curr:=array[i];
    for j in 1..m loop curr:=array_append(curr,least(curr[j]+1,prev[j+1]+1,prev[j]+case when substr(expected,i,1)=substr(actual,j,1) then 0 else 1 end)); end loop;
    prev:=curr;
  end loop; return prev[m+1];
end $$;
create function public.award_xp(who uuid, event text, points integer) returns void language plpgsql security definer set search_path=public as $$
begin
  insert into xp_events values(who,event,points,now()) on conflict do nothing;
  if found then update profiles set xp=xp+points where id=who; end if;
end $$;
create function public.update_profile(new_alias text,new_avatar text) returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión'; end if;
  update profiles set alias=trim(new_alias),avatar=new_avatar where id=auth.uid();
end $$;
create function public.submit_practice(p_lesson text,p_index integer,p_direction text,p_answer text,p_attempt uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare who uuid:=auth.uid(); target lesson_catalog; answer text; score numeric; last_time timestamptz; existing practice_attempts;
begin
  if who is null then raise exception 'Inicia sesión'; end if;
  select last_attempt into last_time from profiles where id=who for update;
  select * into existing from practice_attempts where user_id=who and attempt_id=p_attempt;
  if found then return jsonb_build_object('accuracy',existing.accuracy,'xp',(select xp from profiles where id=who),'awarded',0,'duplicate',true); end if;
  if p_direction not in ('send','receive') or p_direction is null or p_answer is null or char_length(p_answer)>36000 then raise exception 'Intento no válido'; end if;
  if last_time > now()-interval '2 seconds' then raise exception 'Espera dos segundos entre intentos'; end if;
  select * into target from lesson_catalog where lesson_id=p_lesson and exercise_index=p_index;
  if not found then raise exception 'Ejercicio desconocido'; end if;
  answer:=case when p_direction='send' then morse_decode(p_answer) else morse_normalize(p_answer) end;
  if char_length(answer)>6000 then raise exception 'Respuesta demasiado larga'; end if;
  score:=100*greatest(0,1-morse_distance(morse_normalize(target.target),answer)::numeric/greatest(char_length(morse_normalize(target.target)),char_length(answer),1));
  insert into practice_attempts values(who,p_attempt,p_lesson,p_index,p_direction,score,now(),target.version);
  update profiles set last_attempt=now() where id=who;
  if score>=85 then perform award_xp(who,'practice:'||p_attempt,10); end if;
  if not exists(select 1 from lesson_catalog c cross join (values('send'),('receive')) d(direction)
    where c.lesson_id=p_lesson and not exists(select 1 from practice_attempts a where a.user_id=who and a.lesson_id=c.lesson_id and a.exercise_index=c.exercise_index and a.direction=d.direction and a.accuracy>=85 and a.version=c.version))
  then perform award_xp(who,'lesson:'||p_lesson||':'||target.version,25); end if;
  return jsonb_build_object('accuracy',score,'xp',(select xp from profiles where id=who),'awarded',coalesce((select sum(amount) from xp_events where user_id=who and created_at=now()),0),'duplicate',false);
end $$;

create function public.is_member(room uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from room_members where room_id=room and user_id=auth.uid())
$$;
create function public.close_duel(room uuid) returns void language plpgsql security definer set search_path=public as $$
declare r rooms; winner uuid; member record; best record; runner record;
begin
  select * into r from rooms where id=room for update;
  if r.status<>'active' or (clock_timestamp()<r.ends_at and exists(select 1 from room_members where room_id=room and not finished)) then return; end if;
  -- Unsubmitted segments count as omissions; denominators include insertions.
  select * into best from (
    select m.user_id,m.forfeited,count(s.segment_index) filter(where s.correct) correct,
      1-sum(coalesce(s.distance,char_length(t.target)))::numeric/sum(coalesce(s.denominator,greatest(char_length(t.target),1))) accuracy,
      max(s.received_at) filter(where s.correct) last_correct
    from room_members m join room_challenges c on c.room_id=m.room_id cross join unnest(c.targets) with ordinality t(target,idx)
    left join duel_segments s on s.room_id=m.room_id and s.user_id=m.user_id and s.segment_index=t.idx-1
    where m.room_id=room group by m.user_id,m.forfeited
  ) x order by forfeited,correct desc,accuracy desc,last_correct asc nulls last limit 1;
  select * into runner from (
    select m.user_id,m.forfeited,count(s.segment_index) filter(where s.correct) correct,
      1-sum(coalesce(s.distance,char_length(t.target)))::numeric/sum(coalesce(s.denominator,greatest(char_length(t.target),1))) accuracy,
      max(s.received_at) filter(where s.correct) last_correct
    from room_members m join room_challenges c on c.room_id=m.room_id cross join unnest(c.targets) with ordinality t(target,idx)
    left join duel_segments s on s.room_id=m.room_id and s.user_id=m.user_id and s.segment_index=t.idx-1
    where m.room_id=room and m.user_id<>best.user_id group by m.user_id,m.forfeited
  ) x;
  if not best.forfeited and (runner.forfeited or best.correct>runner.correct or best.accuracy>runner.accuracy or best.last_correct<runner.last_correct) then winner:=best.user_id; end if;
  update rooms set status='finished',winner_id=winner where id=room;
  for member in select m.user_id from room_members m where m.room_id=room and not m.forfeited and exists(select 1 from duel_segments s where s.room_id=room and s.user_id=m.user_id and s.correct) order by m.user_id loop
    perform award_xp(member.user_id,'duel:'||room,10+case when member.user_id=winner then 10 else 0 end);
  end loop;
end $$;
create function public.duel_state(p_room uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms; targets text[]; rendered text[];
begin
  if not is_member(p_room) then raise exception 'No perteneces a esta sala'; end if;
  perform close_duel(p_room);
  select * into r from rooms where id=p_room;
  select c.targets into targets from room_challenges c where room_id=p_room;
  if r.status<>'waiting' and clock_timestamp()>=r.starts_at then
    select array_agg(case when r.direction='receive' then morse_encode(t) else t end order by ord) into rendered from unnest(targets) with ordinality x(t,ord);
  end if;
  return to_jsonb(r)||jsonb_build_object('server_now',clock_timestamp(),'segments',coalesce(rendered,'{}'),
    'members',(select jsonb_agg(to_jsonb(m)||jsonb_build_object('alias',p.alias,'avatar',p.avatar,'submitted',(select count(*) from duel_segments s where s.room_id=p_room and s.user_id=m.user_id),'correct',(select count(*) from duel_segments s where s.room_id=p_room and s.user_id=m.user_id and s.correct))) from room_members m join profiles p on p.id=m.user_id where m.room_id=p_room),
    'my_answers',(select coalesce(jsonb_agg(to_jsonb(s) order by segment_index),'[]') from duel_segments s where s.room_id=p_room and s.user_id=auth.uid()));
end $$;
create function public.create_duel(p_direction text,p_stage text,p_duration integer,p_presentation text) returns jsonb language plpgsql security definer set search_path=public as $$
declare room uuid; challenge text;
begin
  if auth.uid() is null then raise exception 'Inicia sesión'; end if;
  perform 1 from profiles where id=auth.uid() for update;
  if (select count(*) from rooms where host_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'Límite de diez salas por hora'; end if;
  select target into challenge from lesson_catalog where stage=p_stage order by random() limit 1;
  if challenge is null then raise exception 'Etapa no disponible'; end if;
  insert into rooms(host_id,direction,stage,duration,presentation) values(auth.uid(),p_direction,p_stage,p_duration,case when p_direction='send' then 'visual' else p_presentation end) returning id into room;
  insert into room_members(room_id,user_id) values(room,auth.uid());
  insert into room_challenges(room_id,targets) values(room,string_to_array(morse_normalize(challenge),' '));
  return duel_state(room);
end $$;
create function public.join_duel(p_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms;
begin
  if auth.uid() is null then raise exception 'Inicia sesión'; end if;
  select * into r from rooms where code=upper(trim(p_code)) for update;
  if not found then raise exception 'Código no válido'; end if;
  if is_member(r.id) then return duel_state(r.id); end if;
  if r.status<>'waiting' or r.expires_at<now() or (select count(*) from room_members where room_id=r.id)>=2 then raise exception 'Sala llena o caducada'; end if;
  insert into room_members(room_id,user_id) values(r.id,auth.uid()); return duel_state(r.id);
end $$;
create function public.ready_duel(p_room uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms;
begin
  if not is_member(p_room) then raise exception 'No perteneces a esta sala'; end if;
  select * into r from rooms where id=p_room for update;
  if r.status<>'waiting' or r.expires_at<now() then raise exception 'Sala no disponible'; end if;
  update room_members set ready=true where room_id=p_room and user_id=auth.uid();
  if (select count(*) from room_members where room_id=p_room and ready)=2 then
    update rooms set status='active',starts_at=clock_timestamp()+interval '3 seconds',ends_at=clock_timestamp()+make_interval(secs=>r.duration+3) where id=p_room;
  end if; return duel_state(p_room);
end $$;
create function public.submit_segment(p_room uuid,p_index integer,p_answer text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms; target text; answer text; total integer;
begin
  if not is_member(p_room) then raise exception 'No perteneces a esta sala'; end if;
  select * into r from rooms where id=p_room for update;
  if r.status<>'active' or clock_timestamp()<r.starts_at or clock_timestamp()>=r.ends_at or exists(select 1 from room_members where room_id=p_room and user_id=auth.uid() and finished) then raise exception 'El duelo no está activo'; end if;
  if p_index is null or p_index<>(select count(*) from duel_segments where room_id=p_room and user_id=auth.uid()) then raise exception 'Segmento fuera de orden o repetido'; end if;
  if p_answer is null or char_length(p_answer)>1500 then raise exception 'Respuesta no válida'; end if;
  select targets[p_index+1],cardinality(targets) into target,total from room_challenges where room_id=p_room;
  if target is null then raise exception 'Segmento inexistente'; end if;
  answer:=case when r.direction='send' then morse_decode(p_answer) else morse_normalize(p_answer) end;
  insert into duel_segments(room_id,user_id,segment_index,answer,distance,denominator,correct) values(p_room,auth.uid(),p_index,answer,morse_distance(target,answer),greatest(char_length(target),char_length(answer),1),target=answer);
  if p_index+1=total then update room_members set finished=true where room_id=p_room and user_id=auth.uid(); end if;
  return duel_state(p_room);
end $$;
create function public.finish_duel(p_room uuid,p_forfeit boolean default false) returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms;
begin
  if not is_member(p_room) then raise exception 'No perteneces a esta sala'; end if;
  if p_forfeit is null then raise exception 'Decisión no válida'; end if;
  -- Settle expired rooms before accepting any change to a participant's finish state.
  perform close_duel(p_room);
  select * into r from rooms where id=p_room for update;
  if r.status='active' then
    if clock_timestamp()<r.starts_at then raise exception 'El duelo no está activo'; end if;
    update room_members set finished=true,forfeited=p_forfeit where room_id=p_room and user_id=auth.uid();
    if p_forfeit then update room_members set finished=true where room_id=p_room; end if;
  end if; return duel_state(p_room);
end $$;

alter table profiles enable row level security;
alter table lesson_catalog enable row level security;
alter table practice_attempts enable row level security;
alter table xp_events enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table room_challenges enable row level security;
alter table duel_segments enable row level security;
create policy own_profile on profiles for select to authenticated using(id=auth.uid());
create policy own_attempts on practice_attempts for select to authenticated using(user_id=auth.uid());
create policy own_xp on xp_events for select to authenticated using(user_id=auth.uid());
create policy member_rooms on rooms for select to authenticated using(is_member(id));
create policy member_members on room_members for select to authenticated using(is_member(room_id));
create policy member_segments on duel_segments for select to authenticated using(is_member(room_id));
revoke all on all tables in schema public from anon,authenticated;
grant select on profiles,practice_attempts,xp_events,rooms,room_members,duel_segments to authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function is_member(uuid),update_profile(text,text),submit_practice(text,integer,text,text,uuid),duel_state(uuid),create_duel(text,text,integer,text),join_duel(text),ready_duel(uuid),submit_segment(uuid,integer,text),finish_duel(uuid,boolean) to authenticated;
-- Realtime is advisory: reconnect/polling always recovers canonical state via RPC.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.profiles,public.rooms,public.room_members,public.duel_segments;
  end if;
end $$;
