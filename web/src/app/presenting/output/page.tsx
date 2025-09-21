"use client";

import * as React from "react";
import { createPresentingChannel } from "@/lib/presenting/channel";
import type { PresentingContent, PresentingMessage, YouTubeContent } from "@/lib/presenting/types";
import FormattedText from "@/components/FormattedText";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function PresentingOutputPage() {
  const [sessionId, setSessionId] = React.useState<string>(() => getOrCreateSessionId());
  const [ready, setReady] = React.useState(false);
  const [content, setContent] = React.useState<PresentingContent | null>(null);
  const playerRef = React.useRef<any>(null);
  const volumeRef = React.useRef<number>(70);
  const ytContainerRef = React.useRef<HTMLDivElement | null>(null);
  const channelRef = React.useRef<ReturnType<typeof createPresentingChannel> | null>(null);
  const [hasPlayer, setHasPlayer] = React.useState(false);
  const [showUi, setShowUi] = React.useState(false);
  const [trackInfo, setTrackInfo] = React.useState<{ title: string; author?: string } | null>(null);
  const [showVideoOverlay, setShowVideoOverlay] = React.useState(false);
  const [audioEnabled, setAudioEnabled] = React.useState(false);
  const ytmWindowRef = React.useRef<Window | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session") || sessionId;
    setSessionId(sid);
    const channel = createPresentingChannel(sid);
    channelRef.current = channel;

    const unsubscribe = channel.subscribe(handleMessage);
    channel.send({ type: "HELLO", sessionId: sid });
    channel.send({ type: "READY" });

    ensureYouTubeApi().then(() => setReady(true));

    return () => {
      unsubscribe();
      channel.close();
      if (playerRef.current?.destroy) playerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If YouTube API finishes loading after a SET_CONTENT arrived,
  // mount the player now using the stored content state.
  React.useEffect(() => {
    if (!ready) return;
    if (content && content.kind === "youtube") {
      mountOrUpdateYouTube(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, content]);

  // Enable audio on first user click if needed
  React.useEffect(() => {
    if (audioEnabled) return;
    const handler = () => {
      if (!audioEnabled) {
        (window as any).enableOutputAudio?.();
      }
      if ((window as any).enableOutputAudio) {
        window.removeEventListener("click", handler, { capture: true } as any);
      }
    };
    window.addEventListener("click", handler, { capture: true } as any);
    return () => window.removeEventListener("click", handler, { capture: true } as any);
  }, [audioEnabled]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitPresenting();
      }
    };
    const onMove = () => {
      setShowUi(true);
      window.clearTimeout((onMove as any)._t);
      (onMove as any)._t = window.setTimeout(() => setShowUi(false), 1500);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMove);
      window.clearTimeout((onMove as any)._t);
    };
  }, []);

  function handleMessage(message: PresentingMessage) {
    if (message.type === "PING") {
      channelRef.current?.send({ type: "PONG" });
      return;
    }
    if (message.type === "SET_CONTENT") {
      setContent(message.content);
      if (message.content.kind === "youtube") {
        mountOrUpdateYouTube(message.content);
        fetchYouTubeMetadata(message.content.videoId).then(setTrackInfo).catch(() => setTrackInfo(null));
      }
      return;
    }
    if (message.type === "CONTROL") {
      if (!playerRef.current) return;
      const control = message.control;
      switch (control.type) {
        case "PLAY":
          playerRef.current.playVideo?.();
          break;
        case "PAUSE":
          playerRef.current.pauseVideo?.();
          break;
        case "STOP":
          playerRef.current.stopVideo?.();
          break;
        case "SEEK":
          playerRef.current.seekTo?.(control.seconds, true);
          break;
        case "VOLUME":
          volumeRef.current = control.volume;
          playerRef.current.setVolume?.(control.volume);
          break;
        case "MUTE":
          playerRef.current.mute?.();
          break;
        case "UNMUTE":
          if (!audioEnabled) {
            // surface prompt to enable audio via click
            setShowUi(true);
          }
          playerRef.current.unMute?.();
          break;
      }
      return;
    }
    // No other message types
  }

  function mountOrUpdateYouTube(yt: YouTubeContent) {
    if (!ready) return;
    if (!window.YT || !window.YT.Player) return;
    if (!ytContainerRef.current) return;

    if (!playerRef.current) {
      playerRef.current = new window.YT.Player(ytContainerRef.current, {
        width: "100%",
        height: "100%",
        videoId: yt.videoId,
        playerVars: {
          autoplay: yt.autoplay ? 1 : 0,
          start: yt.startSeconds ?? 0,
          controls: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (typeof yt.volume === "number") {
              volumeRef.current = yt.volume;
              playerRef.current.setVolume(yt.volume);
            }
            // Start muted to satisfy autoplay policies; user can enable audio with a click
            playerRef.current.mute();
            try { playerRef.current.playVideo?.(); } catch {}
            setHasPlayer(true);
            // expose a function to enable audio after user gesture
            (window as any).enableOutputAudio = () => {
              try {
                playerRef.current.unMute?.();
                playerRef.current.setVolume?.(volumeRef.current ?? 70);
                setAudioEnabled(true);
              } catch {}
            };
          },
          onStateChange: (e: any) => {
            // If playback pauses due to policy, try to play muted
            const YT = window.YT;
            if (YT && e.data === YT.PlayerState.UNSTARTED) {
              try { playerRef.current.playVideo?.(); } catch {}
            }
            if (YT && e.data === YT.PlayerState.ENDED) {
              try { channelRef.current?.send({ type: "PLAYBACK_ENDED" }); } catch {}
            }
            if (YT) {
              const state = e.data;
              const status = state === YT.PlayerState.PLAYING ? "playing" : state === YT.PlayerState.PAUSED ? "paused" : "buffering";
              try {
                const current = playerRef.current.getCurrentTime?.() ?? 0;
                const duration = playerRef.current.getDuration?.() ?? 0;
                channelRef.current?.send({ type: "PLAYBACK_PROGRESS", current, duration, state: status });
              } catch {}
            }
          },
        },
      });
    } else {
      try {
        playerRef.current.loadVideoById({
          videoId: yt.videoId,
          startSeconds: yt.startSeconds ?? 0,
        });
        if (typeof yt.volume === "number") {
          volumeRef.current = yt.volume;
          playerRef.current.setVolume(yt.volume);
        }
        // keep muted until user enables audio
        playerRef.current.mute();
      } catch {}
    }
  }

  // Periodic progress ping while playing
  React.useEffect(() => {
    const id = setInterval(() => {
      try {
        if (!playerRef.current) return;
        if (!window.YT) return;
        const current = playerRef.current.getCurrentTime?.() ?? 0;
        const duration = playerRef.current.getDuration?.() ?? 0;
        const state = playerRef.current.getPlayerState?.();
        const status = state === window.YT.PlayerState.PLAYING ? "playing" : state === window.YT.PlayerState.PAUSED ? "paused" : "buffering";
        channelRef.current?.send({ type: "PLAYBACK_PROGRESS", current, duration, state: status });
      } catch {}
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen" style={{ backgroundColor: "black", color: "white" }}>
      <div className="relative w-full h-full">
        {showUi ? (
          <div className="absolute top-4 left-4 z-[60] flex items-center gap-3">
            <button onClick={exitPresenting} className="px-3 py-1 rounded-md border text-sm shadow" style={{ backgroundColor: "rgba(0,0,0,0.6)", borderColor: "#333", color: "#fff" }}>Exit</button>
            <span className="text-xs opacity-70">Esc to exit</span>
          </div>
        ) : null}
        {!audioEnabled && hasPlayer ? (
          <div className="absolute top-4 right-4 z-[60]">
            <button onClick={() => (window as any).enableOutputAudio?.()} className="px-3 py-1 rounded-md border text-sm shadow" style={{ backgroundColor: "rgba(0,0,0,0.6)", borderColor: "#333", color: "#fff" }}>Enable audio</button>
          </div>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="max-w-5xl w-full text-center">
            {content && content.kind === "text" ? (
              <FormattedText text={content.text} className="text-5xl font-semibold" />
            ) : content && content.kind === "scripture" ? (
              <div className="space-y-6">
                <FormattedText text={content.text} className="text-5xl font-semibold" />
                <div className="text-2xl opacity-80">{content.reference}</div>
              </div>
            ) : !hasPlayer ? (
              <div className="text-3xl opacity-60">Waiting for content…</div>
            ) : null}
          </div>
        </div>

        {/* Invisible player for audio output */}
        <div className="absolute top-0 left-0 w-[1px] h-[1px] opacity-0 pointer-events-none z-50">
          <div ref={ytContainerRef} className="w-full h-full" />
        </div>

        {/* Optional visible video overlay (currently hidden by default) */}
        {showVideoOverlay && hasPlayer ? (
          <div className="absolute top-6 left-6 w-[360px] max-w-[40vw] aspect-square rounded-xl overflow-hidden border shadow-2xl z-40" style={{ backgroundColor: "#000", borderColor: "#333" }} />
        ) : null}

        {/* Now Playing watermark */}
        {trackInfo ? (
          <div className="absolute bottom-6 left-6 z-40">
            <div className="px-4 py-2 rounded-lg border backdrop-blur bg-black/50 shadow" style={{ borderColor: "#333" }}>
              <div className="text-xs uppercase opacity-70">Now Playing</div>
              <div className="text-lg font-semibold">{trackInfo.title}</div>
              {trackInfo.author ? <div className="text-sm opacity-80">{trackInfo.author}</div> : null}
            </div>
          </div>
        ) : null}

        {/* Indicator when YouTube Music popup is open */}
        {ytmWindowRef.current && !ytmWindowRef.current.closed ? (
          <div className="absolute bottom-6 right-6 z-40">
            <div className="px-3 py-2 rounded-lg border backdrop-blur bg-black/50 shadow text-sm" style={{ borderColor: "#333" }}>
              YouTube Music window is open
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function exitPresenting() {
  try {
    if (window.opener) {
      window.close();
      return;
    }
  } catch {}
  window.location.href = "/presenting";
}

function ensureYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      const check = () => {
        if (window.YT && window.YT.Player) resolve();
        else setTimeout(check, 50);
      };
      check();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.body.appendChild(tag);
  });
}

function getOrCreateSessionId() {
  const key = "presenting-session-id";
  if (typeof localStorage !== "undefined") {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const newId = Math.random().toString(36).slice(2);
    localStorage.setItem(key, newId);
    return newId;
  }
  return Math.random().toString(36).slice(2);
}


async function fetchYouTubeMetadata(videoId: string): Promise<{ title: string; author?: string } | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title as string, author: data.author_name as string | undefined };
  } catch {
    return null;
  }
}



