# Estado de arquitectura

Actualizado: 2026-09-14.

## Interfaz

React 19 y TypeScript se compilian con Vite 7 a archivos estáticos. `src/App.tsx` mantiene la página activa por hash (`#aprender`, `#practicar`, `#competir`, `#perfil`) y el ejercicio abierto en memoria. En Aprender, el botón del hero abre `MorseGuide` como un `dialog` que se expande desde ese botón. `stepOutcome` en `src/lib/guide.ts` valida un solo paso; no se avanza hasta completarlo y elegir «Siguiente». Cerrado, no hay tecla montada. `Practice` orquesta dirección, segmentos, pistas, historial y resultados. `MorseKey` es el único control que produce puntos y rayas.

El CSS propio define la identidad de radio y señales, el diseño de dos columnas en escritorio y el apilado en móvil. `prefers-reduced-motion: reduce` elimina animaciones y transiciones.

## Motor local de morse

`src/lib/morse.ts` no depende de React. Exporta `MORSE`, `normalize`, `encode`, `decode` y `evaluate`. Normaliza NFC, convierte áéíóúü, omite ¿, conserva ñ, rechaza el resto y compara en mayúsculas. La ñ del curso es `--.--`. Entre letras hay un espacio; entre palabras, ` / `. `decode` puede devolver `�` para un patrón desconocido. La precisión es `100 × max(0, 1 − distancia / max(longitud_objetivo, longitud_respuesta, 1))`.

El mismo repertorio y la misma normalización viven en PostgreSQL (`morse_normalize`, `morse_encode`, `morse_decode`, `morse_distance`) para puntuar en el servidor.

## Captura de teclado y tacto

Con el botón de transmisión enfocado, `keydown` de la tecla configurada inicia una señal y `keyup` la clasifica con `performance.now()`. Un `keydown` con `repeat` no duplica. El umbral de raya inicial es 250 ms; la letra se confirma a los 700 ms y la palabra a los 1600 ms, siempre con `wordMs > letterMs`. Un pointer primario hace lo mismo; un segundo contacto se ignora. `pointercancel` y la pérdida de captura descartan la señal no terminada. Perder el foco de la ventana o ocultar la pestaña cancela la señal y, en práctica, pausa el cronómetro local.

## Audio

`src/lib/audio.ts` usa Web Audio API: un oscilador a 620 Hz, volumen 0–1 y reproducción programada según la unidad de punto. El contexto solo se reanuda tras una acción del usuario. Pausar, desmontar o cambiar de pestaña incrementa un contador de generación para que una promesa de `resume` tardía no deje un tono huérfano.

## Persistencia local

`localStorage` guarda `learn-morse-progress` (intentos con id único), `learn-morse-draft` (sesión interrumpida) y `learn-morse-settings`. Datos corruptos se sustituyen por un estado vacío con aviso. `saveAttempt` ignora el mismo `id`. El 85 % en todas las variantes y ambas direcciones marca la lección como superada en este navegador.

## Navegador frente a servidor

El navegador clasifica pulsaciones, dibuja y reproduce audio. No concede XP ni declara ganadores. Con sesión, `submit_practice` y las RPC de duelo envían respuestas ya confirmadas. El reloj competitivo se corrige con `server_now`. Realtime avisa de cambios; un sondeo cada tres segundos recupera el estado canónico si falta un evento. **El transporte Realtime contra un proyecto remoto no está verificado.**

## Supabase Auth, PostgreSQL, RLS y Realtime

Código cliente: `src/online/client.ts` y `src/online/Panels.tsx`. Migración: `supabase/migrations/202609130001_morse.sql`. El seed se genera desde el catálogo TypeScript.

Tablas con RLS. El cliente autenticado solo lee su perfil, intentos y XP, y las salas, miembros y segmentos de salas a las que pertenece. No hay política de lectura sobre `lesson_catalog` ni `room_challenges`. No hay INSERT/UPDATE/DELETE de cliente sobre esas tablas. Las escrituras de XP, práctica y duelos son funciones `security definer` que exigen `auth.uid()`. `award_xp` y `close_duel` no se conceden a `anon` ni `authenticated`. `p_forfeit = NULL` se rechaza.

Estas reglas se ejecutaron con PGlite en `tests/online.test.ts`. Eso no sustituye un proyecto Supabase remoto, Google OAuth ni dos navegadores reales.

## Service worker

En producción, Vite escribe `/sw.js` con un precache de `index.html`, iconos, manifest y los `/assets/*` emitidos. Solo atiende GET del mismo origen. Las navegaciones caen a `index.html` si no hay red. Las peticiones a otro origen (Supabase) se ignoran. Las actualizaciones esperan a `SKIP_WAITING`. No cachea respuestas privadas.

## Publicación prevista

Cloudflare Pages: `npm run build`, directorio `dist`, Node 24, HTTPS. Las variables `VITE_*` son públicas; no debe existir `VITE_` con `service_role`. **No hay despliegue verificado.**
