"use client";

import React, { useState, useEffect, useRef } from 'react';
import { scriptureService, type ScriptureItem, type Translation } from '@/services/scripture';
import { TranslationSelector } from './TranslationSelector';

interface ScriptureInputProps {
  value: string;
  onChange: (value: string) => void;
  onScriptureSelect?: (scripture: ScriptureItem) => void;
  onEnterPress?: () => void;
  placeholder?: string;
  className?: string;
  translation?: Translation;
  onTranslationChange?: (translation: Translation) => void;
  showTranslationSelector?: boolean;
}

export function ScriptureInput({
  value,
  onChange,
  onScriptureSelect,
  onEnterPress,
  placeholder = "Enter scripture reference (e.g., John 3:16)",
  className = "",
  translation = 'KJV',
  onTranslationChange,
  showTranslationSelector = true
}: ScriptureInputProps) {
  const [bookSuggestions, setBookSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autocompleteText, setAutocompleteText] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add book names for autocomplete
    const books = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
      '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
      'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
      'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
      'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts',
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
      '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
      'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ];
    setBookSuggestions(books);
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim()) {
      const input = newValue.toLowerCase();
      
      // Find best book match that starts with input
      const bestMatch = bookSuggestions.find(book => 
        book.toLowerCase().startsWith(input) && book.toLowerCase() !== input
      );
      
      if (bestMatch) {
        setAutocompleteText(bestMatch);
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
        setAutocompleteText('');
      }
    } else {
      setShowAutocomplete(false);
      setAutocompleteText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle space key to accept autocomplete
    if (e.key === ' ' && showAutocomplete && autocompleteText) {
      e.preventDefault();
      onChange(autocompleteText + ' ');
      setShowAutocomplete(false);
      setAutocompleteText('');
      return;
    }

    // Handle Enter key - fetch scripture and trigger onEnterPress
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFetchScripture();
      return;
    }

    // Handle Escape to clear autocomplete
    if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setAutocompleteText('');
      return;
    }
  };


  const handleFetchScripture = async () => {
    if (!value.trim()) return;

    setIsLoading(true);
    try {
      const scripture = await scriptureService.getScripture(value, translation);
      if (scripture && onScriptureSelect) {
        onScriptureSelect(scripture);
        // Automatically trigger onEnterPress after successful scripture load
        if (onEnterPress) {
          onEnterPress();
        }
      }
    } catch (error) {
      console.error('Error fetching scripture:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full rounded-xl p-3 border bg-gray-800 border-gray-600 text-white ${className}`}
            disabled={isLoading}
          />
          {/* Autocomplete ghost text */}
          {showAutocomplete && autocompleteText && (
            <div 
              className="absolute inset-0 rounded-xl p-3 border pointer-events-none bg-gray-800 border-gray-600 text-gray-400 opacity-60"
            >
              {autocompleteText}
            </div>
          )}
        </div>
        
        {/* Translation Toggle Button */}
        {onTranslationChange && (
          <button
            onClick={() => onTranslationChange(translation === 'KJV' ? 'TPT' : 'KJV')}
            className="px-3 py-2 rounded-lg font-medium border bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-colors"
            title={`Switch to ${translation === 'KJV' ? 'TPT' : 'KJV'}`}
          >
            {translation}
          </button>
        )}
        
        <button
          onClick={handleFetchScripture}
          disabled={!value.trim() || isLoading}
          className="px-4 py-2 rounded-lg font-semibold border bg-blue-600 text-white border-gray-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '...' : 'Fetch'}
        </button>
      </div>
    </div>
  );
}