/**
 * Bible API Abstraction Layer
 * Handles fetching Bible passages from multiple API sources
 */

import { getTranslation } from './translations';

export interface Verse {
  verse: number;
  text: string;
}

export interface Passage {
  id: string;
  book: string;
  chapter: string;
  verses: Verse[];
}

/**
 * Main function to fetch a Bible passage
 * Currently uses bible-api.com for all translations
 *
 * Supported translations: KJV, WEB, YLT, Clementine, Almeida
 *
 * Note: Additional translations (NIV, ESV, NASB) require API keys
 * and licensing. They can be added in the future with proper authentication.
 */
export async function fetchPassage(
  book: string,
  chapter: string,
  translation: string
): Promise<Passage> {
  const translationConfig = getTranslation(translation);

  if (!translationConfig) {
    throw new Error(`Unknown translation: ${translation}`);
  }

  // Currently all translations use bible-api.com
  return fetchFromBibleApi(book, chapter, translation);
}

/**
 * Fetch from bible-api.com
 * Supports: KJV, WEB
 */
async function fetchFromBibleApi(
  book: string,
  chapter: string,
  translation: string
): Promise<Passage> {
  const response = await fetch(
    `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${translation}`
  );

  if (!response.ok) {
    throw new Error(`Bible API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.verses || data.verses.length === 0) {
    throw new Error('No verses found');
  }

  // Transform to standard format
  return {
    id: `${data.verses[0]?.book_id}-${chapter}`,
    book: data.verses[0]?.book_name || book,
    chapter: chapter,
    verses: data.verses.map((v: any) => ({
      verse: v.verse,
      text: v.text
    }))
  };
}

// Note: Additional API sources can be added here in the future
// For example, to support copyrighted translations like NIV, ESV, NASB,
// you would need to:
// 1. Register for API keys from services like API.Bible or ESV API
// 2. Add authentication headers to requests
// 3. Route translations to appropriate API sources based on availability
