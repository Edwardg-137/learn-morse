# Registro de cambios

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
