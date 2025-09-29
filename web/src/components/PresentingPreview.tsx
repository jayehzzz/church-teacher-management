"use client";

import React from 'react';
import type { PresentingContent } from '@/lib/presenting/types';
import { ScriptureDisplay } from '@/components/ScriptureDisplay';
import FormattedText from '@/components/FormattedText';

interface PresentingPreviewProps {
  content: PresentingContent | null;
}

export function PresentingPreview({ content }: PresentingPreviewProps) {
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="text-2xl text-gray-400 mb-4">Preview Area</div>
          <div className="text-sm text-gray-500">Content will appear here when sent to output</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-black">
      <div className="max-w-5xl w-full text-center p-8">
        {content.kind === "text" ? (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              overflow: 'hidden',
              padding: '16px'
            }}
          >
            <FormattedText 
              text={content.text} 
              className="font-semibold text-white"
              style={{
                fontSize: content.fontSize ? `${content.fontSize}px` : '60px',
                textAlign: content.textAlign || 'center',
                lineHeight: '1.1'
              }}
              autoFit={content.autoFit || false}
            />
          </div>
        ) : content.kind === "scripture" ? (
          <ScriptureDisplay content={content} />
        ) : content.kind === "youtube" ? (
          <div className="text-center">
            <div className="text-3xl text-white mb-4">🎵 YouTube Video</div>
            <div className="text-lg text-gray-400">Video ID: {content.videoId}</div>
            <div className="text-sm text-gray-500 mt-2">
              {content.autoplay ? "Autoplay enabled" : "Autoplay disabled"}
              {content.muted ? " • Muted" : ""}
              {content.volume ? ` • Volume: ${content.volume}%` : ""}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}