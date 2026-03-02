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
 * Routes to appropriate API based on translation configuration
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

  if (translationConfig.apiSource === 'bible-api') {
    return fetchFromBibleApi(book, chapter, translation);
  } else {
    return fetchFromHelloAO(book, chapter, translation);
  }
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

/**
 * Fetch from HelloAO Bible API
 * Supports: NIV, ESV, NASB, and many others
 */
async function fetchFromHelloAO(
  book: string,
  chapter: string,
  translation: string
): Promise<Passage> {
  // Map book names to HelloAO book IDs
  const bookId = getHelloAOBookId(book);

  const response = await fetch(
    `https://bible.helloao.org/api/${translation}/${bookId}/${chapter}.json`
  );

  if (!response.ok) {
    throw new Error(`HelloAO API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.verses || data.verses.length === 0) {
    throw new Error('No verses found');
  }

  // Transform HelloAO response to match standard format
  return {
    id: `${bookId}-${chapter}`,
    book: book,
    chapter: chapter,
    verses: data.verses.map((v: any) => ({
      verse: v.verse || v.number,
      text: v.text
    }))
  };
}

/**
 * Map common book names to HelloAO book IDs
 * HelloAO uses standardized 3-letter codes
 */
function getHelloAOBookId(book: string): string {
  const mapping: Record<string, string> = {
    // Old Testament
    'Genesis': 'gen',
    'Exodus': 'exo',
    'Leviticus': 'lev',
    'Numbers': 'num',
    'Deuteronomy': 'deu',
    'Joshua': 'jos',
    'Judges': 'jdg',
    'Ruth': 'rut',
    '1 Samuel': '1sa',
    '2 Samuel': '2sa',
    '1 Kings': '1ki',
    '2 Kings': '2ki',
    '1 Chronicles': '1ch',
    '2 Chronicles': '2ch',
    'Ezra': 'ezr',
    'Nehemiah': 'neh',
    'Esther': 'est',
    'Job': 'job',
    'Psalms': 'psa',
    'Proverbs': 'pro',
    'Ecclesiastes': 'ecc',
    'Song of Solomon': 'sng',
    'Isaiah': 'isa',
    'Jeremiah': 'jer',
    'Lamentations': 'lam',
    'Ezekiel': 'ezk',
    'Daniel': 'dan',
    'Hosea': 'hos',
    'Joel': 'jol',
    'Amos': 'amo',
    'Obadiah': 'oba',
    'Jonah': 'jon',
    'Micah': 'mic',
    'Nahum': 'nam',
    'Habakkuk': 'hab',
    'Zephaniah': 'zep',
    'Haggai': 'hag',
    'Zechariah': 'zec',
    'Malachi': 'mal',
    // New Testament
    'Matthew': 'mat',
    'Mark': 'mrk',
    'Luke': 'luk',
    'John': 'jhn',
    'Acts': 'act',
    'Romans': 'rom',
    '1 Corinthians': '1co',
    '2 Corinthians': '2co',
    'Galatians': 'gal',
    'Ephesians': 'eph',
    'Philippians': 'php',
    'Colossians': 'col',
    '1 Thessalonians': '1th',
    '2 Thessalonians': '2th',
    '1 Timothy': '1ti',
    '2 Timothy': '2ti',
    'Titus': 'tit',
    'Philemon': 'phm',
    'Hebrews': 'heb',
    'James': 'jas',
    '1 Peter': '1pe',
    '2 Peter': '2pe',
    '1 John': '1jn',
    '2 John': '2jn',
    '3 John': '3jn',
    'Jude': 'jud',
    'Revelation': 'rev'
  };

  return mapping[book] || book.toLowerCase().slice(0, 3);
}
