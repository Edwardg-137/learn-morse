# Estructura actual

Actualizado: 2026-09-14. Solo se enumeran carpetas y archivos existentes relevantes.

| Ruta | Propósito |
| --- | --- |
| `docs/general_instructions.md` | Protocolo de trabajo. Está en `.gitignore` porque es una instrucción interna. |
| `docs/implementations/` | Propuesta, plan y notas de continuación. También ignorada por git. |
| `docs/status/` | Estado funcional, estructura, arquitectura y decisiones reales. |
| `docs/changelog.md` | Historial resumido. |
| `src/` | Aplicación React: interfaz, motor, contenido, audio, progreso y cliente en línea. |
| `src/lib/` | Motor de morse, audio Web Audio y persistencia local, sin React. |
| `src/content/lessons.ts` | Catálogo versionado de lecciones y ejercicios. |
| `src/components/` | `Practice.tsx` (sesión de práctica) y `MorseKey.tsx` (captura Espacio/táctil). |
| `src/online/` | Paneles de cuenta y duelo, cliente de Supabase y estilos asociados. |
| `src/App.tsx` | Navegación entre Aprender, Practicar, Competir y Perfil. |
| `src/service-worker.js` | Plantilla del service worker; Vite emite `/sw.js` con la lista de estáticos. |
| `src/styles.css` | Identidad visual, adaptativo y `prefers-reduced-motion`. |
| `tests/` | Pruebas de Node: motor, progreso y PostgreSQL real mediante PGlite. |
| `e2e/` | Playwright: captura, práctica, navegación y PWA. |
| `public/` | Manifest, icono SVG y PNG 192/512. |
| `scripts/generate-icons.mjs` | Rasteriza el SVG propio a PNG. |
| `supabase/` | Migración, seed, `config.toml`, generador del catálogo SQL y README del backend. |
| `index.html`, `package.json`, `vite.config.ts`, `playwright*.ts`, `tsconfig.json` | Arranque, compilación y pruebas. |
| `.env.example` | Nombres públicos `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, vacíos. |
| `README.md` | Cómo ejecutar, comprobar y preparar la publicación. |

No hay `LICENSE`. `node_modules/`, `dist/`, `.env.local`, informes de Playwright y esta carpeta de implementations no forman parte de la arquitectura publicada.
