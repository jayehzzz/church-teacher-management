"use client";

import React, { useState } from 'react';
import { ScriptureInput } from '@/components/ScriptureInput';
import { ScriptureNavigator } from '@/components/ScriptureNavigator';
import { ScripturePreview } from '@/components/ScripturePreview';
import { scriptureService, type ScriptureItem } from '@/services/scripture';
import { scriptureTemplates } from '@/components/ScriptureDisplay';
import type { PresentingContent } from '@/lib/presenting/types';

type DrawerTab = 'text' | 'scripture' | 'media' | 'audio';

interface PresentingLayoutProps {
  onContentSend: (content: PresentingContent) => void;
  onStatusUpdate: (status: string) => void;
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

export function PresentingLayout({ onContentSend, onStatusUpdate }: PresentingLayoutProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('scripture');
  
  // Left Pane - Bible Versions
  const [selectedVersion, setSelectedVersion] = useState('KJV');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScriptureItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Center Pane - Scripture Selection
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [chapterText, setChapterText] = useState<string>('');
  
  // Right Pane - Preview & Formatting
  const [scriptureTemplate, setScriptureTemplate] = useState<keyof typeof scriptureTemplates>("classic");
  const [scriptureSettings, setScriptureSettings] = useState({
    showVerseNumbers: true,
    showReference: true,
    showVersion: false,
    versesOnIndividualLines: false,
    splitLongVerses: false,
    fontSize: 80,
    textAlign: 'center' as 'left' | 'center' | 'right',
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    versionLabel: 'KJV'
  });

  const bibleVersions = [
    { name: 'King James Version', abbr: 'KJV', description: 'Traditional, formal English' },
    { name: 'New Living Translation', abbr: 'NLT', description: 'Modern, easy to read' },
    { name: 'New American Standard Bible', abbr: 'NASB', description: 'Word-for-word accuracy' },
    { name: 'English Standard Version', abbr: 'ESV', description: 'Literal translation' },
    { name: 'New International Version', abbr: 'NIV', description: 'Balanced approach' }
  ];

  const handleBookSelect = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setSelectedVerses([]);
    setChapterText('');
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setSelectedVerses([]);
    // In a real implementation, this would fetch the chapter text
    setChapterText(`Chapter ${chapter} text would be loaded here...`);
  };

  const handleVerseSelect = (verse: number) => {
    setSelectedVerses(prev => 
      prev.includes(verse) 
        ? prev.filter(v => v !== verse)
        : [...prev, verse].sort((a, b) => a - b)
    );
  };

  const applyTemplate = (template: keyof typeof scriptureTemplates) => {
    setScriptureTemplate(template);
    setScriptureSettings(prev => ({
      ...prev,
      ...scriptureTemplates[template]
    }));
  };

  const convertToShow = () => {
    if (!selectedBook || selectedVerses.length === 0) {
      onStatusUpdate("Please select a book, chapter, and verses");
      return;
    }

    const reference = `${selectedBook} ${selectedChapter}:${selectedVerses.join(',')}`;
    const content: PresentingContent = {
      kind: "scripture",
      reference,
      text: chapterText, // In real implementation, this would be the actual verse text
      showVerseNumbers: scriptureSettings.showVerseNumbers,
      showReference: scriptureSettings.showReference,
      versesOnIndividualLines: scriptureSettings.versesOnIndividualLines,
      splitLongVerses: scriptureSettings.splitLongVerses,
      showVersion: scriptureSettings.showVersion,
      versionLabel: scriptureSettings.versionLabel,
      fontSize: scriptureSettings.fontSize,
      textAlign: scriptureSettings.textAlign,
      backgroundColor: scriptureSettings.backgroundColor,
      textColor: scriptureSettings.textColor
    };

    onContentSend(content);
    onStatusUpdate(`Added ${reference} to show`);
  };

  const selectedBookData = BIBLE_BOOKS.find(book => book.name === selectedBook);
  const maxChapters = selectedBookData?.chapters || 1;

