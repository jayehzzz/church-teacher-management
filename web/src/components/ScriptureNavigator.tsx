"use client";

import React, { useState } from 'react';
import { scriptureService, type ScriptureItem } from '@/services/scripture';

interface ScriptureNavigatorProps {
  onScriptureSelect: (scripture: ScriptureItem) => void;
  onReferenceSelect: (reference: string) => void;
  onAutoSend?: () => void;
}

// Bible books with their abbreviations and chapter counts
const BIBLE_BOOKS = [
  { name: 'Genesis', abbr: 'Gen', chapters: 50 },
  { name: 'Exodus', abbr: 'Exo', chapters: 40 },
  { name: 'Leviticus', abbr: 'Lev', chapters: 27 },
  { name: 'Numbers', abbr: 'Num', chapters: 36 },
  { name: 'Deuteronomy', abbr: 'Deu', chapters: 34 },
  { name: 'Joshua', abbr: 'Jos', chapters: 24 },
  { name: 'Judges', abbr: 'Jdg', chapters: 21 },
  { name: 'Ruth', abbr: 'Rut', chapters: 4 },
  { name: '1 Samuel', abbr: '1Sa', chapters: 31 },
  { name: '2 Samuel', abbr: '2Sa', chapters: 24 },
  { name: '1 Kings', abbr: '1Ki', chapters: 22 },
  { name: '2 Kings', abbr: '2Ki', chapters: 25 },
  { name: '1 Chronicles', abbr: '1Ch', chapters: 29 },
  { name: '2 Chronicles', abbr: '2Ch', chapters: 36 },
  { name: 'Ezra', abbr: 'Ezr', chapters: 10 },
  { name: 'Nehemiah', abbr: 'Neh', chapters: 13 },
  { name: 'Esther', abbr: 'Est', chapters: 10 },
  { name: 'Job', abbr: 'Job', chapters: 42 },
  { name: 'Psalms', abbr: 'Psa', chapters: 150 },
  { name: 'Proverbs', abbr: 'Pro', chapters: 31 },
  { name: 'Ecclesiastes', abbr: 'Ecc', chapters: 12 },
  { name: 'Song of Solomon', abbr: 'Sng', chapters: 8 },
  { name: 'Isaiah', abbr: 'Isa', chapters: 66 },
  { name: 'Jeremiah', abbr: 'Jer', chapters: 52 },
  { name: 'Lamentations', abbr: 'Lam', chapters: 5 },
  { name: 'Ezekiel', abbr: 'Ezk', chapters: 48 },
  { name: 'Daniel', abbr: 'Dan', chapters: 12 },
  { name: 'Hosea', abbr: 'Hos', chapters: 14 },
  { name: 'Joel', abbr: 'Jol', chapters: 3 },
  { name: 'Amos', abbr: 'Amo', chapters: 9 },
  { name: 'Obadiah', abbr: 'Oba', chapters: 1 },
  { name: 'Jonah', abbr: 'Jon', chapters: 4 },
  { name: 'Micah', abbr: 'Mic', chapters: 7 },
  { name: 'Nahum', abbr: 'Nam', chapters: 3 },
  { name: 'Habakkuk', abbr: 'Hab', chapters: 3 },
  { name: 'Zephaniah', abbr: 'Zep', chapters: 3 },
  { name: 'Haggai', abbr: 'Hag', chapters: 2 },
  { name: 'Zechariah', abbr: 'Zec', chapters: 14 },
  { name: 'Malachi', abbr: 'Mal', chapters: 4 },
  { name: 'Matthew', abbr: 'Mat', chapters: 28 },
  { name: 'Mark', abbr: 'Mrk', chapters: 16 },
  { name: 'Luke', abbr: 'Luk', chapters: 24 },
  { name: 'John', abbr: 'Jhn', chapters: 21 },
  { name: 'Acts', abbr: 'Act', chapters: 28 },
  { name: 'Romans', abbr: 'Rom', chapters: 16 },
  { name: '1 Corinthians', abbr: '1Co', chapters: 16 },
  { name: '2 Corinthians', abbr: '2Co', chapters: 13 },
  { name: 'Galatians', abbr: 'Gal', chapters: 6 },
  { name: 'Ephesians', abbr: 'Eph', chapters: 6 },
  { name: 'Philippians', abbr: 'Php', chapters: 4 },
  { name: 'Colossians', abbr: 'Col', chapters: 4 },
  { name: '1 Thessalonians', abbr: '1Th', chapters: 5 },
  { name: '2 Thessalonians', abbr: '2Th', chapters: 3 },
  { name: '1 Timothy', abbr: '1Ti', chapters: 6 },
  { name: '2 Timothy', abbr: '2Ti', chapters: 4 },
  { name: 'Titus', abbr: 'Tit', chapters: 3 },
  { name: 'Philemon', abbr: 'Phm', chapters: 1 },
  { name: 'Hebrews', abbr: 'Heb', chapters: 13 },
  { name: 'James', abbr: 'Jas', chapters: 5 },
  { name: '1 Peter', abbr: '1Pe', chapters: 5 },
  { name: '2 Peter', abbr: '2Pe', chapters: 3 },
  { name: '1 John', abbr: '1Jn', chapters: 5 },
  { name: '2 John', abbr: '2Jn', chapters: 1 },
  { name: '3 John', abbr: '3Jn', chapters: 1 },
  { name: 'Jude', abbr: 'Jud', chapters: 1 },
  { name: 'Revelation', abbr: 'Rev', chapters: 22 }
];

