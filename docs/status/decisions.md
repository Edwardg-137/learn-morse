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
- Justificación: Espacio no interfiere con «Morse a español» porque esa dirección no monta el control de transmisión; F, J y Enter son alternativas. En campos de texto la tecla no se captura.
- Consecuencias: con el control en pantalla, la tecla transmite sin hacer clic en el botón. Un `keydown` repetido no duplica la señal.

## 2026-09-14 — Captura Morse sin clic previo

- Contexto: la tecla solo se escuchaba en el botón de transmisión.
- Problema: un botón HTML no recibe teclado sin foco, así que había que tocarlo con el cursor antes de poder transmitir.
- Decisión: escuchar Espacio/F/J/Enter en `window` mientras `MorseKey` está montado y no desactivado. Omitir campos de escritura.
- Justificación: el control visible es la condición de uso, no el foco del botón.
- Consecuencias: se puede transmitir con otra cosa enfocada (pista, comprobar). Perder el foco de la ventana sigue cancelando.

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

## 2026-09-14 — Taladro infinito de señales sueltas

- Contexto: tras letras y números no había una práctica intermedia que no se agotara.
- Problema: una lista finita se memoriza; un taladro suelto necesita letras y cifras mezcladas, una a una.
- Decisión: lección `senales-sueltas` en Ampliación, `infinite: true`, ejercicios vacíos. `randomSignal` elige A–Z, Ñ o 0–9 y evita repetir el símbolo anterior. El porcentaje del curso solo cuenta las 16 lecciones finitas. No hay filas en `lesson_catalog` ni XP de servidor.
- Justificación: el motor y los umbrales no cambian; solo cambia cómo se elige el objetivo.
- Consecuencias: «Siguiente señal» alarga la cola guardada en el borrador. Completar el resto del curso sigue pudiendo llegar al 100 %.

## 2026-09-14 — Licencia MIT-0 con atribución opcional

- Contexto: el repositorio no tenía licencia y se pidió libertad total de uso.
- Problema: MIT clásico exige conservar el aviso de copyright; Unlicense no pide créditos.
- Decisión: MIT-0 en `LICENSE` y `package.json`. Se solicita, sin obligar, mención a https://github.com/Edwardg-137.
- Justificación: cualquier uso, copia o reventa queda permitido; el crédito es cortesía.
- Consecuencias: GitHub detecta el archivo `LICENSE`. No hay obligación legal de atribuir.
