# Estado general

Actualizado: 2026-09-14.

Learn Morse es una aplicación web para aprender código morse en español. Combina un curso gradual, práctica en ambas direcciones con una sola tecla, perfil local, PWA y un backend preparado en Supabase para cuentas, XP verificada y duelos por invitación.

## Qué funciona en local, sin claves

La interfaz React se ejecuta con Vite. Hay dieciséis lecciones y ochenta y un ejercicios originales, en siete etapas, hasta dos textos de 182 y 495 palabras. En Aprender, el botón «Cómo funciona la tecla» abre un recorrido de cinco pasos (punto, raya, misma letra, otra letra, espacio entre palabras). Cada paso se prueba con la tecla real; no se puede saltar. Tras completarlo se elige repetir o seguir. Al cerrar, deja de capturar Espacio. Espacio es la tecla predeterminada: pulsación corta para punto, sostenida para raya. En móvil el mismo control es táctil. El navegador genera el audio con Web Audio API. El progreso, los borradores y los ajustes se guardan en este navegador. La PWA cachea solo recursos públicos de la propia origen.

Las lecciones, el motor, la captura, el audio, el perfil local y la práctica sin conexión no necesitan Supabase.

## Qué requiere variables de Supabase

Cuentas Google, XP verificada, perfiles en línea y duelos usan `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Sin esas variables la app sigue siendo usable y explica que las funciones en línea no están disponibles. No hay usuarios simulados.

El progreso local y la XP verificada son independientes. Completar ejercicios sin sesión no concede XP de servidor. Al iniciar sesión, los intentos locales no se convierten automáticamente en XP verificada.

## Qué falta de verificación remota

No hay un proyecto Supabase público en este repositorio ni credenciales incluidas. Google OAuth, Realtime como transporte, dos navegadores reales y el despliegue en Cloudflare Pages no están verificados contra servicios externos. Las reglas SQL sí están comprobadas en memoria con PGlite.

La licencia del código sigue sin elegir. No se ha publicado una instancia.

## Escritorio, móvil y PWA

La interfaz se adapta a escritorio y a viewports de teléfono. La navegación, los formularios y el control de transmisión permanecen utilizables en 390×844. El manifest, los iconos PNG propios y `/sw.js` permiten instalar y recargar la práctica de producción sin red, después de una primera carga. Las competencias informan que necesitan conexión.

## Cómo ejecutar

Requisitos: Node.js 24 y npm. Instrucciones en el [README](../../README.md). Backend: [supabase/README.md](../../supabase/README.md). Arquitectura: [architecture.md](architecture.md).

Referencia funcional original: [propuesta principal](../implementations/2026-09-propuesta-principal.md). Plan: [plan de ejecución](../implementations/2026-09-plan-de-ejecucion.md).
