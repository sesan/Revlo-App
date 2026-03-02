/**
 * Bible Translation Configuration
 * Defines supported translations with metadata and API source routing
 */

export interface Translation {
  code: string;           // Short code: 'kjv', 'web', 'niv', 'esv', 'nasb'
  name: string;           // Full name: 'King James Version'
  apiSource: 'bible-api' | 'helloao';
  copyright: string;      // License/attribution information
  category: 'public' | 'modern' | 'literal';
}

export const TRANSLATIONS: Translation[] = [
  {
    code: 'web',
    name: 'World English Bible',
    apiSource: 'bible-api',
    copyright: 'Public Domain',
    category: 'public'
  },
  {
    code: 'kjv',
    name: 'King James Version',
    apiSource: 'bible-api',
    copyright: 'Public Domain',
    category: 'public'
  },
  {
    code: 'niv',
    name: 'New International Version',
    apiSource: 'helloao',
    copyright: '© Biblica, Inc.',
    category: 'modern'
  },
  {
    code: 'esv',
    name: 'English Standard Version',
    apiSource: 'helloao',
    copyright: '© Crossway',
    category: 'literal'
  },
  {
    code: 'nasb',
    name: 'New American Standard Bible',
    apiSource: 'helloao',
    copyright: '© The Lockman Foundation',
    category: 'literal'
  }
];

export function getTranslation(code: string): Translation | undefined {
  return TRANSLATIONS.find(t => t.code === code);
}

export function getDefaultTranslation(): Translation {
  return TRANSLATIONS[0]; // WEB as default
}
