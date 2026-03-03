-- 202603020002_translation_and_highlight_metadata.sql
-- Adds translation support, cross-translation visibility, highlight metadata, and tags

ALTER TABLE highlights
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS book TEXT,
ADD COLUMN IF NOT EXISTS chapter TEXT,
ADD COLUMN IF NOT EXISTS verse TEXT;

ALTER TABLE notes
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS book TEXT,
ADD COLUMN IF NOT EXISTS chapter TEXT,
ADD COLUMN IF NOT EXISTS verse TEXT;

ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_translation TEXT DEFAULT 'web';

CREATE INDEX IF NOT EXISTS idx_highlights_translation
ON highlights(user_id, book, chapter, translation);

CREATE INDEX IF NOT EXISTS idx_highlights_user_passage_translation
ON highlights(user_id, passage_id, translation);

CREATE INDEX IF NOT EXISTS idx_highlights_tags
ON highlights USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_notes_translation
ON notes(user_id, passage_id, translation);

CREATE INDEX IF NOT EXISTS idx_notes_user_passage_translation
ON notes(user_id, passage_id, translation);

CREATE INDEX IF NOT EXISTS idx_journal_user_passage_translation
ON journal_entries(user_id, passage_id, translation);

UPDATE highlights SET translation = 'web' WHERE translation IS NULL;
UPDATE highlights SET show_in_all_translations = false WHERE show_in_all_translations IS NULL;
UPDATE highlights SET tags = ARRAY[color] WHERE tags IS NULL OR tags = '{}';

UPDATE notes SET translation = 'web' WHERE translation IS NULL;
UPDATE notes SET show_in_all_translations = false WHERE show_in_all_translations IS NULL;

UPDATE journal_entries SET translation = 'web' WHERE translation IS NULL;
UPDATE profiles SET preferred_translation = 'web' WHERE preferred_translation IS NULL;
