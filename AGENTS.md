# AGENTS.md — Niko-Niko Calendar

App web tipo "Calendario Niko-Niko": registro diario de ánimo por equipo + reporte semanal, sorteo (ruleta), ranking de puntos y export CSV. Frontend JS vanilla (sin framework) con Vite; backend Express que sirve `dist/` y una API REST; datos en MongoDB Atlas. UI en español.

## Comandos
- `node server.js` — Backend Express (puerto `PORT` o 3001). Exige `MONGODB_URI` en `.env`; aborta con error si falta.
- `npm run dev` — Vite dev server (proxya `/api` → `localhost:3001`). Requiere el backend corriendo aparte.
- `npm run build` — genera `dist/`. **`dist/` está versionado en git**: para que un cambio del frontend llegue a producción hay que rebuildear y commitear `dist/`.
- No hay tests ni lint/typecheck configurados.

## Arquitectura
- `index.html` (raíz) es la plantilla; `src/main.js` es el entry e importa `style.css` y los módulos `calendar.js`, `members.js`, `report.js`, `roulette.js`, `points.js`, `storage.js`, `teams.js`.
- `server.js` monta la API bajo `/api` y sirve `dist/` con fallback SPA. Auth = contraseña del equipo en header `x-team-password` (texto plano, no es seguridad real).
- Mongo: base `nikoniko`, colección `teams`. Cada doc: `{ _id: <teamId>, password, members: [nombres], moods: { <dateStr>: { <member>: <mood> } }, points: { <monthKey>: { <member>: <int> } } }`.

## Gotchas
- **Mes de moods es 0-indexado; mes de points es 1-indexado.** `moods` usa `${year}-${month}-${day}` con `month = getMonth()` (ej. `2026-7-19` = agosto). `points` usa `${year}-${month+1}` (ej. `2026-8`). No mezclar formatos.
- Sesión en localStorage: `current_team`, `team_pw_<team>`, `current_member_<team>`; el team también se propaga en la URL `?team=`.
- `GET /api/teams` no exige auth y devuelve todos los IDs de equipos.
- Los puntos no bajan de 0 (clamp `Math.max(0, ...)` en servidor).
- El front detecta sesión inválida por los mensajes exactos `'Contraseña inválida'` / `'No autorizado'` que devuelven las rutas protegidas (401/404).

## Deploy (cPanel / CloudLinux Passenger)
- Base URI `/nikoniko`; startup file `server.js`; las env vars se definen en "Setup Node.js App" del cPanel (no `.env` en producción).
- `.htaccess` contiene la config Passenger con **dos bloques de usuarios distintos** (`juanverd` y `juanverdugo`) — verificar cuál aplica antes de editarlo.
- Guía completa en `README_DEPLOY.md`: build → subir `dist/`, `server.js`, `package*.json` → `npm install --production` → PM2.
- `.env` (gitignored) contiene una Connection String de Atlas real.