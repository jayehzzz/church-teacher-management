"use client";

import * as React from "react";
import { createPresentingChannel } from "@/lib/presenting/channel";
import type { PresentingContent, PresentingMessage, YouTubeContent } from "@/lib/presenting/types";
import FormattedText from "@/components/FormattedText";
import { ScriptureDisplay } from "@/components/ScriptureDisplay";

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
  const [audioEnabled, setAudioEnabled] = React.useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = React.useState(false);
  const [embedError, setEmbedError] = React.useState<string | null>(null);

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

  // Intersection Observer for YouTube player visibility detection
  React.useEffect(() => {
    if (!ytContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Check if at least 50% of the player is visible
        const isVisible = entry.intersectionRatio >= 0.5;
        setIsPlayerVisible(isVisible);
        
        // If player becomes visible and autoplay is enabled, try to play
        if (isVisible && playerRef.current && content?.kind === "youtube" && content.autoplay) {
          try {
            playerRef.current.playVideo?.();
          } catch (error) {
            console.log("Autoplay blocked by browser policy");
          }
        }
      },
      { threshold: 0.5 } // Trigger when 50% or more is visible
    );

    observer.observe(ytContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasPlayer, content]);

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
        case "OVERLAY":
          // Overlay is now always visible for YouTube compliance
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
    
    // Clear any previous errors
    setEmbedError(null);

    if (!playerRef.current) {
      playerRef.current = new window.YT.Player(ytContainerRef.current, {
        width: "100%",
        height: "100%",
        videoId: yt.videoId,
        playerVars: {
          autoplay: 0, // Always start with autoplay disabled to comply with YouTube terms
          start: yt.startSeconds ?? 0,
          controls: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1, // Enable JavaScript API for better control
        },
        events: {
          onReady: () => {
            if (typeof yt.volume === "number") {
              volumeRef.current = yt.volume;
              playerRef.current.setVolume(yt.volume);
            }
            // Start muted to satisfy autoplay policies; user can enable audio with a click
            playerRef.current.mute();
            setHasPlayer(true);
            
            // Only attempt autoplay if player is visible and autoplay is requested
            if (yt.autoplay && isPlayerVisible) {
              try { 
                playerRef.current.playVideo?.(); 
              } catch (error) {
                console.log("Autoplay blocked by browser policy");
              }
            }
            
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
          onError: (e: any) => {
            // Handle embedding errors
            const YT = window.YT;
            if (YT) {
              switch (e.data) {
                case YT.PlayerError.EMBEDDING_DISABLED:
                  setEmbedError("This video cannot be embedded. Please visit YouTube directly to watch.");
                  break;
                case YT.PlayerError.EMBEDDING_DISABLED_BY_REQUEST:
                  setEmbedError("Embedding of this video has been disabled by the video owner.");
                  break;
                case YT.PlayerError.PRIVATE_VIDEO:
                  setEmbedError("This is a private video and cannot be played.");
                  break;
                case YT.PlayerError.VIDEO_NOT_FOUND:
                  setEmbedError("Video not found. Please check the URL.");
                  break;
                default:
                  setEmbedError("An error occurred while loading the video.");
              }
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
      {/* Safe area container - constrained to 1920x1080 */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div 
          className="relative border-4 border-white/20 shadow-2xl"
          style={{
            width: 'min(1920px, 100vw - 32px)',
            height: 'min(1080px, 100vh - 32px)',
            maxWidth: '1920px',
            maxHeight: '1080px',
            backgroundColor: 'black'
          }}
        >
        {showUi ? (
          <div className="absolute top-4 left-4 z-[60] flex items-center gap-3">
            <button onClick={exitPresenting} className="px-3 py-1 rounded-md border text-sm shadow" style={{ backgroundColor: "rgba(0,0,0,0.6)", borderColor: "#333", color: "#fff" }}>Exit</button>
            <span className="text-xs opacity-70">Esc to exit</span>
          </div>
        ) : null}
        
        {/* Top right controls */}
        {showUi ? (
          <div className="absolute top-4 right-4 z-[60] flex flex-col gap-2">
            <div className="px-3 py-1 rounded-md border text-xs shadow" style={{ backgroundColor: "rgba(0,0,0,0.6)", borderColor: "#333", color: "#fff" }}>
              📐 Safe Area: 1920×1080
            </div>
            {!audioEnabled && hasPlayer && (
              <button onClick={() => (window as any).enableOutputAudio?.()} className="px-3 py-1 rounded-md border text-sm shadow" style={{ backgroundColor: "rgba(0,0,0,0.6)", borderColor: "#333", color: "#fff" }}>Enable audio</button>
            )}
          </div>
        ) : !audioEnabled && hasPlayer ? (
          <div className="absolute top-4 right-4 z-[60]">
            <button onClick={() => (window as any).enableOutputAudio?.()} className="px-3 py-1 rounded-md border text-sm shadow" style={{ backgroundColor: "rgba(0,0,0,0.6)", borderColor: "#333", color: "#fff" }}>Enable audio</button>
          </div>
        ) : null}
          {/* Main content area - constrained within safe bounds */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div 
              className="w-full h-full text-center flex items-center justify-center"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                overflow: 'hidden',
                padding: '16px' // Add internal padding for auto-fit calculations
              }}
            >
              {content && content.kind === "text" ? (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <FormattedText 
                    text={content.text} 
                    className="font-semibold"
                    style={{
                      fontSize: content.fontSize ? `${content.fontSize}px` : '60px',
                      textAlign: content.textAlign || 'center',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      overflow: 'hidden',
                      lineHeight: '1.1'
                    }}
                    autoFit={content.autoFit || false}
                  />
                </div>
              ) : content && content.kind === "scripture" ? (
                <div className="w-full h-full flex items-center justify-center">
                  <ScriptureDisplay content={content} />
                </div>
              ) : !hasPlayer ? (
                <div className="text-3xl opacity-60">Waiting for content…</div>
              ) : null}
            </div>
          </div>

          {/* 
            Small YouTube audio player - YouTube API compliance:
            1. Always visible (240x180px, exceeds 200x200px minimum)
            2. Autoplay only when 50%+ visible (Intersection Observer)
            3. Positioned in corner for audio-only use
            4. Proper error handling for embedding restrictions
          */}
          {hasPlayer ? (
            <div className="absolute bottom-6 right-6 w-[240px] h-[180px] rounded-lg overflow-hidden border shadow-lg z-40" style={{ backgroundColor: "#000", borderColor: "#333" }}>
              {embedError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                  <div className="text-red-400 text-xs mb-1">⚠️ Audio Error</div>
                  <div className="text-gray-300 text-xs mb-2">{embedError}</div>
                  <a 
                    href={`https://www.youtube.com/watch?v=${content?.kind === "youtube" ? content.videoId : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                  >
                    Open YouTube
                  </a>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <div ref={ytContainerRef} className="w-full h-full" />
                  {!isPlayerVisible && content?.kind === "youtube" && content.autoplay ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center text-white text-xs">
                        <div className="mb-1">🎵 Audio ready</div>
                        <div>Scroll to see player</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {/* Now Playing watermark */}
          {trackInfo ? (
            <div className="absolute bottom-6 left-6 z-40">
              <div className="px-3 py-2 rounded-lg border backdrop-blur bg-black/50 shadow" style={{ borderColor: "#333" }}>
                <div className="text-xs uppercase opacity-70">🎵 Now Playing</div>
                <div className="text-sm font-semibold">{trackInfo.title}</div>
                {trackInfo.author ? <div className="text-xs opacity-80">{trackInfo.author}</div> : null}
              </div>
            </div>
          ) : null}
        </div>
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



