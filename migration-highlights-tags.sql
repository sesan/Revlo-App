-- ========================================
-- Add Tags Support to Highlights
-- ========================================

-- Add tags column to highlights table
ALTER TABLE highlights
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for better performance on tag searches
CREATE INDEX IF NOT EXISTS idx_highlights_tags
ON highlights USING GIN(tags);

-- Backfill existing highlights with color name as tag
UPDATE highlights
SET tags = ARRAY[color]
WHERE tags IS NULL OR tags = '{}';

-- Success!
SELECT 'Highlights tags migration completed successfully!' as status;
