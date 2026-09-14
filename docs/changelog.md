# Registro de cambios

## 2026-09-14 — Taladro infinito y licencia MIT-0

- Se añadió la lección intermedia «Señales sueltas»: letras y números individuales al azar, sin fin. No cuenta para el porcentaje del curso ni concede XP de servidor.
- Se publicó `LICENSE` (MIT-0): uso libre; se pide, sin exigir, mención a https://github.com/Edwardg-137.
- Pruebas: `tests/infinite.test.ts` y `e2e/practice.spec.ts`. Documentos: `status/general.md`, `status/structure.md`, `status/architecture.md`, `status/decisions.md`, `implementations/2026-09-nivel-infinito-y-licencia.md`.
- Impacto: hay un taladro que no se agota tras números. El catálogo SQL sigue con 81 ejercicios.

## 2026-09-14 — Captura Morse sin clic previo

- La tecla asignada transmite en cuanto el control está en pantalla, sin tener que hacer clic en el botón. Los campos de texto no se interceptan.
- Pruebas: `tests/capture.test.ts` y `e2e/practice.spec.ts`. Documentos: `status/architecture.md`, `status/decisions.md`, `implementations/2026-09-captura-sin-clic.md`.
- Impacto: se puede usar Espacio, F, J o Enter de inmediato en práctica y en la guía.

## 2026-09-14 — Recorrido guiado de la tecla, paso a paso

- La guía solo se abre desde «Cómo funciona la tecla». La vista se expande desde el botón (sin animación si hay movimiento reducido).
- Los cinco conceptos se recorren uno a uno: al completar cada paso se elige repetir o seguir. No se puede saltar.
- Pruebas: `tests/guide.test.ts` y `e2e/guide.spec.ts`. Documentos: `status/general.md`, `status/architecture.md`, `status/decisions.md`, `implementations/2026-09-guia-recorrido-pasos.md`.
- Impacto: el ritmo de la tecla se enseña en orden. No cambian umbrales, lecciones ni Supabase.

## 2026-09-14 — Guía interactiva de la tecla en Aprender

- Se añadió una tarjeta plegable bajo el hero que explica, con la tecla real, punto, raya, misma letra, otra letra y espacio entre palabras.
- Cerrada por defecto; se abre desde «Cómo funciona la tecla» o desde la propia tarjeta y se cierra en cualquier momento. Al cerrarla se desmonta la captura de Espacio.
- Pruebas: `tests/guide.test.ts` y `e2e/guide.spec.ts`. Documentos: `status/general.md`, `status/structure.md`, `status/architecture.md`, `implementations/2026-09-guia-interactiva.md`.
- Impacto: se puede entender el ritmo de la app sin empezar una lección. No cambia el motor, el catálogo ni las reglas de Supabase.

## 2026-09-14 — Agente especializado de UI/UX

- Se añadió el agente de workspace `Learn Morse UI/UX` para UI/UX, responsive, accesibilidad, animaciones y evaluación de librerías estéticas.
- El agente incorpora las invariantes de `MorseKey`, PWA, práctica offline, Supabase opcional, movimiento reducido y pruebas Playwright.
- Documentos actualizados: `implementations/2026-09-agente-ui-ux.md`, `status/structure.md` y `status/decisions.md`.
- Impacto: nueva capacidad de trabajo para futuras mejoras visuales; no cambia el runtime ni añade dependencias.

## 2026-09-14 — Verificación de la aplicación existente y sincronización documental

- Se contrastó el código con la propuesta: React + Vite, motor, catálogo de 16 lecciones y 81 ejercicios, captura Espacio/táctil, Web Audio, progreso local, paneles de Supabase, PWA y pruebas.
- Se ejecutaron `npm ci`, `npm test` (8/8, incluido PGlite), `npm run build`, `npx tsc -b`, `npm run test:e2e` (17/17) y `npm run test:pwa` (1/1).
- Se añadieron pruebas de navegador para separación de letras/palabras, pérdida de foco, pestaña oculta, `pointercancel`, cambio de tecla, pausa, burbuja de error, acierto y perfil en móvil.
- Se recorrió la UI en Chromium de escritorio y en viewport 390×844, con `prefers-reduced-motion` y aviso de sin conexión. No se verificó Google OAuth, Realtime remoto, duelos a dos navegadores ni XP/nivel en línea.
- Documentos actualizados: `status/general.md`, `status/structure.md`, `status/architecture.md`, `status/decisions.md`, `implementations/2026-09-plan-de-ejecucion.md`, `implementations/2026-09-verificacion-y-sincronizacion.md`, `supabase/README.md` y este registro.
- Impacto: el estado deja de describir el repo como «solo propuesta». Sigue sin haber proyecto Supabase remoto, despliegue de Pages ni archivo LICENSE.

## 2026-09-13 — Implementación de la aplicación (código ya presente al retomar)

- Motor en `src/lib/morse.ts`, catálogo en `src/content/lessons.ts`, UI en `src/App.tsx` y componentes de práctica, backend en `supabase/`, PWA con `/sw.js` e iconos propios, pruebas Node/PGlite/Playwright y README.
- No se creó una instancia remota ni se eligió licencia en esa entrega. El changelog de aquella fecha solo cubría la propuesta; esta entrada registra el código que ya existía.

## 2026-09-13 — Propuesta principal y estado documental inicial

- Se redactó la propuesta funcional y técnica del juego, incluyendo transmisión con una tecla, progresión hasta párrafos largos, perfiles, XP, duelos, animaciones y accesibilidad.
- Se documentaron fases, criterios de aceptación, riesgos y supuestos iniciales revisables.
- Documentos creados: `implementations/2026-09-propuesta-principal.md`, `status/general.md`, `status/structure.md`, `status/architecture.md`, `status/decisions.md` y este registro.
- Impacto: documentación de planificación. `general_instructions.md` se conserva sin cambios.
