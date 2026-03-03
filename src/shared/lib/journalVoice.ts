export type JournalFramework = 'HEAR' | 'SOAP' | 'Free Write';

export interface JournalFields {
  f1: string;
  f2: string;
  f3: string;
  f4: string;
}

const FRAMEWORK_MARKERS: Record<Exclude<JournalFramework, 'Free Write'>, Array<{ field: keyof JournalFields; keywords: string[] }>> = {
  HEAR: [
    { field: 'f1', keywords: ['highlight'] },
    { field: 'f2', keywords: ['explain', 'explanation'] },
    { field: 'f3', keywords: ['apply', 'application'] },
    { field: 'f4', keywords: ['respond', 'response', 'prayer'] }
  ],
  SOAP: [
    { field: 'f1', keywords: ['scripture'] },
    { field: 'f2', keywords: ['observation', 'observe'] },
    { field: 'f3', keywords: ['application', 'apply'] },
    { field: 'f4', keywords: ['prayer', 'pray'] }
  ]
};

const FIELD_ORDER: Array<keyof JournalFields> = ['f1', 'f2', 'f3', 'f4'];

function cleanTranscript(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function appendText(existing: string, added: string): string {
  const next = cleanTranscript(added);
  if (!next) return existing;
  if (!existing.trim()) return next;
  return `${existing.trim()} ${next}`;
}

function splitIntoSentences(text: string): string[] {
  const sentenceSplit = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentenceSplit.length > 0) {
    return sentenceSplit;
  }

  return text
    .split(/[;,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function distributeSentences(sentences: string[], framework: Exclude<JournalFramework, 'Free Write'>) {
  const distributed: JournalFields = { f1: '', f2: '', f3: '', f4: '' };
  const sections = FRAMEWORK_MARKERS[framework];
  const groups = [[], [], [], []] as string[][];

  if (sentences.length === 1) {
    groups[0].push(sentences[0]);
  } else {
    sentences.forEach((sentence, index) => {
      const target = Math.min(Math.floor((index * 4) / sentences.length), 3);
      groups[target].push(sentence);
    });
  }

  sections.forEach((section, index) => {
    distributed[section.field] = groups[index].join(' ').trim();
  });

  return distributed;
}

function mapMarkerToField(framework: Exclude<JournalFramework, 'Free Write'>) {
  const lookup = new Map<string, keyof JournalFields>();
  FRAMEWORK_MARKERS[framework].forEach((section) => {
    section.keywords.forEach((keyword) => {
      lookup.set(keyword.toLowerCase(), section.field);
    });
  });
  return lookup;
}

function extractByMarkers(text: string, framework: Exclude<JournalFramework, 'Free Write'>): Partial<JournalFields> | null {
  const keywordMap = mapMarkerToField(framework);
  const keywords = Array.from(keywordMap.keys());
  if (keywords.length === 0) return null;

  const markerPattern = keywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const markerRegex = new RegExp(`\\b(${markerPattern})\\b\\s*[:\\-]`, 'gi');
  const markers: Array<{ field: keyof JournalFields; contentStart: number; markerStart: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = markerRegex.exec(text)) !== null) {
    const matchedKeyword = match[1].toLowerCase();
    const field = keywordMap.get(matchedKeyword);
    if (!field) continue;
    markers.push({
      field,
      contentStart: markerRegex.lastIndex,
      markerStart: match.index
    });
  }

  if (markers.length === 0) return null;

  const extracted: Partial<JournalFields> = {};

  markers.forEach((marker, index) => {
    const nextStart = markers[index + 1]?.markerStart ?? text.length;
    const content = text.slice(marker.contentStart, nextStart).trim();
    if (!content) return;
    const existing = extracted[marker.field] ?? '';
    extracted[marker.field] = appendText(existing, content);
  });

  return extracted;
}

export function applyTranscriptToJournalFields(
  framework: JournalFramework,
  transcript: string,
  previous: JournalFields
): JournalFields {
  const cleaned = cleanTranscript(transcript);
  if (!cleaned) return previous;

  if (framework === 'Free Write') {
    return {
      ...previous,
      f1: appendText(previous.f1, cleaned)
    };
  }

  const markerResult = extractByMarkers(cleaned, framework);
  if (markerResult && Object.keys(markerResult).length > 0) {
    const next = { ...previous };
    FIELD_ORDER.forEach((field) => {
      const incoming = markerResult[field];
      if (incoming) {
        next[field] = appendText(previous[field], incoming);
      }
    });
    return next;
  }

  const sentences = splitIntoSentences(cleaned);
  if (sentences.length === 0) return previous;

  const distributed = distributeSentences(sentences, framework);
  const next = { ...previous };
  FIELD_ORDER.forEach((field) => {
    if (distributed[field]) {
      next[field] = appendText(previous[field], distributed[field]);
    }
  });
  return next;
}

export function appendTranscriptToField(existing: string, transcript: string): string {
  return appendText(existing, transcript);
}
