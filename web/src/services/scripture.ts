/**
 * Scripture service for managing Bible text and references
 */

import { 
  fetchScriptureText, 
  searchScriptureText, 
  parseScriptureReference,
  formatBibleReference,
  type BibleSearchResult,
  type BibleReference 
} from '@/lib/scripture/kjv-api';
import { 
  fetchTPTScriptureText, 
  searchTPTScriptureText, 
  parseTPTReference,
  formatTPTReference,
  type TPTSearchResult,
  type TPTReference 
} from '@/lib/scripture/tpt-api';

export type Translation = 'KJV' | 'TPT';

export interface ScriptureItem {
  id: string;
  reference: string;
  text: string;
  verses: Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  translation: Translation;
  createdAt: Date;
  lastUsed?: Date;
}

export interface ScriptureSearchOptions {
  query?: string;
  book?: string;
  chapter?: number;
  verse?: number;
  translation?: Translation;
}

class ScriptureService {
  private cache = new Map<string, ScriptureItem>();
  private recentSearches: string[] = [];
  private defaultTranslation: Translation = 'KJV';

  /**
   * Fetch scripture text by reference
   */
  async getScripture(reference: string, translation: Translation = this.defaultTranslation): Promise<ScriptureItem | null> {
    try {
      // Check cache first (include translation in cache key)
      const cacheKey = `${reference.toLowerCase()}_${translation}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        cached.lastUsed = new Date();
        return cached;
      }

      // Fetch from appropriate API based on translation
      let result: BibleSearchResult | TPTSearchResult | null = null;
      
      if (translation === 'TPT') {
        result = await fetchTPTScriptureText(reference);
      } else {
        result = await fetchScriptureText(reference);
      }
      
      if (!result) return null;

      const scriptureItem: ScriptureItem = {
        id: this.generateId(),
        reference: result.reference,
        text: result.text,
        verses: result.verses,
        translation,
        createdAt: new Date(),
        lastUsed: new Date()
      };

      // Cache the result
      this.cache.set(cacheKey, scriptureItem);
      
      // Add to recent searches
      this.addToRecentSearches(reference);

      return scriptureItem;
    } catch (error) {
      console.error('Error getting scripture:', error);
      return null;
    }
  }

  /**
   * Search for scriptures
   */
  async searchScriptures(query: string, translation: Translation = this.defaultTranslation): Promise<ScriptureItem[]> {
    try {
      let results: BibleSearchResult[] | TPTSearchResult[] = [];
      
      if (translation === 'TPT') {
        results = await searchTPTScriptureText(query);
      } else {
        results = await searchScriptureText(query);
      }
      
      const scriptureItems: ScriptureItem[] = results.map(result => ({
        id: this.generateId(),
        reference: result.reference,
        text: result.text,
        verses: result.verses,
        translation,
        createdAt: new Date(),
        lastUsed: new Date()
      }));

      // Cache results
      scriptureItems.forEach(item => {
        const cacheKey = `${item.reference.toLowerCase()}_${item.translation}`;
        this.cache.set(cacheKey, item);
      });

      return scriptureItems;
    } catch (error) {
      console.error('Error searching scriptures:', error);
      return [];
    }
  }

  /**
   * Validate scripture reference format
   */
  validateReference(reference: string): { valid: boolean; error?: string } {
    if (!reference || typeof reference !== 'string') {
      return { valid: false, error: 'Reference is required' };
    }

    const parsed = parseScriptureReference(reference);
    if (!parsed) {
      return { valid: false, error: 'Invalid reference format. Use format like "John 3:16" or "Romans 8:28-30"' };
    }

    return { valid: true };
  }

  /**
   * Get formatted reference
   */
  formatReference(reference: string): string {
    const parsed = parseScriptureReference(reference);
    return parsed ? formatBibleReference(parsed) : reference;
  }

  /**
   * Get recent searches
   */
  getRecentSearches(): string[] {
    return [...this.recentSearches];
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    this.recentSearches = [];
  }

  /**
   * Get cached scriptures
   */
  getCachedScriptures(): ScriptureItem[] {
    return Array.from(this.cache.values()).sort((a, b) => 
      (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0)
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get popular scripture references
   */
  getPopularReferences(): string[] {
    return [
      'John 3:16',
      'Romans 8:28',
      'Psalm 23',
      'Matthew 28:19',
      'Philippians 4:13',
      'Jeremiah 29:11',
      'Proverbs 3:5-6',
      'Isaiah 40:31',
      '1 Corinthians 13:4-7',
      'Galatians 5:22-23',
      'Ephesians 2:8-9',
      'Romans 10:9-10',
      'John 14:6',
      'Matthew 6:33',
      'Psalm 46:10',
      'Isaiah 53:5',
      'Romans 12:2',
      'Galatians 2:20',
      'Hebrews 11:1',
      'James 1:2-4'
    ];
  }

  /**
   * Set default translation
   */
  setDefaultTranslation(translation: Translation): void {
    this.defaultTranslation = translation;
  }

  /**
   * Get default translation
   */
  getDefaultTranslation(): Translation {
    return this.defaultTranslation;
  }

  /**
   * Get available translations
   */
  getAvailableTranslations(): Translation[] {
    return ['KJV', 'TPT'];
  }

  /**
   * Get scripture categories for organization
   */
  getScriptureCategories(): Record<string, string[]> {
    return {
      'Salvation': [
        'John 3:16',
        'Romans 10:9-10',
        'Ephesians 2:8-9',
        'Acts 16:31'
      ],
      'Faith': [
        'Hebrews 11:1',
        'Romans 1:17',
        'Galatians 2:20',
        'James 1:2-4'
      ],
      'Love': [
        '1 Corinthians 13:4-7',
        'John 15:13',
        'Romans 5:8',
        '1 John 4:19'
      ],
      'Hope': [
        'Jeremiah 29:11',
        'Romans 8:28',
        'Isaiah 40:31',
        'Psalm 23'
      ],
      'Peace': [
        'Philippians 4:7',
        'John 14:27',
        'Isaiah 26:3',
        'Romans 5:1'
      ],
      'Strength': [
        'Philippians 4:13',
        'Isaiah 40:31',
        '2 Corinthians 12:9',
        'Psalm 46:1'
      ]
    };
  }

  private generateId(): string {
    return `scripture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToRecentSearches(reference: string): void {
    // Remove if already exists
    const index = this.recentSearches.indexOf(reference);
    if (index > -1) {
      this.recentSearches.splice(index, 1);
    }

    // Add to beginning
    this.recentSearches.unshift(reference);

    // Keep only last 20 searches
    if (this.recentSearches.length > 20) {
      this.recentSearches = this.recentSearches.slice(0, 20);
    }
  }
}

// Export singleton instance
export const scriptureService = new ScriptureService();