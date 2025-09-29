"use client";

import React from 'react';
import type { Translation } from '@/services/scripture';

interface QuickTranslationToggleProps {
  selectedTranslation: Translation;
  onTranslationChange: (translation: Translation) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function QuickTranslationToggle({ 
  selectedTranslation, 
  onTranslationChange, 
  className = "",
  size = 'md',
  showLabel = false
}: QuickTranslationToggleProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const toggleTranslation = () => {
    onTranslationChange(selectedTranslation === 'KJV' ? 'TPT' : 'KJV');
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-gray-600">Translation:</span>
      )}
      <button
        onClick={toggleTranslation}
        className={`
          ${sizeClasses[size]}
          rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700
          hover:bg-blue-100 transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          font-medium
        `}
        title={`Currently: ${selectedTranslation}. Click to switch to ${selectedTranslation === 'KJV' ? 'TPT' : 'KJV'}`}
      >
        {selectedTranslation}
      </button>
    </div>
  );
}

// Even more compact version - just the button
export function TranslationButton({ 
  selectedTranslation, 
  onTranslationChange, 
  className = ""
}: Omit<QuickTranslationToggleProps, 'size' | 'showLabel'>) {
  return (
    <button
      onClick={() => onTranslationChange(selectedTranslation === 'KJV' ? 'TPT' : 'KJV')}
      className={`
        ${className}
        px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
      `}
      title={`Switch to ${selectedTranslation === 'KJV' ? 'TPT' : 'KJV'}`}
    >
      {selectedTranslation}
    </button>
  );
}