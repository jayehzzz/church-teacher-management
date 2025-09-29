"use client";

import React, { useState } from 'react';
import { ScriptureInput } from '@/components/ScriptureInput';
import { ScriptureNavigator } from '@/components/ScriptureNavigator';
import { ScripturePreview } from '@/components/ScripturePreview';
import { TextFormattingToolbar } from '@/components/TextFormattingToolbar';
import FormattedText from '@/components/FormattedText';
import { type ScriptureItem, type Translation } from '@/services/scripture';
import { scriptureTemplates } from '@/components/ScriptureDisplay';
import type { PresentingContent } from '@/lib/presenting/types';
import { extractYouTubeVideoId, fetchYouTubeOEmbed } from '@/lib/presenting/youtube';

type DrawerTab = 'text' | 'scripture' | 'audio';

interface PresentingDrawerProps {
  onContentSend: (content: PresentingContent) => void;
  onStatusUpdate: (status: string) => void;
}

export function PresentingDrawer({ onContentSend, onStatusUpdate }: PresentingDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('text');
  const [textInput, setTextInput] = useState("");
  const [scriptureRef, setScriptureRef] = useState("");
  const [scriptureText, setScriptureText] = useState("");
  const [selectedScripture, setSelectedScripture] = useState<ScriptureItem | null>(null);
  const [translation, setTranslation] = useState<Translation>('KJV');
  const [scriptureTemplate, setScriptureTemplate] = useState<keyof typeof scriptureTemplates>("classic");
  const [scriptureSettings, setScriptureSettings] = useState({
    showVerseNumbers: true,
    showReference: true,
    versesOnIndividualLines: true,
    splitLongVerses: false,
    showVersion: false,
    versionLabel: translation,
    fontSize: 80,
    textAlign: 'center' as 'left' | 'center' | 'right',
    backgroundColor: 'transparent',
    textColor: '#ffffff'
  });
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [volume, setVolume] = useState(70);
  const [scriptureView, setScriptureView] = useState<'input' | 'navigator'>('input');
  const [textFontSize, setTextFontSize] = useState(60);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [textAutoFit, setTextAutoFit] = useState(false);

  const handleScriptureSelect = (scripture: ScriptureItem) => {
    setSelectedScripture(scripture);
    setScriptureRef(scripture.reference);
    setScriptureText(scripture.text);
  };

  const applyTemplate = (template: keyof typeof scriptureTemplates) => {
    setScriptureTemplate(template);
    setScriptureSettings(prev => ({
      ...prev,
      ...scriptureTemplates[template]
    }));
  };

  // Update version label when translation changes
  React.useEffect(() => {
    setScriptureSettings(prev => ({
      ...prev,
      versionLabel: translation
    }));
  }, [translation]);

  const showText = () => {
    onContentSend({ 
      kind: "text", 
      text: textInput,
      fontSize: textFontSize,
      textAlign: textAlign,
      autoFit: textAutoFit
    });
  };

  const handleTextFormat = (format: string) => {
    const textarea = document.querySelector('textarea[placeholder*="Type text here"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textInput.substring(start, end);
    
    if (selectedText) {
      const formattedText = `${format}${selectedText}${format}`;
      const newText = textInput.substring(0, start) + formattedText + textInput.substring(end);
      setTextInput(newText);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + format.length, end + format.length);
      }, 0);
    } else {
      // No text selected, insert format markers
      const newText = textInput.substring(0, start) + format + format + textInput.substring(end);
      setTextInput(newText);
      
      // Position cursor between format markers
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + format.length, start + format.length);
      }, 0);
    }
  };

  const showScripture = () => {
    if (selectedScripture) {
      onContentSend({ 
        kind: "scripture", 
        reference: selectedScripture.reference, 
        text: selectedScripture.text,
        verses: selectedScripture.verses,
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
      });
    } else {
      onContentSend({ 
        kind: "scripture", 
        reference: scriptureRef, 
        text: scriptureText,
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
      });
    }
  };

  const showYouTube = () => {
    const id = extractYouTubeVideoId(youtubeUrl);
    if (!id) {
      onStatusUpdate("Invalid YouTube URL or ID");
      return;
    }
    onContentSend({ kind: "youtube", videoId: id, autoplay: true, volume, muted: false });
    onStatusUpdate("Added YouTube audio to output");
    fetchYouTubeOEmbed(id).then((meta) => {
      if (meta?.title) onStatusUpdate(`Audio: ${meta.title}`);
    }).catch(() => {});
  };



  return (
    <div className="flex h-full">
      {/* Tab Navigation */}
      <div className="w-16 bg-gray-800 flex flex-col border-r border-gray-700">
        <button
          onClick={() => setActiveTab('text')}
          className={`p-4 text-center ${activeTab === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Text"
        >
          <div className="text-xs">TEXT</div>
        </button>
        <button
          onClick={() => setActiveTab('scripture')}
          className={`p-4 text-center ${activeTab === 'scripture' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Scripture"
        >
          <div className="text-xs">BIBLE</div>
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`p-4 text-center ${activeTab === 'audio' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          title="Audio"
        >
          <div className="text-xs">AUDIO</div>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'text' && (
          <div className="p-4 space-y-4">
            {/* Text Formatting Toolbar */}
            <TextFormattingToolbar
              onFormat={handleTextFormat}
              onSizeChange={setTextFontSize}
              onAlignChange={setTextAlign}
              onAutoFitChange={setTextAutoFit}
              fontSize={textFontSize}
              textAlign={textAlign}
              autoFit={textAutoFit}
            />

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Text Content</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    showText();
                  }
                }}
                placeholder="Type text here. Use formatting buttons or type: **bold**, *italic*, __underline__, ~~strikethrough~~. Press Ctrl+Enter to send to output."
                className="w-full h-40 rounded-lg p-4 bg-gray-800 border border-gray-600 text-white resize-none"
              />
            </div>

            {/* Preview */}
            {textInput && (
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
                <div 
                  className="w-full min-h-20 rounded-lg p-4 bg-gray-900 border border-gray-600 text-white"
                  style={{ 
                    fontSize: textAutoFit ? '60px' : `${textFontSize}px`,
                    textAlign: textAlign
                  }}
                >
                  <FormattedText text={textInput} autoFit={textAutoFit} />
                </div>
              </div>
            )}

            <button
              onClick={showText}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📤 Send to Output
            </button>
          </div>
        )}

        {activeTab === 'scripture' && (
          <div className="p-4 space-y-4">
            {/* Scripture View Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setScriptureView('input')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scriptureView === 'input' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Quick Input
              </button>
              <button
                onClick={() => setScriptureView('navigator')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scriptureView === 'navigator' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Browse Bible
              </button>
            </div>

            {/* Scripture Input View */}
            {scriptureView === 'input' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scripture Reference</label>
                <ScriptureInput
                  value={scriptureRef}
                  onChange={setScriptureRef}
                  onScriptureSelect={handleScriptureSelect}
                  onEnterPress={showScripture}
                  translation={translation}
                  onTranslationChange={setTranslation}
                  placeholder="Type scripture reference (e.g., 'john' → 'John'). Press Space to accept, Enter to send."
                />
              </div>
            )}

            {/* Scripture Navigator View */}
            {scriptureView === 'navigator' && (
              <ScriptureNavigator
                onScriptureSelect={handleScriptureSelect}
                onReferenceSelect={(reference) => {
                  setScriptureRef(reference);
                }}
                onAutoSend={showScripture}
              />
            )}

            {/* Scripture Text */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Scripture Text</label>
              <textarea
                value={scriptureText}
                onChange={(e) => setScriptureText(e.target.value)}
                placeholder="Scripture text. Use **bold** for emphasis."
                className="w-full h-32 rounded-lg p-4 bg-gray-800 border border-gray-600 text-white resize-none"
              />
            </div>

            {/* Simple Template Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Style</label>
              <select
                value={scriptureTemplate}
                onChange={(e) => applyTemplate(e.target.value as keyof typeof scriptureTemplates)}
                className="w-full rounded-lg p-2 bg-gray-800 border border-gray-600 text-white"
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="elegant">Elegant</option>
                <option value="minimalist">Minimalist</option>
              </select>
            </div>

            {/* Simple Settings */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Font Size: {scriptureSettings.fontSize}px</label>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={scriptureSettings.fontSize}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Alignment</label>
                <select
                  value={scriptureSettings.textAlign}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, textAlign: e.target.value as 'left' | 'center' | 'right' }))}
                  className="w-full rounded-lg p-2 bg-gray-800 border border-gray-600 text-white"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            {/* Simple Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={scriptureSettings.showVerseNumbers}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, showVerseNumbers: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Verse numbers</span>
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={scriptureSettings.showReference}
                  onChange={(e) => setScriptureSettings(prev => ({ ...prev, showReference: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Reference</span>
              </label>
            </div>

            {/* Preview */}
            {(selectedScripture || scriptureRef) && (
              <ScripturePreview
                reference={selectedScripture?.reference || scriptureRef}
                text={selectedScripture?.text || scriptureText}
                template={scriptureTemplate}
                settings={scriptureSettings}
              />
            )}

            <button
              onClick={showScripture}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📤 Send to Output
            </button>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="p-4 space-y-4">
            <div className="text-sm text-gray-400 mb-4">
              🎵 Add YouTube audio to play in the corner while presenting
            </div>
            
            {/* YouTube URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">YouTube URL</label>
              <div className="flex gap-2">
                <input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      showYouTube();
                    }
                  }}
                  placeholder="Paste YouTube link or ID"
                  className="flex-1 rounded-lg p-3 bg-gray-800 border border-gray-600 text-white"
                />
                <button
                  onClick={showYouTube}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  🎵 Add Audio
                </button>
              </div>
            </div>

            {/* Volume Control */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Volume: {volume}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Info */}
            <div className="text-xs text-gray-400 p-3 bg-gray-800 rounded">
              <div className="mb-2">📺 YouTube player appears in corner</div>
              <div>• Audio plays while you present scripture/text</div>
              <div>• Player is always visible (YouTube compliance)</div>
              <div>• Autoplay when 50%+ visible</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}