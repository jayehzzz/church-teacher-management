"use client";

import React from 'react';
import type { Translation } from '@/services/scripture';

interface TranslationSelectorProps {
  selectedTranslation: Translation;
  onTranslationChange: (translation: Translation) => void;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TranslationSelector({ 
  selectedTranslation, 
  onTranslationChange, 
  className = "",
  showLabels = true,
  size = 'md'
}: TranslationSelectorProps) {
  const translations: { value: Translation; label: string; description: string }[] = [
    {
      value: 'KJV',
      label: 'KJV',
      description: 'King James Version'
    },
    {
      value: 'TPT',
      label: 'TPT',
      description: 'The Passion Translation'
    }
  ];

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  return (
    <div className={`translation-selector ${className}`}>
      {showLabels && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bible Translation
        </label>
      )}
      
      <div className="flex space-x-2">
        {translations.map((translation) => (
          <button
            key={translation.value}
            onClick={() => onTranslationChange(translation.value)}
            className={`
              ${sizeClasses[size]}
              rounded-lg border-2 transition-all duration-200
              ${selectedTranslation === translation.value
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
            title={translation.description}
          >
            <div className="flex flex-col items-center">
              <span className="font-semibold">{translation.label}</span>
              {showLabels && (
                <span className="text-xs opacity-75 mt-1">
                  {translation.description}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Compact version for inline use
export function CompactTranslationSelector({ 
  selectedTranslation, 
  onTranslationChange, 
  className = ""
}: Omit<TranslationSelectorProps, 'showLabels' | 'size'>) {
  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      <span className="text-sm text-gray-600">Translation:</span>
      <select
        value={selectedTranslation}
        onChange={(e) => onTranslationChange(e.target.value as Translation)}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="KJV">KJV</option>
        <option value="TPT">TPT</option>
      </select>
    </div>
  );
}

// Toggle version for quick switching
export function TranslationToggle({ 
  selectedTranslation, 
  onTranslationChange, 
  className = ""
}: Omit<TranslationSelectorProps, 'showLabels' | 'size'>) {
  return (
    <button
      onClick={() => onTranslationChange(selectedTranslation === 'KJV' ? 'TPT' : 'KJV')}
      className={`
        ${className}
        px-4 py-2 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700
        hover:bg-blue-100 transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        font-medium
      `}
      title={`Switch to ${selectedTranslation === 'KJV' ? 'TPT' : 'KJV'}`}
    >
      {selectedTranslation === 'KJV' ? 'Switch to TPT' : 'Switch to KJV'}
    </button>
  );
}