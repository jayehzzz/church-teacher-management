"use client";

import React, { useState } from 'react';
import { ScriptureInput } from '@/components/ScriptureInput';
import { ScriptureDisplay } from '@/components/ScriptureDisplay';
import { TranslationSelector } from '@/components/TranslationSelector';
import { scriptureService, type ScriptureItem, type Translation } from '@/services/scripture';
import type { ScriptureContent } from '@/lib/presenting/types';

export default function ScriptureTestPage() {
  const [scriptureReference, setScriptureReference] = useState('');
  const [selectedTranslation, setSelectedTranslation] = useState<Translation>('KJV');
  const [currentScripture, setCurrentScripture] = useState<ScriptureItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScriptureSelect = (scripture: ScriptureItem) => {
    setCurrentScripture(scripture);
    setError(null);
  };

  const handleFetchScripture = async () => {
    if (!scriptureReference.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const scripture = await scriptureService.getScripture(scriptureReference, selectedTranslation);
      if (scripture) {
        setCurrentScripture(scripture);
      } else {
        setError('Scripture not found. Please check your reference.');
      }
    } catch (err) {
      setError('Error fetching scripture. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslationChange = (translation: Translation) => {
    setSelectedTranslation(translation);
    // If we have a current scripture, refetch it with the new translation
    if (currentScripture) {
      handleFetchScripture();
    }
  };

  const convertToScriptureContent = (scripture: ScriptureItem): ScriptureContent => ({
    reference: scripture.reference,
    text: scripture.text,
    verses: scripture.verses,
    showVerseNumbers: true,
    showReference: true,
    versesOnIndividualLines: true,
    splitLongVerses: false,
    showVersion: true,
    versionLabel: scripture.translation,
    fontSize: 60,
    textAlign: 'center',
    backgroundColor: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
    textColor: '#ffffff'
  });

  const sampleReferences = [
    'John 3:16',
    'Romans 8:28',
    'Psalm 23:1',
    'Philippians 4:13',
    'Jeremiah 29:11',
    '1 Corinthians 13:4-7'
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Scripture Translation Test
          </h1>
          
          <div className="space-y-6">
            {/* Translation Selector */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Translation</h2>
              <TranslationSelector
                selectedTranslation={selectedTranslation}
                onTranslationChange={handleTranslationChange}
                size="lg"
              />
            </div>

            {/* Scripture Input */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Enter Scripture Reference</h2>
              <ScriptureInput
                value={scriptureReference}
                onChange={setScriptureReference}
                onScriptureSelect={handleScriptureSelect}
                onEnterPress={handleFetchScripture}
                translation={selectedTranslation}
                onTranslationChange={setSelectedTranslation}
                showTranslationSelector={false}
                placeholder="Enter scripture reference (e.g., John 3:16)"
              />
            </div>

            {/* Sample References */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Test References</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sampleReferences.map((ref) => (
                  <button
                    key={ref}
                    onClick={() => {
                      setScriptureReference(ref);
                      // Auto-fetch the scripture
                      setTimeout(() => {
                        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                        if (input) {
                          input.value = ref;
                          setScriptureReference(ref);
                          handleFetchScripture();
                        }
                      }, 100);
                    }}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading scripture...</p>
              </div>
            )}
          </div>
        </div>

        {/* Scripture Display */}
        {currentScripture && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentScripture.reference} ({currentScripture.translation})
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Translation: {currentScripture.translation}</span>
                <span>•</span>
                <span>Verses: {currentScripture.verses.length}</span>
                <span>•</span>
                <span>Fetched: {new Date(currentScripture.createdAt).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose max-w-none">
                <div className="space-y-4">
                  {currentScripture.verses.map((verse, index) => (
                    <div key={index} className="flex">
                      <span className="text-blue-600 font-semibold mr-3 min-w-[3rem]">
                        {verse.verse}
                      </span>
                      <span className="text-gray-800 leading-relaxed">
                        {verse.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Scripture Display Component */}
        {currentScripture && (
          <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Full Scripture Display Component
              </h2>
              <p className="text-gray-600">
                This shows how the scripture would appear in your presentation system.
              </p>
            </div>
            
            <div className="relative">
              <ScriptureDisplay
                content={convertToScriptureContent(currentScripture)}
                translation={currentScripture.translation}
              />
            </div>
          </div>
        )}

        {/* API Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">API Information</h2>
          <div className="space-y-2 text-blue-800">
            <p><strong>KJV API:</strong> Uses bible-api.com for King James Version</p>
            <p><strong>TPT API:</strong> Uses multiple sources for The Passion Translation</p>
            <p><strong>Fallback:</strong> Sample TPT verses included for testing</p>
            <p><strong>Caching:</strong> Scriptures are cached per translation</p>
          </div>
        </div>
      </div>
    </div>
  );
}