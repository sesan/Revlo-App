# Supabase SQL Layout

This repository now uses a migration-first layout.

## Folders
- `migrations/`: canonical schema/data-structure changes (run in order)
- `scripts/`: one-off/manual utility scripts (optional)
- `archive/`: old/duplicate SQL files kept for reference

## Canonical migration order
1. `202603020001_initial_schema.sql`
2. `202603020002_translation_and_highlight_metadata.sql`
3. `202603020003_note_replies.sql`

## Optional scripts
- `scripts/seed_passages_dev.sql`: dev seed passages
- `scripts/fix_broken_profiles.sql`: cleanup invalid profile rows

## Notes
- Do not run files in `archive/` on new environments.
- Keep new schema changes as new files in `migrations/` only.
