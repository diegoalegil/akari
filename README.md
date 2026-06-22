# Akari (灯)

A personal, **local-first** Japanese learning app with SRS (spaced repetition).
Vocabulary + kanji + sentences, a kana trainer, native audio, animated kanji
stroke order, and an on-demand **"Explícame"** AI panel for grammar/usage.

> **Core rule:** Akari **never** generates Japanese with an LLM at runtime.
> Every word, **reading**, example sentence and kanji reading comes from
> validated open datasets — a subtly wrong reading, drilled by the SRS, gets
> burned in permanently. The Spanish **meanings** are translated EN→ES once at
> build time (cached in `db/translations.es.json`, reviewable; the Japanese and
> readings are never touched). The only *runtime* LLM is the clearly-labelled
> "Explícame" grammar panel, which streams on demand and can never edit a card.

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
| [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) | JLPT level per word | MIT |

## Quick start
```bash
npm install
npm run seed   # downloads + parses datasets into data/app.db (cached after first run)
npm run dev    # http://localhost:3000
npm test       # FSRS scheduler tests
```

The **Explícame** panel is optional and uses your own key. To enable it, add to
`.env.local` (the only place an LLM is called at runtime, per click):

```
ANTHROPIC_API_KEY=sk-ant-...
# EXPLAIN_MODEL=claude-sonnet-4-6   # optional override
```

## Features
- **Dashboard** — today's queue, lantern streak, recent kanji, live stats.
- **Repaso (SRS)** — full-screen flip session, native audio, example sentences,
  Again/Hard/Good/Easy via `ts-fsrs`; keyboard `space` / `1–4` / `J`.
- **Kana** — hiragana/katakana gojūon grid + recognition & recall drills.
- **Kanji** — browse + detail with animated **KanjiVG stroke order**, on/kun,
  JLPT/grade/frequency, and words using each kanji.
- **Progreso** — retention, streak, year heatmap, JLPT mastery, 14-day forecast.
- **Ajustes** — new-cards/day, card animation, theme, audio/motion, export, reset.
- **Buscar (⌘K)** — search vocabulary + kanji.
- **Explícame** — on-demand AI grammar/usage panel (labeled, read-only).

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
