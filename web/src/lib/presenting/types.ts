"use client";

export type TextContent = {
  kind: "text";
  text: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  autoFit?: boolean;
};

export type ScriptureContent = {
  kind: "scripture";
  reference: string;
  text: string;
  verses?: Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  showVerseNumbers?: boolean;
  showReference?: boolean;
  // Presentation options inspired by FreeShow Scripture tab
  versesOnIndividualLines?: boolean;
  splitLongVerses?: boolean;
  showVersion?: boolean;
  versionLabel?: string; // e.g., "KJV", "NLT"
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  textColor?: string;
};

export type YouTubeContent = {
  kind: "youtube";
  videoId: string;
  startSeconds?: number;
  autoplay?: boolean;
  volume?: number; // 0..100
  muted?: boolean;
};

export type PresentingContent = TextContent | ScriptureContent | YouTubeContent;

export type PresentingControlAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SEEK"; seconds: number }
  | { type: "VOLUME"; volume: number }
  | { type: "MUTE" }
  | { type: "UNMUTE" };

export type PresentingMessage =
  | { type: "HELLO"; sessionId: string }
  | { type: "READY" }
  | { type: "PING" }
  | { type: "PONG" }
  | { type: "SET_CONTENT"; content: PresentingContent }
  | { type: "CONTROL"; control: PresentingControlAction }
  | { type: "PLAYBACK_ENDED" }
  | { type: "PLAYBACK_PROGRESS"; current: number; duration: number; state: "playing" | "paused" | "buffering" };

export function getChannelName(sessionId: string): string {
  return `presenting:${sessionId}`;
}


