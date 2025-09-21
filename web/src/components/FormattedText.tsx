"use client";

import * as React from "react";

export default function FormattedText({ text, className = "" }: { text: string; className?: string }) {
  const parts = React.useMemo(() => parseBold(text).split("\n"), [text]);
  return (
    <div className={className}>
      {parts.map((line, i) => (
        <p key={i} className="whitespace-pre-wrap leading-relaxed">
          {renderBold(line)}
        </p>
      ))}
    </div>
  );
}

function parseBold(input: string): string {
  return input;
}

function renderBold(line: string) {
  // simple **bold** handling
  const segments: Array<string | { bold: string }> = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push(line.slice(lastIndex, match.index));
    }
    segments.push({ bold: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    segments.push(line.slice(lastIndex));
  }

  return segments.map((seg, idx) =>
    typeof seg === "string" ? (
      <span key={idx}>{seg}</span>
    ) : (
      <strong key={idx} className="font-bold">
        {seg.bold}
      </strong>
    )
  );
}



