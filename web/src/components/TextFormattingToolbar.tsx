"use client";

import React from 'react';

interface TextFormattingToolbarProps {
  onFormat: (format: string) => void;
  onSizeChange: (size: number) => void;
  onAlignChange: (align: 'left' | 'center' | 'right') => void;
  onAutoFitChange: (autoFit: boolean) => void;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  autoFit: boolean;
}

export function TextFormattingToolbar({ 
  onFormat, 
  onSizeChange, 
  onAlignChange, 
  onAutoFitChange,
  fontSize, 
  textAlign,
  autoFit
}: TextFormattingToolbarProps) {
  
  const formatButtons = [
    { 
      label: 'B', 
      title: 'Bold', 
      format: '**', 
      className: 'font-bold' 
    },
    { 
      label: 'I', 
      title: 'Italic', 
      format: '*', 
      className: 'italic' 
    },
    { 
      label: 'U', 
      title: 'Underline', 
      format: '__', 
      className: 'underline' 
    },
    { 
      label: 'S', 
      title: 'Strikethrough', 
      format: '~~', 
      className: 'line-through' 
    }
  ];

  return (
    <div className="space-y-4">
      {/* Formatting Buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Text Formatting</label>
        <div className="flex gap-2 flex-wrap">
          {formatButtons.map((button) => (
            <button
              key={button.label}
              onClick={() => onFormat(button.format)}
              title={button.title}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                button.className === 'font-bold' ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' :
                button.className === 'italic' ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' :
                button.className === 'underline' ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' :
                'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
              }`}
            >
              <span className={button.className}>{button.label}</span>
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Select text and click format buttons, or type: **bold**, *italic*, __underline__, ~~strikethrough~~
        </div>
      </div>

      {/* Auto-fit Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={autoFit}
            onChange={(e) => onAutoFitChange(e.target.checked)}
            className="rounded"
          />
          <span>🔍 Auto-fit to screen</span>
        </label>
        <div className="text-xs text-gray-400 mt-1">
          Automatically adjusts font size to fit content on screen
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Font Size: {fontSize}px {autoFit && "(Auto-fit enabled)"}
        </label>
        <input
          type="range"
          min="24"
          max="120"
          value={fontSize}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-full"
          disabled={autoFit}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Text Alignment</label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onAlignChange(align)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                textAlign === align
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {align === 'left' && '⬅️ Left'}
              {align === 'center' && '↔️ Center'}
              {align === 'right' && '➡️ Right'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}