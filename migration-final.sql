-- ========================================
-- FINAL MIGRATION: Add Translation Support
-- (Without journal_entries table)
-- ========================================

-- Add translation columns to highlights table
ALTER TABLE highlights
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false;

-- Add translation columns to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false;

-- Add preferred_translation to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_translation TEXT DEFAULT 'web';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_highlights_translation
ON highlights(user_id, book, chapter, translation);

CREATE INDEX IF NOT EXISTS idx_notes_translation
ON notes(user_id, passage_id, translation);

-- Backfill existing records with default translation
UPDATE highlights SET translation = 'web' WHERE translation IS NULL;
UPDATE highlights SET show_in_all_translations = false WHERE show_in_all_translations IS NULL;

UPDATE notes SET translation = 'web' WHERE translation IS NULL;
UPDATE notes SET show_in_all_translations = false WHERE show_in_all_translations IS NULL;

UPDATE profiles SET preferred_translation = 'web' WHERE preferred_translation IS NULL;

-- Success!
SELECT 'Migration completed successfully!' as status;
