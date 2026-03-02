-- ========================================
-- COMPLETE MIGRATION: All Database Updates
-- Run this ONCE in your Supabase SQL Editor
-- ========================================

-- 1. Add translation columns to highlights table
ALTER TABLE highlights
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Add translation columns to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false;

-- 3. Add preferred_translation to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_translation TEXT DEFAULT 'web';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_highlights_translation
ON highlights(user_id, book, chapter, translation);

CREATE INDEX IF NOT EXISTS idx_highlights_tags
ON highlights USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_notes_translation
ON notes(user_id, passage_id, translation);

-- 5. Backfill existing records with default values
UPDATE highlights
SET translation = 'web'
WHERE translation IS NULL;

UPDATE highlights
SET show_in_all_translations = false
WHERE show_in_all_translations IS NULL;

UPDATE highlights
SET tags = ARRAY[color]
WHERE tags IS NULL OR tags = '{}';

UPDATE notes
SET translation = 'web'
WHERE translation IS NULL;

UPDATE notes
SET show_in_all_translations = false
WHERE show_in_all_translations IS NULL;

UPDATE profiles
SET preferred_translation = 'web'
WHERE preferred_translation IS NULL;

-- Success!
SELECT
  'Migration completed successfully! You can now use all features.' as status,
  (SELECT COUNT(*) FROM highlights WHERE translation IS NOT NULL) as highlights_updated,
  (SELECT COUNT(*) FROM notes WHERE translation IS NOT NULL) as notes_updated,
  (SELECT COUNT(*) FROM profiles WHERE preferred_translation IS NOT NULL) as profiles_updated;
