# Highlights Tags Feature

## Overview
Highlights now support tags with automatic color-based tagging and custom user tags.

## Features Implemented

### 1. Auto-tagging with Color Names
- When you create a highlight, it automatically gets tagged with the color name
- Example: Green highlight → automatically tagged as `#green`
- Available color tags: `yellow`, `blue`, `green`, `pink`, `red`

### 2. Custom Tags
- Users can add additional custom tags to any highlight
- Click the "+" button on a highlight card in the Notes page
- Enter any custom tag name (e.g., "important", "memorize", "prayer")

### 3. Tag Filtering
- All highlight tags appear in the tag filter section on the Notes page
- Click any tag to filter highlights and notes by that tag
- Tags from both highlights and notes are combined in the filter list

### 4. Tag Display
- Highlight tags are displayed as clickable pills on each highlight card
- Tags are shown alongside the color indicator dot
- Click a tag to instantly filter by that tag

## Database Changes

### Migration File: `migration-highlights-tags.sql`

```sql
-- Add tags column to highlights table
ALTER TABLE highlights
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_highlights_tags
ON highlights USING GIN(tags);

-- Backfill existing highlights with color name as tag
UPDATE highlights
SET tags = ARRAY[color]
WHERE tags IS NULL OR tags = '{}';
```

## Code Changes

### Files Modified:

1. **`src/pages/Bible.tsx`**
   - Added `tags: [color]` when creating new highlights (line 567)
   - Updated all fallback payloads to include tags field

2. **`src/pages/Notes.tsx`**
   - Fetches tags field from highlights table
   - Displays tags on highlight cards
   - Enables "Add Tag" button for highlights
   - Updated `handleAddTag()` to support both notes and highlights
   - Extracts tags from highlights for the tag filter section
   - Tags from highlights default to color name if not set

## Usage

### To Use This Feature:

1. **Run the migration** in Supabase SQL Editor:
   ```bash
   # Copy and paste contents of migration-highlights-tags.sql
   ```

2. **Create a highlight**:
   - Open Bible reader
   - Select text and choose a color
   - Highlight is automatically tagged with the color name

3. **Add custom tags**:
   - Go to Notes page
   - Find your highlight
   - Click the "+" button
   - Enter a custom tag name

4. **Filter by tags**:
   - Use the tag filter buttons at the top of Notes page
   - Click any tag to see only items with that tag
   - Color-based tags and custom tags work the same way

## Benefits

- **Better Organization**: Group related highlights with custom tags
- **Quick Filtering**: Find all highlights by color or custom category
- **Auto-categorization**: Color names provide instant categorization
- **Cross-type Tags**: Filter both notes and highlights by tags
- **Flexible System**: Add as many custom tags as needed

## Example Use Cases

1. **Study by Topic**:
   - Tag all "prayer" highlights with `#prayer`
   - Tag all "promise" highlights with `#promise`
   - Filter by tag to see all verses on that topic

2. **Color + Custom Tags**:
   - Yellow highlight → auto-tagged `#yellow`
   - Add custom tag `#memorize`
   - Now tagged as both `#yellow` and `#memorize`

3. **Study Methods**:
   - Tag highlights with `#question`, `#answer`, `#application`
   - Filter to review specific types of insights

4. **Time-based**:
   - Tag with `#dailyreading`, `#sermon`, `#devotional`
   - Track source or context of highlights
