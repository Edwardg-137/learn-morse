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

## 2026-09-14 — Recorrido guiado desde el botón del hero

- Contexto: la guía de la tecla vivía en una tarjeta `<details>` visible y mostraba los cinco puntos a la vez.
- Problema: se podía abrir sin el botón del hero y completar un concepto posterior sin haber practicado los anteriores. La apertura no salía del botón.
- Decisión: un `dialog` que solo abre el botón «Cómo funciona la tecla», con expansión FLIP desde su rectángulo. `stepOutcome` valida el paso actual; al completar aparecen «Repetir este paso» y «Siguiente».
- Justificación: el origen visual es el botón; el aprendizaje es secuencial, con la misma tecla que las lecciones.
- Consecuencias: Aprender ya no muestra una tarjeta colapsada. Escape, «Cerrar guía» y cambiar de página cierran el diálogo. Con movimiento reducido no hay expansión.

## 2026-09-14 — Tutorial plegable en la página principal

- Contexto: el hero dice que basta una tecla, pero no muestra qué cuenta como la misma letra, otra letra o un espacio entre palabras.
- Problema: quien llega a la práctica puede confundir una pausa corta con un espacio, o pulsar Espacio fuera de la lección.
- Decisión: una tarjeta `<details>` en Aprender, cerrada por defecto, con el `MorseKey` real solo mientras está abierta. Cinco pasos se marcan según el código transmitido. Un botón del hero abre la tarjeta.
- Justificación: la misma captura y los mismos umbrales que en práctica; no hay un simulador paralelo. Al cerrar se deja de interceptar Espacio.
- Consecuencias: Aprender gana un bloque extra. Navegar o empezar una lección cierra la guía.

## 2026-09-14 — Agente de UI/UX del workspace

- Contexto: la interfaz tiene identidad visual propia y una interacción Morse sensible, pero no contaba con una guía especializada reutilizable.
- Problema: una mejora estética puede romper captura, foco, audio, responsive, PWA o movimiento reducido si se trata como un rediseño aislado.
- Decisión: crear `.github/agents/learn-morse-ui-ux.agent.md` con herramientas de lectura, búsqueda, edición y ejecución, y con límites explícitos sobre `MorseKey`, accesibilidad, dependencias y validación.
- Justificación: concentra el conocimiento visual y las invariantes del producto sin añadir código de ejecución ni dependencias al bundle.
- Consecuencias: las futuras tareas de interfaz pueden delegarse a un agente consistente; sus cambios seguirán requiriendo pruebas y sincronización documental.
