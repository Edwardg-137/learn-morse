# Servicio en línea

La aplicación local funciona sin Supabase. Para cuentas Google, XP verificada y duelos hace falta un proyecto configurado. No existen credenciales ni un servicio público creado en este repositorio.

Usar un proyecto dedicado a Learn Morse: la migración inicial configura permisos de las tablas y funciones del esquema `public` completo. No aplicarla sin adaptar a una base compartida con otras aplicaciones.

1. Crear un proyecto Supabase propio. Aplicar `migrations/202609130001_morse.sql` y después `seed.sql` desde SQL Editor, en ese orden. También se puede vincular Supabase CLI y usar `supabase db push --include-seed`.
2. Habilitar Google en Authentication → Providers y configurar el identificador y secreto OAuth de Google. Registrar en Google la URL de callback que muestra Supabase. Añadir el dominio de la aplicación a Site URL y Redirect URLs en Authentication → URL Configuration. Para desarrollo permitir `http://localhost:5173` y `http://127.0.0.1:5173`.
3. Crear `.env.local` en la raíz con las variables públicas del proyecto:

```dotenv
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU-CLAVE-ANON-O-PUBLISHABLE
```

La clave pública del navegador está limitada por RLS. Nunca colocar `service_role`, contraseña de PostgreSQL ni secreto OAuth en variables `VITE_*`.

4. Reiniciar Vite o volver a compilar.

Hasta que existan esas variables, Perfil y Competir muestran que el servicio en línea no está configurado. No hay datos de usuarios ficticios.

## Verificación remota (pendiente en este repositorio)

No afirmar que OAuth, Realtime o dos navegadores funcionan hasta completar, en un proyecto real:

1. Crear el proyecto Supabase.
2. Aplicar `migrations/202609130001_morse.sql`.
3. Aplicar `seed.sql`.
4. Habilitar Google OAuth.
5. Configurar Site URL.
6. Configurar Redirect URLs (`http://127.0.0.1:5173`, `http://localhost:5173` y el dominio HTTPS final).
7. Copiar `.env.example` a `.env.local`.
8. Rellenar solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
9. Reiniciar Vite.
10. Crear dos cuentas Google distintas.
11. Crear una sala.
12. Unirse con el código de diez caracteres.
13. Confirmar preparación en ambos navegadores.
14. Completar duelos en ambas direcciones.
15. Probar presentación visual y auditiva (el punto competitivo dura 100 ms).
16. Probar reconexión a la sala reciente.
17. Comprobar resultado y XP.
18. Revisar tablas con RLS activado (un tercero no lee objetivos ni salas ajenas).

## Desarrollo y comprobación

Con Node 24 y dependencias instaladas, `node --test tests/online.test.ts` ejecuta PostgreSQL real mediante PGlite en memoria, sin secretos. Crea únicamente el esquema mínimo de identidad para simular los JWT de tres usuarios; ejecuta la migración y prueba RPC, RLS, XP, orden, preparación y vencimiento. Docker puede estar instalado; sin Supabase CLI, `supabase start` no forma parte de la evidencia de este repositorio. PGlite no prueba Google OAuth, transporte Realtime ni latencia de un Supabase remoto. La entrega necesita el recorrido de dos navegadores en un proyecto configurado antes de publicarse.

Para Supabase completo local se requiere Docker activo y Supabase CLI: `supabase start` y `supabase db reset`. El proveedor Google está desactivado en `config.toml` hasta que el operador configure `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, sus redirecciones y `enabled = true`.

El catálogo del servidor se genera desde `src/content/lessons.ts` con `node supabase/generate-seed.ts`. `seed.sql` inserta objetivos versionados, no acepta objetivos enviados por el cliente y no sobrescribe ejercicios existentes. Cuando cambie un objetivo ya publicado, preparar una migración explícita que actualice su versión y el catálogo: las partidas abiertas conservan sus objetivos originales. No basta con cambiar el texto del navegador.

## Reglas y límites

Las escrituras de XP, perfiles y partidas pasan por funciones SQL con identidad `auth.uid()`, búsqueda de esquema fija y transacciones. El navegador solo puede leer su perfil, intentos y XP; puede leer salas, miembros y segmentos de salas a las que pertenece. No puede leer ni escribir los objetivos privados ni modificar filas directamente. La edición del perfil permite alias de 2–24 caracteres y seis avatares incorporados.

La práctica entrega 10 XP al alcanzar 85 %, y 25 XP por completar por primera vez cada ejercicio de una lección en ambas direcciones. La clave de intento hace idempotente un reenvío. Se permiten nuevos intentos cada dos segundos. Las respuestas tienen límites de longitud; el cálculo exacto de distancia de edición tiene costo cuadrático para respuestas largas incorrectas. No hay prueba de pulsación humana ni protección contra traductores; no usar estos duelos para premios.

Cada sala acepta dos cuentas, caduca para nuevas entradas en 30 minutos y fija un inicio común tres segundos después de que ambas confirmen. El objetivo se divide por palabras sin descartar el resto del texto. Hay un límite de diez salas creadas por cuenta y hora. Los segmentos se confirman una sola vez y en orden. El servidor cierra al entregar ambos, al rendirse alguien o al consultar tras el vencimiento; no se necesita un temporizador servidor permanente. Sin conexión, el resultado queda pendiente hasta volver a consultar. El duelo reciente se recupera por pertenencia al recargar.

El desempate usa segmentos correctos, precisión incluyendo pendientes como omisiones, y recepción del último segmento correcto. Si las tres medidas coinciden hay empate. La latencia influye en el último criterio. Participar con al menos un acierto concede 10 XP; ganar agrega 10 XP a quien tuvo participación efectiva. Rendirte concede cero. Cada concesión se guarda una sola vez, aunque se consulte o cierre repetidamente.

Realtime comunica cambios confirmados de perfiles y salas; consultar la sala cada tres segundos permite recuperar estado incluso si se pierde una notificación. El reloj visible se ajusta usando la hora que devuelve el servidor. El cliente no concede XP ni determina el ganador. Una entrega o rendición que llegue después del plazo recupera el resultado ya cerrado y no puede cambiarlo.

La cabecera muestra el alias, avatar, nivel y XP consultados del perfil conectado; antes de disponer del perfil no presenta XP inventada. La captura competitiva reutiliza los ajustes de tecla, tolerancias y volumen guardados por la práctica y valida sus límites. Una señal pendiente bloquea la confirmación del segmento. Cambiar de sala, finalizar, desenfocar u ocultar la página cancela audio; el reloj competitivo continúa.

No hay tarea automática de retención instalada. Para minimizar datos, un operador puede borrar `duel_segments` de salas finalizadas hace más de 30 días **después** de exportar los resúmenes que quiera conservar; al borrarlos se pierde la revisión detallada. No borrar miembros o salas activas. Las respuestas de práctica no se almacenan: solo su precisión y referencias de ejercicio. El correo queda exclusivamente en Supabase Auth.
