# Desplegar Akari (Cloudflare Pages)

Akari es una PWA estática y offline: todo corre en el navegador (SQLite vía
WASM), sin servidor. El build genera la carpeta `out/` (≈113 MB, ~4.7k
archivos), que se sirve como sitio estático.

## Opción B — conectar el repo (auto-deploy en cada push)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create** → **Pages** → **Connect to Git** → elige el repo `akari`.
2. Configura el build:
   - **Framework preset:** `None`
   - **Build command:** `npm run seed && npm run build:static`
   - **Build output directory:** `out`
   - **Root directory:** `/` (por defecto)
3. **Environment variables** → añade `NODE_VERSION` = `22` (también lo cubre el
   archivo `.node-version`).
4. **Save and Deploy.**

La primera build tarda unos minutos: descarga los datasets (JMdict, KANJIDIC2,
KanjiVG, Tatoeba, Kaishi), reconstruye la base de datos + el audio nativo, y
pre-genera las 849 páginas. Cada `git push` a `main` vuelve a desplegar.

Cuando termine, tendrás una URL tipo `https://akari.pages.dev`.

## Instalar en el móvil

Abre la URL en el navegador del móvil → menú → **"Añadir a pantalla de inicio"**
(Android/Chrome) o **Compartir → Añadir a pantalla de inicio** (iOS/Safari). Se
instala como app independiente y funciona offline tras la primera carga.

## Notas

- **Tu progreso** (repasos, racha, ajustes) vive en el IndexedDB de tu
  dispositivo, no en lo desplegado. Redesplegar **no** lo borra; el
  `akari.db.gz` desplegado es solo la semilla inicial.
- **Explícame (IA):** pega tu propia clave de Anthropic en **Ajustes →
  Explícame · IA** dentro de la app desplegada. Se guarda solo en tu dispositivo
  y llama a la API directamente desde el navegador.
- **Build local equivalente:** `npm run seed && npm run build:static`, luego
  `npm run serve:static` para previsualizar `out/` en `localhost:3000`.