  return (
    <div className="h-full flex bg-gray-900 text-white">
      {/* Left Pane - Library/Source */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Bible Versions</h3>
          <div className="space-y-2">
            {bibleVersions.map((version) => (
              <button
                key={version.abbr}
                onClick={() => setSelectedVersion(version.abbr)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedVersion === version.abbr 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">{version.name}</div>
                <div className="text-xs opacity-70">{version.abbr}</div>
                <div className="text-xs opacity-60 mt-1">{version.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Access</h3>
          <div className="space-y-2">
            {['John 3:16', 'Romans 8:28', 'Psalm 23', 'Matthew 28:19', 'Philippians 4:13'].map((ref) => (
              <button
                key={ref}
                onClick={() => {
                  // Parse reference and set selections
                  const parts = ref.split(' ');
                  const book = parts[0];
                  const chapterVerse = parts[1].split(':');
                  const chapter = parseInt(chapterVerse[0]);
                  const verse = parseInt(chapterVerse[1]);
                  
                  setSelectedBook(book);
                  setSelectedChapter(chapter);
                  setSelectedVerses([verse]);
                  onStatusUpdate(`Selected ${ref}`);
                }}
                className="w-full text-left p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
              >
                {ref}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center Pane - Selection Workspace */}
      <div className="flex-1 flex">
        {/* Column 1 - Books */}
        <div className="w-48 bg-gray-800 border-r border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300">Books</h3>
          </div>
          <div className="overflow-y-auto h-full">
            <div className="p-2">
              {BIBLE_BOOKS.map((book) => (
                <button
                  key={book.name}
                  onClick={() => handleBookSelect(book.name)}
                  className={`w-full text-left p-2 rounded mb-1 transition-colors ${
                    selectedBook === book.name 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">{book.name}</div>
                  <div className="text-xs opacity-70">{book.abbr} • {book.chapters} chapters</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2 - Chapters */}
        <div className="w-32 bg-gray-800 border-r border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300">Chapters</h3>
          </div>
          <div className="overflow-y-auto h-full">
            <div className="p-2">
              {selectedBook && Array.from({ length: maxChapters }, (_, i) => i + 1).map((chapter) => (
                <button
                  key={chapter}
                  onClick={() => handleChapterSelect(chapter)}
                  className={`w-full p-2 rounded mb-1 transition-colors ${
                    selectedChapter === chapter 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {chapter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3 - Verses */}
        <div className="flex-1 bg-gray-800">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300">
              {selectedBook ? `${selectedBook} ${selectedChapter}` : 'Verses'}
            </h3>
          </div>
          <div className="overflow-y-auto h-full">
            <div className="p-4">
              {selectedBook && selectedChapter ? (
                <div className="space-y-3">
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((verse) => (
                    <button
                      key={verse}
                      onClick={() => handleVerseSelect(verse)}
                      className={`w-full text-left p-3 rounded transition-colors ${
                        selectedVerses.includes(verse)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <span className="font-medium">{verse}</span>
                      <span className="ml-2">
                        Verse {verse} text would appear here. This is sample text for demonstration purposes.
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Select a book and chapter to view verses
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Preview & Formatting */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Top Section - Live Preview */}
        <div className="flex-1 p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Live Preview</h3>
          <div className="bg-black rounded-lg overflow-hidden h-64">
            {selectedBook && selectedVerses.length > 0 ? (
              <ScripturePreview
                reference={`${selectedBook} ${selectedChapter}:${selectedVerses.join(',')}`}
                text={chapterText}
                template={scriptureTemplate}
                settings={scriptureSettings}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select verses to preview
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Formatting Controls */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Formatting Controls</h3>
            
            {/* Reference Header */}
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-400">Reference</div>
              <div className="font-medium">
                {selectedBook ? `${selectedBook} ${selectedChapter}:${selectedVerses.join(',')}` : 'No selection'}
              </div>
            </div>

            {/* Template Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Template</label>
              <select
                value={scriptureTemplate}
                onChange={(e) => applyTemplate(e.target.value as keyof typeof scriptureTemplates)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
              >
                {Object.keys(scriptureTemplates).map((template) => (
                  <option key={template} value={template}>
                    {template.charAt(0).toUpperCase() + template.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Controls */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={scriptureSettings.versesOnIndividualLines}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, versesOnIndividualLines: e.target.checked }))}
                  className="rounded"
                />
                <span>Verses on individual lines</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={scriptureSettings.splitLongVerses}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, splitLongVerses: e.target.checked }))}
                  className="rounded"
                />
                <span>Split long verses</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={scriptureSettings.showVerseNumbers}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, showVerseNumbers: e.target.checked }))}
                  className="rounded"
                />
                <span>Verse numbers</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={scriptureSettings.showReference}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, showReference: e.target.checked }))}
                  className="rounded"
                />
                <span>Show reference</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={scriptureSettings.showVersion}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, showVersion: e.target.checked }))}
                  className="rounded"
                />
                <span>Show version ({selectedVersion})</span>
              </label>
              {scriptureSettings.showVersion && (
                <div className="ml-6">
                  <input
                    type="text"
                    value={scriptureSettings.versionLabel}
                    onChange={(e) => setScriptureSettings(prev => ({ ...prev, versionLabel: e.target.value }))}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                    placeholder="Version label (e.g., KJV)"
                  />
                </div>
              )}
            </div>

            {/* Convert to Show Button */}
            <button
              onClick={convertToShow}
              disabled={!selectedBook || selectedVerses.length === 0}
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Convert to Show
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}