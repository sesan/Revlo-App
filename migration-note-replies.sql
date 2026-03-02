-- Migration: Add note_replies table for threaded thoughts on notes
-- Run this in the Supabase SQL Editor before testing

CREATE TABLE IF NOT EXISTS note_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE note_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own note replies"
  ON note_replies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own note replies"
  ON note_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own note replies"
  ON note_replies FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_note_replies_note_id ON note_replies(note_id);
CREATE INDEX idx_note_replies_created ON note_replies(note_id, created_at);
