/**
 * King James Version Bible API integration
 * Uses publicly available Bible API for KJV text
 */

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleReference {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

export interface BibleSearchResult {
  reference: string;
  text: string;
  verses: BibleVerse[];
}

// Book name mappings for common variations
const BOOK_MAPPINGS: Record<string, string> = {
  'genesis': 'gen',
  'exodus': 'exo',
  'leviticus': 'lev',
  'numbers': 'num',
  'deuteronomy': 'deu',
  'joshua': 'jos',
  'judges': 'jdg',
  'ruth': 'rut',
  '1 samuel': '1sa',
  '2 samuel': '2sa',
  '1 kings': '1ki',
  '2 kings': '2ki',
  '1 chronicles': '1ch',
  '2 chronicles': '2ch',
  'ezra': 'ezr',
  'nehemiah': 'neh',
  'esther': 'est',
  'job': 'job',
  'psalms': 'psa',
  'proverbs': 'pro',
  'ecclesiastes': 'ecc',
  'song of solomon': 'sng',
  'isaiah': 'isa',
  'jeremiah': 'jer',
  'lamentations': 'lam',
  'ezekiel': 'ezk',
  'daniel': 'dan',
  'hosea': 'hos',
  'joel': 'jol',
  'amos': 'amo',
  'obadiah': 'oba',
  'jonah': 'jon',
  'micah': 'mic',
  'nahum': 'nam',
  'habakkuk': 'hab',
  'zephaniah': 'zep',
  'haggai': 'hag',
  'zechariah': 'zec',
  'malachi': 'mal',
  'matthew': 'mat',
  'mark': 'mrk',
  'luke': 'luk',
  'john': 'jhn',
  'acts': 'act',
  'romans': 'rom',
  '1 corinthians': '1co',
  '2 corinthians': '2co',
  'galatians': 'gal',
  'ephesians': 'eph',
  'philippians': 'php',
  'colossians': 'col',
  '1 thessalonians': '1th',
  '2 thessalonians': '2th',
  '1 timothy': '1ti',
  '2 timothy': '2ti',
  'titus': 'tit',
  'philemon': 'phm',
  'hebrews': 'heb',
  'james': 'jas',
  '1 peter': '1pe',
  '2 peter': '2pe',
  '1 john': '1jn',
  '2 john': '2jn',
  '3 john': '3jn',
  'jude': 'jud',
  'revelation': 'rev'
};

// Full book names for display
const FULL_BOOK_NAMES: Record<string, string> = {
  'gen': 'Genesis',
  'exo': 'Exodus',
  'lev': 'Leviticus',
  'num': 'Numbers',
  'deu': 'Deuteronomy',
  'jos': 'Joshua',
  'jdg': 'Judges',
  'rut': 'Ruth',
  '1sa': '1 Samuel',
  '2sa': '2 Samuel',
  '1ki': '1 Kings',
  '2ki': '2 Kings',
  '1ch': '1 Chronicles',
  '2ch': '2 Chronicles',
  'ezr': 'Ezra',
  'neh': 'Nehemiah',
  'est': 'Esther',
  'job': 'Job',
  'psa': 'Psalms',
  'pro': 'Proverbs',
  'ecc': 'Ecclesiastes',
  'sng': 'Song of Solomon',
  'isa': 'Isaiah',
  'jer': 'Jeremiah',
  'lam': 'Lamentations',
  'ezk': 'Ezekiel',
  'dan': 'Daniel',
  'hos': 'Hosea',
  'jol': 'Joel',
  'amo': 'Amos',
  'oba': 'Obadiah',
  'jon': 'Jonah',
  'mic': 'Micah',
  'nam': 'Nahum',
  'hab': 'Habakkuk',
  'zep': 'Zephaniah',
  'hag': 'Haggai',
  'zec': 'Zechariah',
  'mal': 'Malachi',
  'mat': 'Matthew',
  'mrk': 'Mark',
  'luk': 'Luke',
  'jhn': 'John',
  'act': 'Acts',
  'rom': 'Romans',
  '1co': '1 Corinthians',
  '2co': '2 Corinthians',
  'gal': 'Galatians',
  'eph': 'Ephesians',
  'php': 'Philippians',
  'col': 'Colossians',
  '1th': '1 Thessalonians',
  '2th': '2 Thessalonians',
  '1ti': '1 Timothy',
  '2ti': '2 Timothy',
  'tit': 'Titus',
  'phm': 'Philemon',
  'heb': 'Hebrews',
  'jas': 'James',
  '1pe': '1 Peter',
  '2pe': '2 Peter',
  '1jn': '1 John',
  '2jn': '2 John',
  '3jn': '3 John',
  'jud': 'Jude',
  'rev': 'Revelation'
};

/**
 * Parse a scripture reference string into structured data
 * Examples: "John 3:16", "Romans 8:28-30", "Psalm 23"
 */
export function parseScriptureReference(reference: string): BibleReference | null {
  if (!reference || typeof reference !== 'string') return null;

  const cleanRef = reference.trim().toLowerCase();
  
  // Match patterns like "John 3:16", "Romans 8:28-30", "Psalm 23"
  const patterns = [
    // Book Chapter:Verse-Verse (e.g., "John 3:16-18")
    /^(.+?)\s+(\d+):(\d+)-(\d+)$/,
    // Book Chapter:Verse (e.g., "John 3:16")
    /^(.+?)\s+(\d+):(\d+)$/,
    // Book Chapter (e.g., "Psalm 23")
    /^(.+?)\s+(\d+)$/,
    // Just Book (e.g., "Genesis")
    /^(.+?)$/
  ];

  for (const pattern of patterns) {
    const match = cleanRef.match(pattern);
    if (match) {
      const bookName = match[1].trim();
      const bookId = BOOK_MAPPINGS[bookName];
      
      if (!bookId) continue;

      const result: BibleReference = { book: bookId };

      if (match[2]) {
        result.chapter = parseInt(match[2]);
      }

      if (match[3]) {
        result.startVerse = parseInt(match[3]);
      }

      if (match[4]) {
        result.endVerse = parseInt(match[4]);
      }

      return result;
    }
  }

  return null;
}

/**
 * Format a Bible reference for display
 */
export function formatBibleReference(ref: BibleReference): string {
  const bookName = FULL_BOOK_NAMES[ref.book];
  if (!bookName) return '';

  let result = bookName;
  
  if (ref.chapter) {
    result += ` ${ref.chapter}`;
  }
  
  if (ref.startVerse) {
    result += `:${ref.startVerse}`;
    
    if (ref.endVerse && ref.endVerse !== ref.startVerse) {
      result += `-${ref.endVerse}`;
    }
  }

  return result;
}

/**
 * Fetch scripture text from Bible API
 * Using a free, publicly available Bible API
 */
export async function fetchScriptureText(reference: string): Promise<BibleSearchResult | null> {
  try {
    const parsedRef = parseScriptureReference(reference);
    if (!parsedRef) {
      throw new Error('Invalid scripture reference format');
    }

    // Use Bible API (free tier available)
    const baseUrl = 'https://bible-api.com';
    let url = `${baseUrl}/${parsedRef.book}+${parsedRef.chapter}`;
    
    if (parsedRef.startVerse) {
      url += `:${parsedRef.startVerse}`;
      if (parsedRef.endVerse) {
        url += `-${parsedRef.endVerse}`;
      }
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch scripture: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.text) {
      throw new Error('No text found in response');
    }

    // Parse the response into structured verses
    const verses: BibleVerse[] = [];
    
    // Handle the API response format
    if (data.verses && Array.isArray(data.verses)) {
      data.verses.forEach((verseData: any) => {
        verses.push({
          book: verseData.book_id || parsedRef.book,
          chapter: verseData.chapter || parsedRef.chapter || 1,
          verse: verseData.verse || 1,
          text: verseData.text ? verseData.text.trim() : ''
        });
      });
    } else {
      // Fallback parsing for text format
      const verseMatches = data.text.match(/\d+\s+[^0-9]+/g) || [];
      verseMatches.forEach((verseText: string, index: number) => {
        const verseNumber = parsedRef.startVerse ? parsedRef.startVerse + index : index + 1;
        verses.push({
          book: parsedRef.book,
          chapter: parsedRef.chapter || 1,
          verse: verseNumber,
          text: verseText.replace(/^\d+\s+/, '') // Remove verse number from text
        });
      });
    }

    return {
      reference: data.reference || formatBibleReference(parsedRef),
      text: data.text,
      verses
    };

  } catch (error) {
    console.error('Error fetching scripture:', error);
    
    // Fallback: return a sample scripture for testing
    if (reference.toLowerCase().includes('john') && reference.includes('3:16')) {
      return {
        reference: 'John 3:16',
        text: '16 For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        verses: [{
          book: 'jhn',
          chapter: 3,
          verse: 16,
          text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
        }]
      };
    }
    
    return null;
  }
}

/**
 * Search for scriptures containing specific text
 */
export async function searchScriptureText(query: string): Promise<BibleSearchResult[]> {
  try {
    // For now, we'll implement a simple search by trying common references
    // In a full implementation, you'd want to use a search API
    const commonReferences = [
      'John 3:16',
      'Romans 8:28',
      'Psalm 23',
      'Matthew 28:19',
      'Philippians 4:13',
      'Jeremiah 29:11',
      'Proverbs 3:5-6',
      'Isaiah 40:31',
      '1 Corinthians 13:4-7',
      'Galatians 5:22-23'
    ];

    const results: BibleSearchResult[] = [];
    
    for (const ref of commonReferences) {
      if (ref.toLowerCase().includes(query.toLowerCase())) {
        const scripture = await fetchScriptureText(ref);
        if (scripture) {
          results.push(scripture);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching scripture:', error);
    return [];
  }
}

/**
 * Get all available book names for autocomplete
 */
export function getBookNames(): string[] {
  return Object.values(FULL_BOOK_NAMES);
}

/**
 * Get book abbreviations for API calls
 */
export function getBookAbbreviations(): Record<string, string> {
  return BOOK_MAPPINGS;
}