export function ScriptureNavigator({ onScriptureSelect, onReferenceSelect, onAutoSend }: ScriptureNavigatorProps) {
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter books based on search query
  const filteredBooks = BIBLE_BOOKS.filter(book => 
    book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.abbr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get chapters for selected book
  const selectedBookData = BIBLE_BOOKS.find(book => book.name === selectedBook);
  const maxChapters = selectedBookData?.chapters || 1;

  // Generate verse numbers (assuming max 50 verses per chapter for simplicity)
  const verseNumbers = Array.from({ length: 50 }, (_, i) => i + 1);

  const handleBookSelect = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setSelectedVerse(1);
    setSearchQuery('');
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setSelectedVerse(1);
  };

  const handleVerseSelect = (verse: number) => {
    setSelectedVerse(verse);
  };

  const handleLoadScripture = async () => {
    if (!selectedBook) return;
    
    setIsLoading(true);
    try {
      const reference = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
      const scripture = await scriptureService.getScripture(reference);
      if (scripture) {
        onScriptureSelect(scripture);
        onReferenceSelect(reference);
        // Automatically send to output after loading
        if (onAutoSend) {
          onAutoSend();
        }
      }
    } catch (error) {
      console.error('Error loading scripture:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReference = async (reference: string) => {
    onReferenceSelect(reference);
    // Try to load the scripture and auto-send
    try {
      const scripture = await scriptureService.getScripture(reference);
      if (scripture) {
        onScriptureSelect(scripture);
        // Automatically send to output
        if (onAutoSend) {
          onAutoSend();
        }
      }
    } catch (error) {
      console.error('Error loading quick reference:', error);
    }
  };

  // Popular references for quick access
  const popularReferences = [
    'John 3:16', 'Romans 8:28', 'Psalm 23', 'Matthew 28:19',
    'Philippians 4:13', 'Jeremiah 29:11', 'Proverbs 3:5-6',
    'Isaiah 40:31', '1 Corinthians 13:4-7', 'Galatians 5:22-23',
    'Ephesians 2:8-9', 'Romans 10:9-10', 'John 14:6', 'Matthew 6:33',
    'Psalm 46:10', 'Isaiah 53:5', 'Romans 12:2', 'Galatians 2:20',
    'Hebrews 11:1', 'James 1:2-4'
  ];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Search Books</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type to search books..."
          className="w-full rounded-lg p-3 bg-gray-800 border border-gray-600 text-white"
        />
      </div>

      {/* Book Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Book</label>
        <div className="max-h-32 overflow-y-auto border border-gray-600 rounded-lg bg-gray-800">
          {filteredBooks.map((book) => (
            <button
              key={book.name}
              onClick={() => handleBookSelect(book.name)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors ${
                selectedBook === book.name ? 'bg-blue-600 text-white' : 'text-gray-300'
              }`}
            >
              <div className="font-medium">{book.name}</div>
              <div className="text-xs opacity-70">{book.abbr} • {book.chapters} chapters</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chapter Selection */}
      {selectedBook && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Chapter</label>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: maxChapters }, (_, i) => i + 1).map((chapter) => (
              <button
                key={chapter}
                onClick={() => handleChapterSelect(chapter)}
                className={`px-2 py-1 text-sm rounded ${
                  selectedChapter === chapter 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {chapter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verse Selection */}
      {selectedBook && selectedChapter && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Verse</label>
          <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
            {verseNumbers.map((verse) => (
              <button
                key={verse}
                onClick={() => handleVerseSelect(verse)}
                className={`px-2 py-1 text-sm rounded ${
                  selectedVerse === verse 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {verse}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Load Scripture Button */}
      {selectedBook && (
        <button
          onClick={handleLoadScripture}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Loading...' : `Load ${selectedBook} ${selectedChapter}:${selectedVerse}`}
        </button>
      )}

      {/* Popular References */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Popular References</label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {popularReferences.map((reference) => (
            <button
              key={reference}
              onClick={() => handleQuickReference(reference)}
              className="px-3 py-2 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-left"
            >
              {reference}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}