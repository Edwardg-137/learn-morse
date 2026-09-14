# Decisiones del proyecto

## 2026-09-13 — Base técnica y operación

- Contexto: prueba de concepto de código libre con aprendizaje, perfiles y competencias, buscando alojamiento de bajo mantenimiento.
- Problema: cubrir entrada inmediata, audio y datos compartidos con pocas piezas que operar.
- Decisión: React + TypeScript + Vite, CSS propio, APIs nativas del navegador, Supabase administrado y Cloudflare Pages; distribución PWA.
- Justificación: el navegador mide la tecla y el sonido; la interfaz es estática; Auth, PostgreSQL y Realtime cubren identidad y salas sin un servidor propio.
- Consecuencias: la práctica puede ser local; XP verificada y duelos requieren el proyecto configurado. Sigue sin haber instancia remota en este repositorio.

## 2026-09-13 — Feedback animado

- Contexto: se pidieron reacciones discretas, con Mario Party solo como referencia de tono.
- Problema: mostrar error, acierto y progresión sin romper la temporización.
- Decisión: burbujas HTML/CSS propias de unos 150–300 ms, mensaje persistente en la tarjeta de resultado, alternativa estática con movimiento reducido. No se usaron recursos de Mario Party.
- Justificación: feedback inmediato sin robar el foco ni mover el área de escritura.
- Consecuencias: en práctica local existen burbujas de error y acierto; no hay una burbuja específica de racha. XP y subida de nivel se animan en la identidad en línea cuando hay perfil verificado.

## 2026-09-13 — Espacio como tecla predeterminada

- Contexto: una sola tecla debe producir punto y raya desde el primer ejercicio.
- Problema: cualquier otra tecla por defecto chocaría con la escritura en «Morse a español».
- Decisión: Espacio (`' '`) es la tecla inicial obligatoria; el usuario puede pasar a F, J o Enter. En campos de texto las teclas conservan su función normal.
- Justificación: el control de transmisión solo captura cuando está enfocado.
- Consecuencias: hay que enfocar el botón para transmitir; un `keydown` repetido no duplica la señal.

## 2026-09-13 — Validación de XP en PostgreSQL

- Contexto: el cliente no es de confianza para puntuar competencias ni acumular XP de cuenta.
- Problema: reenvíos, ediciones directas y respuestas fuera de orden.
- Decisión: `submit_practice`, `award_xp` y el cierre de duelo corren en transacción SQL. La XP no es actualizable por RLS. Cada concesión tiene clave única (`practice:<attempt>`, `lesson:<id>:<versión>`, `duel:<room>`).
- Justificación: idempotencia y autorización en el mismo sitio que los datos.
- Consecuencias: hace falta un catálogo servidor alineado con `lessons.ts`. PGlite verifica las reglas; un proyecto remoto sigue pendiente.

## 2026-09-13 — No almacenar cada pulsación

- Contexto: los duelos necesitan avances compartidos, no un volcado del teclado.
- Problema: Realtime y el historial crecerían sin beneficio didáctico.
- Decisión: el cliente envía segmentos confirmados (código morse o texto). No se persisten puntos y rayas individuales. Los duelos antiguos pueden recortarse borrando `duel_segments` después de exportar resúmenes.
- Justificación: menos datos, menos mensajes, misma corrección.
- Consecuencias: no hay prueba de que una persona pulsara físicamente la tecla.

## 2026-09-14 — Movimiento reducido

- Contexto: las animaciones no deben ser el único canal de feedback.
- Problema: vértigo, distracción o un lector de pantalla anunciando cada símbolo.
- Decisión: `@media (prefers-reduced-motion: reduce)` anula animaciones y transiciones. Las burbujas de XP en línea también se detienen. El detalle del error permanece en texto.
- Justificación: el resultado y el historial ya explican el intento.
- Consecuencias: con movimiento reducido la interfaz no rebota; la práctica sigue siendo usable, verificado en Playwright a 390×844.

## 2026-09-14 — Servicios administrados, sin instancia en el repo

- Contexto: la propuesta aceptó Supabase y Pages para no operar un servidor.
- Problema: crear cuentas externas sin autorización del titular.
- Decisión: el código y las migraciones se entregan listos; `.env.example` va vacío; no se suben secretos ni se crea el proyecto por el agente.
- Justificación: el titular configura OAuth, Site URL y el despliegue.
- Consecuencias: Competir y Perfil en línea muestran el aviso de servicio no configurado hasta que existan las variables públicas.
