"use client";

import React from 'react';
import { ScriptureDisplay } from './ScriptureDisplay';
import { scriptureTemplates } from './ScriptureDisplay';

interface ScripturePreviewProps {
  reference: string;
  text: string;
  template: keyof typeof scriptureTemplates;
  settings: {
    showVerseNumbers: boolean;
    showReference: boolean;
    versesOnIndividualLines: boolean;
    splitLongVerses: boolean;
    showVersion: boolean;
    versionLabel?: string;
    fontSize: number;
    textAlign: 'left' | 'center' | 'right';
    backgroundColor: string;
    textColor: string;
  };
}

export function ScripturePreview({ reference, text, template, settings }: ScripturePreviewProps) {
  const templateSettings = scriptureTemplates[template];
  
  const previewContent = {
    kind: "scripture" as const,
    reference,
    text,
    showVerseNumbers: settings.showVerseNumbers,
    showReference: settings.showReference,
    versesOnIndividualLines: settings.versesOnIndividualLines,
    splitLongVerses: settings.splitLongVerses,
    showVersion: settings.showVersion,
    versionLabel: settings.versionLabel,
    fontSize: settings.fontSize,
    textAlign: settings.textAlign,
    backgroundColor: templateSettings.backgroundColor,
    textColor: templateSettings.textColor
  };

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
      <div className="p-3 bg-gray-700 border-b border-gray-600">
        <div className="text-sm font-medium text-gray-300">Preview</div>
      </div>
      <div className="h-64 overflow-hidden">
        <div className="scale-50 origin-top-left w-[200%] h-[200%]">
          <ScriptureDisplay content={previewContent} />
        </div>
      </div>
    </div>
  );
}