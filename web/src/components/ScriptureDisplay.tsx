"use client";

import React from 'react';
import type { ScriptureContent } from '@/lib/presenting/types';
import type { Translation } from '@/services/scripture';

interface ScriptureDisplayProps {
  content: ScriptureContent;
  className?: string;
  translation?: Translation;
}

export function ScriptureDisplay({ content, className = "", translation = 'KJV' }: ScriptureDisplayProps) {
  const {
    reference,
    text,
    verses = [],
    showVerseNumbers = true,
    showReference = true,
    versesOnIndividualLines = true,
    splitLongVerses = false,
    showVersion = false,
    versionLabel = translation,
    fontSize = 80,
    textAlign = 'center',
    backgroundColor = 'transparent',
    textColor = '#ffffff'
  } = content;

  const formatText = (text: string) => {
    // Handle markdown-style formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  function splitIntoLines(raw: string): string[] {
    if (!splitLongVerses) return [raw];
    // Try to split by sentence boundaries first; fallback to soft chunking
    const sentenceSplits = raw.split(/([.!?;:])\s+/).reduce<string[]>((acc, part, i, arr) => {
      if (i % 2 === 0) {
        const p = part.trim();
        if (!p) return acc;
        const punct = arr[i + 1] || '';
        acc.push((p + (punct || '')).trim());
      }
      return acc;
    }, []);
    if (sentenceSplits.length > 1) return sentenceSplits;
    // Soft wrap every ~80 chars at nearest space
    const chunks: string[] = [];
    let remaining = raw.trim();
    while (remaining.length > 90) {
      const slice = remaining.slice(0, 90);
      const lastSpace = slice.lastIndexOf(' ');
      const cut = lastSpace > 40 ? lastSpace : 90;
      chunks.push(remaining.slice(0, cut).trim());
      remaining = remaining.slice(cut).trim();
    }
    if (remaining) chunks.push(remaining);
    return chunks;
  }

  const renderVerses = () => {
    if (verses.length === 0) {
      const lines = versesOnIndividualLines ? text.split(/\n+/).filter(Boolean) : [text];
      return (
        <div className="scripture-text" style={{ padding: '20px' }}>
          {lines.map((line, idx) => (
            <div
              key={idx}
              style={{
                fontSize: `${fontSize}px`,
                textAlign,
                color: textColor,
                lineHeight: 1.4,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
              dangerouslySetInnerHTML={{ __html: formatText(line) }}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="scripture-verses" style={{ padding: '20px' }}>
        {verses.map((verse) => (
          <div key={`${verse.book}-${verse.chapter}-${verse.verse}`} className="verse-item">
            {showVerseNumbers && (
              <span 
                className="verse-number"
                style={{
                  fontSize: `${fontSize * 0.6}px`,
                  color: '#919191',
                  marginRight: '10px',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {verse.verse}
              </span>
            )}
            <span className="verse-text" style={{ display: 'inline-block' }}>
              {versesOnIndividualLines
                ? splitIntoLines(verse.text).map((ln, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: `${fontSize}px`,
                        color: textColor,
                        lineHeight: 1.35,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                      }}
                      dangerouslySetInnerHTML={{ __html: formatText(ln) }}
                    />
                  ))
                : (
                    <span
                      style={{
                        fontSize: `${fontSize}px`,
                        color: textColor,
                        lineHeight: 1.4,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                      }}
                      dangerouslySetInnerHTML={{ __html: formatText(verse.text) }}
                    />
                  )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`scripture-display ${className}`}
      style={{
        backgroundColor,
        color: textColor,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        fontFamily: 'serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Gradient orbs */}
        <div className="gradient-orbs">
          <div
            className="orb orb-1"
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              top: '10%',
              left: '10%',
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
          <div
            className="orb orb-2"
            style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              top: '60%',
              right: '15%',
              animation: 'pulse 6s ease-in-out infinite reverse'
            }}
          />
          <div
            className="orb orb-3"
            style={{
              position: 'absolute',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              bottom: '20%',
              left: '50%',
              animation: 'pulse 5s ease-in-out infinite'
            }}
          />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="grid-pattern"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
      </div>

      {/* Main Content */}
      <div 
        className="scripture-content relative z-10"
        style={{
          maxWidth: '90%',
          textAlign,
          width: '100%'
        }}
      >
        {showReference && (
          <div 
            className="scripture-reference mb-8"
            style={{
              fontSize: `${fontSize * 0.5}px`,
              color: '#cccccc',
              textAlign,
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              letterSpacing: '1px'
            }}
          >
            {reference}
          </div>
        )}
        
        {renderVerses()}
      </div>

      {/* Footer */}
      {showVersion && (
        <div 
          className="scripture-footer absolute bottom-8 right-8"
          style={{
            fontSize: `${fontSize * 0.3}px`,
            color: '#888888',
            opacity: 0.8,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {versionLabel}
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.2; }
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        .verse-item {
          margin-bottom: 1rem;
          animation: fadeInUp 0.6s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .scripture-reference {
          animation: fadeInDown 0.8s ease-out;
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Enhanced template styles with beautiful backgrounds
export const scriptureTemplates = {
  // Classic Styles
  classic: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  traditional: {
    fontSize: 75,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #7c2d12 0%, #991b1b 50%, #dc2626 100%)',
    textColor: '#fef2f2',
    showVerseNumbers: true,
    showReference: true
  },
  vintage: {
    fontSize: 85,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)',
    textColor: '#fef3c7',
    showVerseNumbers: true,
    showReference: true
  },
  
  // Modern Styles
  modern: {
    fontSize: 70,
    textAlign: 'left' as const,
    backgroundColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    textColor: '#ffffff',
    showVerseNumbers: false,
    showReference: true
  },
  sleek: {
    fontSize: 75,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)',
    textColor: '#f9fafb',
    showVerseNumbers: false,
    showReference: true
  },
  contemporary: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },

  // Elegant Styles
  elegant: {
    fontSize: 85,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  royal: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #f97316 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  luxurious: {
    fontSize: 85,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    textColor: '#e0e7ff',
    showVerseNumbers: true,
    showReference: true
  },

  // Peaceful Styles
  peaceful: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  serene: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)',
    textColor: '#f0f9ff',
    showVerseNumbers: true,
    showReference: true
  },
  tranquil: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },

  // Warm Styles
  warm: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  cozy: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  sunset: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },

  // Cool Styles
  cool: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  frost: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 50%, #38bdf8 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  ocean: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },

  // Minimalist Styles
  minimalist: {
    fontSize: 90,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
    textColor: '#1e293b',
    showVerseNumbers: false,
    showReference: false
  },
  clean: {
    fontSize: 85,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    textColor: '#334155',
    showVerseNumbers: false,
    showReference: true
  },
  simple: {
    fontSize: 85,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
    textColor: '#475569',
    showVerseNumbers: true,
    showReference: true
  },

  // Dark Styles
  dark: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #000000 0%, #1f2937 50%, #374151 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  midnight: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    textColor: '#e0e7ff',
    showVerseNumbers: true,
    showReference: true
  },
  charcoal: {
    fontSize: 80,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },

  // Special Styles
  golden: {
    fontSize: 85,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)',
    textColor: '#fef3c7',
    showVerseNumbers: true,
    showReference: true
  },
  silver: {
    fontSize: 85,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 50%, #d1d5db 100%)',
    textColor: '#ffffff',
    showVerseNumbers: true,
    showReference: true
  },
  pearl: {
    fontSize: 85,
    textAlign: 'center' as const,
    backgroundColor: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #d1d5db 100%)',
    textColor: '#374151',
    showVerseNumbers: true,
    showReference: true
  }
};