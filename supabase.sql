-- Supabase Database Schema for Verse App

-- Table: profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  onboarding_answers JSONB,
  current_plan TEXT,
  current_day INTEGER DEFAULT 1
);

-- Table: passages
CREATE TABLE passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT DEFAULT 'KJV'
);

-- Table: highlights
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  passage_id UUID REFERENCES passages(id) ON DELETE CASCADE,
  word_start INTEGER NOT NULL,
  word_end INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  passage_id UUID REFERENCES passages(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT CHECK (type IN ('note', 'highlight', 'journal', 'voice', 'bookmark')),
  framework TEXT CHECK (framework IN ('HEAR', 'SOAP', 'free', null)),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: journal_entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  passage_id UUID REFERENCES passages(id) ON DELETE CASCADE,
  framework TEXT CHECK (framework IN ('HEAR', 'SOAP', 'free')),
  field_1 TEXT,
  field_2 TEXT,
  field_3 TEXT,
  field_4 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Passages are viewable by everyone" ON passages FOR SELECT USING (true);

CREATE POLICY "Users can view own highlights" ON highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own highlights" ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own highlights" ON highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own highlights" ON highlights FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Seed Data for Passages
INSERT INTO passages (id, book, chapter, verse, text) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John', 1, 1, 'In the beginning was the Word, and the Word was with God, and the Word was God.'),
  ('11111111-1111-1111-1111-111111111112', 'John', 1, 2, 'The same was in the beginning with God.'),
  ('11111111-1111-1111-1111-111111111113', 'John', 1, 3, 'All things were made by him; and without him was not any thing made that was made.'),
  ('11111111-1111-1111-1111-111111111114', 'John', 1, 4, 'In him was life; and the life was the light of men.'),
  ('11111111-1111-1111-1111-111111111115', 'John', 1, 5, 'And the light shineth in darkness; and the darkness comprehended it not.'),
  ('11111111-1111-1111-1111-111111111116', 'John', 1, 14, 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.'),
  ('11111111-1111-1111-1111-111111111117', 'John', 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'),
  ('11111111-1111-1111-1111-111111111118', 'Psalm', 23, 1, 'The Lord is my shepherd; I shall not want.'),
  ('11111111-1111-1111-1111-111111111119', 'Psalm', 23, 2, 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.'),
  ('11111111-1111-1111-1111-11111111111a', 'Psalm', 23, 3, 'He restoreth my soul: he leadeth me in the paths of righteousness for his name''s sake.'),
  ('11111111-1111-1111-1111-11111111111b', 'Psalm', 23, 4, 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.'),
  ('11111111-1111-1111-1111-11111111111c', 'Matthew', 6, 9, 'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.'),
  ('11111111-1111-1111-1111-11111111111d', 'Matthew', 6, 10, 'Thy kingdom come. Thy will be done in earth, as it is in heaven.'),
  ('11111111-1111-1111-1111-11111111111e', 'Matthew', 6, 11, 'Give us this day our daily bread.'),
  ('11111111-1111-1111-1111-11111111111f', 'Matthew', 6, 12, 'And forgive us our debts, as we forgive our debtors.'),
  ('11111111-1111-1111-1111-111111111120', 'Matthew', 6, 13, 'And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.'),
  ('11111111-1111-1111-1111-111111111121', 'Romans', 8, 1, 'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.'),
  ('11111111-1111-1111-1111-111111111122', '1 Corinthians', 13, 4, 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,'),
  ('11111111-1111-1111-1111-111111111123', '1 Corinthians', 13, 5, 'Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;'),
  ('11111111-1111-1111-1111-111111111124', '1 Corinthians', 13, 6, 'Rejoiceth not in iniquity, but rejoiceth in the truth;'),
  ('11111111-1111-1111-1111-111111111125', '1 Corinthians', 13, 7, 'Beareth all things, believeth all things, hopeth all things, endureth all things.'),
  ('11111111-1111-1111-1111-111111111126', 'Isaiah', 41, 10, 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.'),
  ('11111111-1111-1111-1111-111111111127', 'Jeremiah', 29, 11, 'For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.'),
  ('11111111-1111-1111-1111-111111111128', 'Philippians', 4, 6, 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.'),
  ('11111111-1111-1111-1111-111111111129', 'Philippians', 4, 7, 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.'),
  ('11111111-1111-1111-1111-11111111112a', 'Psalm', 46, 1, 'God is our refuge and strength, a very present help in trouble.'),
  ('11111111-1111-1111-1111-11111111112b', 'Psalm', 46, 10, 'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- MIGRATION: Add Translation Support
-- Date: 2026-03-02
-- ========================================

-- Add preferred_translation to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_translation TEXT DEFAULT 'web';

-- Add translation and cross-translation display settings to highlights
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web';
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false;

-- Add translation and cross-translation display settings to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS show_in_all_translations BOOLEAN DEFAULT false;

-- Add translation field to journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS translation TEXT DEFAULT 'web';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_highlights_user_passage_translation
ON highlights(user_id, passage_id, translation);

CREATE INDEX IF NOT EXISTS idx_notes_user_passage_translation
ON notes(user_id, passage_id, translation);

CREATE INDEX IF NOT EXISTS idx_journal_user_passage_translation
ON journal_entries(user_id, passage_id, translation);

-- Backfill existing records with default translation
UPDATE highlights SET translation = 'web' WHERE translation IS NULL;
UPDATE notes SET translation = 'web' WHERE translation IS NULL;
UPDATE journal_entries SET translation = 'web' WHERE translation IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN highlights.translation IS 'Bible translation code (kjv, web, niv, esv, nasb)';
COMMENT ON COLUMN highlights.show_in_all_translations IS 'If true, highlight appears across all translations';
COMMENT ON COLUMN notes.translation IS 'Bible translation code where note was created';
COMMENT ON COLUMN notes.show_in_all_translations IS 'If true, note appears across all translations';
COMMENT ON COLUMN journal_entries.translation IS 'Bible translation code used for journal entry';
COMMENT ON COLUMN profiles.preferred_translation IS 'User preferred Bible translation';
