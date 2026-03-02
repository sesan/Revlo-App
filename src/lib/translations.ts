/**
 * Bible Translation Configuration
 * Defines supported translations with metadata and API source routing
 *
 * Currently supported translations (via bible-api.com):
 * - WEB (World English Bible) - Modern English
 * - KJV (King James Version) - Traditional English
 * - YLT (Young's Literal Translation) - Word-for-word literal
 * - Almeida (João Ferreira de Almeida) - Portuguese
 *
 * Note: Copyrighted translations like NIV, ESV, NASB require API keys
 * and licensing agreements. They can be added in the future with proper
 * authentication via services like API.Bible or ESV API.
 */

export interface Translation {
  code: string;           // Short code: 'kjv', 'web', 'ylt', 'almeida'
  name: string;           // Full name: 'King James Version'
  apiSource: 'bible-api'; // Currently only bible-api.com is supported
  copyright: string;      // License/attribution information
  category: 'public' | 'modern' | 'literal';
}

export const TRANSLATIONS: Translation[] = [
  {
    code: 'web',
    name: 'World English Bible',
    apiSource: 'bible-api',
    copyright: 'Public Domain',
    category: 'modern'
  },
  {
    code: 'kjv',
    name: 'King James Version',
    apiSource: 'bible-api',
    copyright: 'Public Domain',
    category: 'public'
  },
  {
    code: 'ylt',
    name: "Young's Literal Translation",
    apiSource: 'bible-api',
    copyright: 'Public Domain',
    category: 'literal'
  },
  {
    code: 'almeida',
    name: 'João Ferreira de Almeida (Portuguese)',
    apiSource: 'bible-api',
    copyright: 'Public Domain',
    category: 'public'
  }
];

export function getTranslation(code: string): Translation | undefined {
  return TRANSLATIONS.find(t => t.code === code);
}

export function getDefaultTranslation(): Translation {
  return TRANSLATIONS[0]; // WEB as default
}
