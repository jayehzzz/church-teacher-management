"use client";

import * as React from "react";

export default function FormattedText({ text, className = "", style, autoFit = false }: { text: string; className?: string; style?: React.CSSProperties; autoFit?: boolean }) {
  const parts = React.useMemo(() => parseFormattedText(text).split("\n"), [text]);
  
  // Calculate optimal font size for auto-fit
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [autoFitStyle, setAutoFitStyle] = React.useState<React.CSSProperties>({});
  
  React.useEffect(() => {
    if (!autoFit || !containerRef.current) return;
    
    const calculateOptimalSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Get actual available space, accounting for padding
      const containerStyle = window.getComputedStyle(container);
      const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
      const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
      
      const maxWidth = container.offsetWidth - paddingLeft - paddingRight;
      const maxHeight = container.offsetHeight - paddingTop - paddingBottom;
      
      // Start with a reasonable font size
      let fontSize = style?.fontSize ? parseInt(style.fontSize.toString()) : 60;
      
      // Create a test element to measure text
      const testElement = document.createElement('div');
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      testElement.style.whiteSpace = 'pre-wrap';
      testElement.style.fontFamily = 'inherit';
      testElement.style.fontWeight = 'inherit';
      testElement.style.textAlign = style?.textAlign || 'center';
      testElement.style.lineHeight = '1.1'; // Tighter line height for better fitting
      testElement.style.padding = '0';
      testElement.style.margin = '0';
      testElement.style.width = `${maxWidth}px`; // Constrain width
      testElement.style.maxWidth = `${maxWidth}px`;
      testElement.style.wordWrap = 'break-word';
      testElement.style.overflowWrap = 'break-word';
      testElement.innerHTML = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                                .replace(/__(.+?)__/g, '<u>$1</u>')
                                .replace(/~~(.+?)~~/g, '<s>$1</s>');
      
      document.body.appendChild(testElement);
      
      // Binary search for optimal font size
      let minSize = 8; // Start smaller
      let maxSize = Math.min(fontSize * 2, 150); // More conservative max
      let optimalSize = fontSize;
      
      // Test multiple sizes to find the best fit
      while (minSize <= maxSize) {
        const testSize = Math.floor((minSize + maxSize) / 2);
        testElement.style.fontSize = `${testSize}px`;
        
        // Force a reflow to get accurate measurements
        testElement.offsetHeight;
        
        const textWidth = testElement.scrollWidth;
        const textHeight = testElement.scrollHeight;
        
        if (textWidth <= maxWidth && textHeight <= maxHeight) {
          optimalSize = testSize;
          minSize = testSize + 1;
        } else {
          maxSize = testSize - 1;
        }
      }
      
      document.body.removeChild(testElement);
      
      // Apply a safety margin (reduce by 5% to ensure no overflow)
      const safeSize = Math.floor(optimalSize * 0.95);
      
      setAutoFitStyle({
        ...style,
        fontSize: `${safeSize}px`,
        lineHeight: '1.1',
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden'
      });
    };
    
    // Calculate initial size
    calculateOptimalSize();
    
    // Recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateOptimalSize, 100); // Debounce
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [text, autoFit, style]);
  
  return (
    <div 
      ref={containerRef}
      className={className} 
      style={{
        ...(autoFit ? autoFitStyle : style),
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
      }}
    >
      {parts.map((line, i) => (
        <p key={i} className="whitespace-pre-wrap leading-relaxed">
          {renderFormattedLine(line)}
        </p>
      ))}
    </div>
  );
}

function parseFormattedText(input: string): string {
  return input;
}

function renderFormattedLine(line: string) {
  // Enhanced formatting: **bold**, *italic*, __underline__, ~~strikethrough~~
  const segments: Array<string | { bold?: string; italic?: string; underline?: string; strikethrough?: string }> = [];
  
  // Combined regex for all formatting
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|~~(.+?)~~)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push(line.slice(lastIndex, match.index));
    }
    
    // Determine which formatting was matched
    if (match[2]) {
      // **bold**
      segments.push({ bold: match[2] });
    } else if (match[3]) {
      // *italic*
      segments.push({ italic: match[3] });
    } else if (match[4]) {
      // __underline__
      segments.push({ underline: match[4] });
    } else if (match[5]) {
      // ~~strikethrough~~
      segments.push({ strikethrough: match[5] });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < line.length) {
    segments.push(line.slice(lastIndex));
  }

  return segments.map((seg, idx) => {
    if (typeof seg === "string") {
      return <span key={idx}>{seg}</span>;
    }
    
    // Apply multiple formatting styles
    let className = "";
    let content = "";
    
    if (seg.bold) {
      className += "font-bold ";
      content = seg.bold;
    } else if (seg.italic) {
      className += "italic ";
      content = seg.italic;
    } else if (seg.underline) {
      className += "underline ";
      content = seg.underline;
    } else if (seg.strikethrough) {
      className += "line-through ";
      content = seg.strikethrough;
    }
    
    return (
      <span key={idx} className={className.trim()}>
        {content}
      </span>
    );
  });
}