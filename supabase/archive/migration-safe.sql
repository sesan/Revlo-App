-- ========================================
-- SAFE MIGRATION: Only Add Missing Columns
-- This won't break existing columns
-- ========================================

-- Check what exists first, only add if missing
DO $$
BEGIN
  -- Add translation to highlights if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'highlights' AND column_name = 'translation'
  ) THEN
    ALTER TABLE highlights ADD COLUMN translation TEXT DEFAULT 'web';
  END IF;

  -- Add show_in_all_translations to highlights if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'highlights' AND column_name = 'show_in_all_translations'
  ) THEN
    ALTER TABLE highlights ADD COLUMN show_in_all_translations BOOLEAN DEFAULT false;
  END IF;

  -- Add tags to highlights if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'highlights' AND column_name = 'tags'
  ) THEN
    ALTER TABLE highlights ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  -- Add translation to notes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'translation'
  ) THEN
    ALTER TABLE notes ADD COLUMN translation TEXT DEFAULT 'web';
  END IF;

  -- Add show_in_all_translations to notes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'show_in_all_translations'
  ) THEN
    ALTER TABLE notes ADD COLUMN show_in_all_translations BOOLEAN DEFAULT false;
  END IF;

END $$;

-- Create indexes (these won't error if they already exist due to IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_highlights_translation
ON highlights(user_id, book, chapter, translation);

CREATE INDEX IF NOT EXISTS idx_highlights_tags
ON highlights USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_notes_translation
ON notes(user_id, passage_id, translation);

-- Backfill only records that need it
UPDATE highlights SET translation = 'web' WHERE translation IS NULL;
UPDATE highlights SET show_in_all_translations = false WHERE show_in_all_translations IS NULL;
UPDATE highlights SET tags = ARRAY[color] WHERE tags IS NULL OR tags = '{}';
UPDATE notes SET translation = 'web' WHERE translation IS NULL;
UPDATE notes SET show_in_all_translations = false WHERE show_in_all_translations IS NULL;

SELECT 'Safe migration completed!' as status;
