# Akari (灯)

A personal, **local-first** Japanese learning app with SRS (spaced repetition).
Vocabulary + kanji + sentences, a kana trainer, native audio, animated kanji
stroke order, and an on-demand **"Explícame"** AI panel for grammar/usage.

> **Core rule:** Akari **never** generates Japanese learning content with an LLM.
> Every word, reading, sentence and kanji reading comes from validated open
> datasets. A subtly wrong reading, drilled by the SRS, gets burned in
> permanently — so correctness beats convenience, always. The only LLM touch
> point is the clearly-labelled "Explícame" panel, which can never edit a card.

## Stack
- **Next.js 15** (App Router, TypeScript) + **Tailwind CSS v4**
- **better-sqlite3** — local SQLite, no accounts, no login
- **ts-fsrs** — the FSRS scheduler (no hand-rolled SRS)
- **@anthropic-ai/sdk** — only for the "Explícame" panel
- **framer-motion** — entrance + micro-animations

## Data sources (each under its own license — see `/attributions`)
| Dataset | Used for | License |
|---|---|---|
| [JMdict](https://github.com/scriptin/jmdict-simplified) | readings, English glosses | EDRDG / CC BY-SA |
| [KANJIDIC2](https://github.com/scriptin/jmdict-simplified) | kanji readings, JLPT, strokes | CC BY-SA |
| [KanjiVG](https://github.com/KanjiVG/kanjivg) | stroke-order SVGs | CC BY-SA 3.0 |
| [Tatoeba](https://tatoeba.org/) | example sentences + native audio | CC BY 2.0 FR |
| [Kaishi 1.5k](https://github.com/donkuri/kaishi) | curated 1.5k word order + bundled audio | see attributions |

## Quick start
```bash
npm install
npm run seed   # downloads + parses datasets into data/app.db (cached after first run)
npm run dev    # http://localhost:3000
```

## Data pipeline (`npm run seed`)
1. **download** — fetch raw datasets into `data/raw/` (cached; reruns are fast).
2. **parse** — JMdict / KANJIDIC2 / KanjiVG / Kaishi `.apkg` / Tatoeba into memory.
3. **build-db** — apply `db/schema.sql`, then enrich each Kaishi word: gloss from
   the JMdict entry matched by **exact (expression + reading)** pair (falls back to
   Kaishi's own gloss, logged), link kanji + sentences + audio.
4. **seed-cards** — create one `card_state` row per learnable item via
   `ts-fsrs` `createEmptyCard()`.

Run `npm run stats` to print seeded-database counts.

## Architecture
- `db/schema.sql` — single source of truth for the schema.
- `lib/db.ts` — server-only SQLite handle.
- `lib/fsrs.ts` — thin wrapper over `ts-fsrs` (grade → next state + log).
- `scripts/` — the ingestion pipeline (run with `tsx`).
- `app/` — App Router pages: dashboard, review, kana, kanji detail, stats,
  settings, attributions; `app/api/explain` is the only LLM endpoint.

## License
Source code: MIT (see `LICENSE`). Datasets: each under its own terms (`/attributions`).
