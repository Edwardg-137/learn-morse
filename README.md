# Learn Morse

Juego web para aprender código morse en español, desde puntos y rayas hasta párrafos largos. **Espacio** es la tecla predeterminada: pulsa para un punto, mantén para una raya y deja pausas para separar letras y palabras. En móvil se usa el mismo control táctil.

## Ejecutar localmente

Requisitos: Node.js 24 y npm.

```sh
npm ci
npm run dev
```

Abrir la dirección que muestra Vite, normalmente `http://127.0.0.1:5173`. No se necesitan claves para las lecciones, el audio ni la práctica local.

Si en Windows aparece un error tipo `EPERM` o `operation not permitted` al ejecutar `npm ci`, normalmente es porque un proceso de Node/npm sigue bloqueando archivos dentro de `node_modules` o un antivirus/editor está usando uno de esos binarios. La solución fiable es:

```powershell
Get-Process node, npm -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force node_modules
npm ci
npm run dev
```

Si el bloqueo persiste, cierra el antivirus o cualquier editor con la carpeta abierta y repite la instalación. Tras limpiar el estado, la app compila y arranca correctamente con Vite en Node 24.

La app incluye 16 lecciones y 81 ejercicios originales, en ambas direcciones. En Aprender, el botón «Cómo funciona la tecla» abre un recorrido de cinco pasos con el mismo control: un concepto cada vez, con opción de repetir o seguir. Ofrece calibración, pistas, presentación visual/auditiva, feedback animado con movimiento reducido y progreso guardado en el navegador. Los textos largos de 182 y 495 palabras se practican completos o por oración.

Para transmitir, enfoca el botón de Espacio. La captura no intercepta los campos de texto. Los umbrales iniciales son 250 ms para raya, 700 ms para confirmar letra y 1600 ms para palabra; se ajustan dentro de la práctica. El sonido requiere una interacción y puede depender de la política del navegador.

## Cuentas y duelos

El código de perfiles, Google OAuth, XP verificada y duelos usa Supabase. **No hay un proyecto remoto ni credenciales incluidos.** Sigue [la configuración del backend](supabase/README.md), aplica migración y catálogo, copia los nombres de `.env.example` a `.env.local` y reinicia Vite.

Las políticas de acceso y las operaciones de puntuación se ejecutan en PostgreSQL. Los resultados locales no se convierten automáticamente en XP verificada. Sin conexión, las competencias no funcionan y las lecciones siguen disponibles si fueron cacheadas por la PWA.

## Compilar y comprobar

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run test:pwa
```

- `npm test`: motor, catálogo, progreso y reglas reales de PostgreSQL mediante PGlite en memoria. Las identidades de prueba sustituyen el JWT de Supabase, no sus políticas ni RPC.
- `test:e2e`: flujos de navegador, teclado, tacto, reanudación y vistas adaptables.
- `test:pwa`: necesita una compilación previa; verifica iconos y práctica sin conexión en producción.
- `npm run icons`: vuelve a rasterizar el icono SVG propio si cambia; necesita Chromium de Playwright.

No se afirma validación de Google OAuth o transporte Realtime contra una instancia remota. Antes de publicar debe completarse un duelo con dos cuentas reales, además de comprobar audio/tacto en dispositivos físicos.

## Publicar la web

En Cloudflare Pages: comando de compilación `npm run build`, directorio de salida `dist`, Node.js 24 y HTTPS. Servir `/manifest.webmanifest`, `/icon-192.png`, `/icon-512.png` y `/sw.js`. Variables públicas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` solo si se activa el backend. Registrar el dominio final entre las redirecciones OAuth. Las competencias deben avisar que necesitan red. No incluir secretos ni `service_role` con prefijo `VITE_`. No conectar una cuenta externa sin autorización expresa.

La interfaz es estática; no requiere un servidor Node en producción. La compilación genera el service worker y su lista de archivos públicos cacheables. No cachea llamadas de Supabase ni respuestas privadas. Las actualizaciones se ofrecen al usuario; conviene terminar o guardar la práctica antes de actualizar. Borrar datos del navegador elimina progreso local y caché.

Los planes gratuitos tienen cuotas, pueden cambiar y no garantizan disponibilidad. Supabase Free puede pausarse por inactividad; revisar consumo, respaldos y recuperación antes de una publicación pública. [Precios oficiales](https://supabase.com/pricing).

## Contribuir y documentación

Consulta [el estado real](docs/status/general.md), [la arquitectura](docs/status/architecture.md) y [el historial](docs/changelog.md). El catálogo está en `src/content/lessons.ts`; después de cambiarlo ejecuta `node supabase/generate-seed.ts` y `npm test`. Un catálogo ya publicado necesita una migración/versionado explícito, como explica el backend.

La ñ usa `--.--` como extensión del curso. Se ignoran mayúsculas, tildes vocálicas y el signo de apertura ¿; se preserva ñ y se rechazan caracteres no soportados. El proyecto está pensado para distribuirse como código libre; el titular todavía debe elegir la licencia del código y los contenidos antes de la publicación. No existe archivo `LICENSE`. Los textos del curso y los iconos se escribieron para esta app. No se han utilizado imágenes ni textos de Mario Party: únicamente es una referencia del tono del feedback.
