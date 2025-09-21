"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createPresentingChannel } from "@/lib/presenting/channel";
import type { PresentingContent, PresentingMessage } from "@/lib/presenting/types";
import { extractYouTubeVideoId, fetchYouTubeOEmbed } from "@/lib/presenting/youtube";
import { useRouter } from "next/navigation";
import { searchYouTube, type YouTubeSearchItem, extractPlaylistId, fetchPlaylistItems } from "@/lib/presenting/ytData";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function PresentingControlPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = React.useState<string>(() => getOrCreateSessionId());
  const [connected, setConnected] = React.useState(false);
  const [lastPongAt, setLastPongAt] = React.useState<number | null>(null);
  const [textInput, setTextInput] = React.useState("");
  const [scriptureRef, setScriptureRef] = React.useState("");
  const [scriptureText, setScriptureText] = React.useState("");
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [volume, setVolume] = React.useState(70);
  const [muted, setMuted] = React.useState(false);
  const [status, setStatus] = React.useState<string>("Idle");
  const [ytQuery, setYtQuery] = React.useState("");
  const [ytResults, setYtResults] = React.useState<YouTubeSearchItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [playlistUrl, setPlaylistUrl] = React.useState("");
  const [queue, setQueue] = React.useState<Array<{ videoId: string; title: string; channelTitle: string }>>([]);
  const [nowPlaying, setNowPlaying] = React.useState<{ videoId: string; title: string; channelTitle: string } | null>(null);
  const [progress, setProgress] = React.useState<{ current: number; duration: number; state: "playing" | "paused" | "buffering" }>({ current: 0, duration: 0, state: "paused" });
  const channelRef = React.useRef<ReturnType<typeof createPresentingChannel> | null>(null);
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const previewPlayerRef = React.useRef<any>(null);
  const [ytReady, setYtReady] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [seeking, setSeeking] = React.useState(false);
  const [seekValue, setSeekValue] = React.useState(0);

  React.useEffect(() => {
    const channel = createPresentingChannel(sessionId);
    channelRef.current = channel;

    const unsubscribe = channel.subscribe(handleMessage);
    const heartbeat = setInterval(() => {
      channel.send({ type: "PING" });
    }, 2000);

    return () => {
      clearInterval(heartbeat);
      unsubscribe();
      channel.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  React.useEffect(() => {
    const id = setInterval(() => {
      const ok = lastPongAt && Date.now() - lastPongAt < 5000;
      setConnected(Boolean(ok));
    }, 1000);
    return () => clearInterval(id);
  }, [lastPongAt]);

  React.useEffect(() => {
    ensureYouTubeApi().then(() => setYtReady(true));
  }, []);

  React.useEffect(() => {
    try {
      const q = localStorage.getItem("presenting-queue");
      const np = localStorage.getItem("presenting-now-playing");
      if (q) setQueue(JSON.parse(q));
      if (np) setNowPlaying(JSON.parse(np));
    } catch {}
  }, []);

  React.useEffect(() => { try { localStorage.setItem("presenting-queue", JSON.stringify(queue)); } catch {} }, [queue]);
  React.useEffect(() => { try { localStorage.setItem("presenting-now-playing", JSON.stringify(nowPlaying)); } catch {} }, [nowPlaying]);

  function handleMessage(message: PresentingMessage) {
    if (message.type === "HELLO") {
      setStatus("Output connected");
      setConnected(true);
      return;
    }
    if (message.type === "READY") {
      setStatus("Output ready");
      setConnected(true);
      return;
    }
    if (message.type === "PONG") {
      setLastPongAt(Date.now());
      return;
    }
    if (message.type === "PLAYBACK_ENDED") {
      playNextInQueue();
      return;
    }
    if (message.type === "PLAYBACK_PROGRESS") {
      setProgress({ current: message.current, duration: message.duration, state: message.state });
      return;
    }
  }

  function sendContent(content: PresentingContent) {
    const channel = channelRef.current;
    if (!channel) return;
    channel.send({ type: "SET_CONTENT", content });
  }

  function showText() {
    sendContent({ kind: "text", text: textInput });
  }

  function showScripture() {
    sendContent({ kind: "scripture", reference: scriptureRef, text: scriptureText });
  }

  function showYouTube() {
    const id = extractYouTubeVideoId(youtubeUrl);
    if (!id) {
      setStatus("Invalid YouTube URL or ID");
      return;
    }
    sendContent({ kind: "youtube", videoId: id, autoplay: true, volume, muted });
    setStatus("Playing YouTube on output");
    mountOrUpdatePreview(id);
    try { previewPlayerRef.current?.playVideo?.(); } catch {}
    setNowPlaying({ videoId: id, title: "", channelTitle: "" });
    fetchYouTubeOEmbed(id).then((meta) => {
      if (meta?.title) setStatus(`Playing: ${meta.title}`);
    }).catch(() => {});
  }

  function play() { channelRef.current?.send({ type: "CONTROL", control: { type: "PLAY" } }); try { previewPlayerRef.current?.playVideo?.(); } catch {} }
  function pause() { channelRef.current?.send({ type: "CONTROL", control: { type: "PAUSE" } }); try { previewPlayerRef.current?.pauseVideo?.(); } catch {} }
  function stop() { channelRef.current?.send({ type: "CONTROL", control: { type: "STOP" } }); try { previewPlayerRef.current?.stopVideo?.(); } catch {} }
  function mute() { setMuted(true); channelRef.current?.send({ type: "CONTROL", control: { type: "MUTE" } }); try { previewPlayerRef.current?.mute?.(); } catch {} }
  function unmute() { setMuted(false); channelRef.current?.send({ type: "CONTROL", control: { type: "UNMUTE" } }); try { previewPlayerRef.current?.mute?.(); } catch {} }
  function setVol(v: number) { setVolume(v); channelRef.current?.send({ type: "CONTROL", control: { type: "VOLUME", volume: v } }); try { previewPlayerRef.current?.setVolume?.(v); previewPlayerRef.current?.mute?.(); } catch {} }
  function seek(seconds: number) { channelRef.current?.send({ type: "CONTROL", control: { type: "SEEK", seconds } }); try { previewPlayerRef.current?.seekTo?.(seconds, true); } catch {} }

  function openOutputWindow() {
    const url = new URL(window.location.origin + "/presenting/output");
    url.searchParams.set("session", sessionId);
    const win = window.open(url.toString(), "presenting-output", "noopener,noreferrer");
    if (!win) setStatus("Popup blocked. Allow popups for this site.");
  }

  function goBack() {
    router.push("/dashboard");
  }

  async function runSearch() {
    if (!ytQuery.trim()) return;
    setIsSearching(true);
    try {
      const items = await searchYouTube(ytQuery.trim());
      setYtResults(items);
      if (items.length === 0) {
        setStatus("No results found. Try a different query.");
      } else {
        setStatus(`Found ${items.length} result(s).`);
      }
    } finally {
      setIsSearching(false);
    }
  }

  function pickResult(item: YouTubeSearchItem) {
    playNow(item);
  }

  function addTopSearchResult() {
    const top = ytResults[0];
    if (top) addToQueue(top);
  }

  function addUrlToQueue() {
    const id = extractYouTubeVideoId(youtubeUrl);
    if (!id) { setStatus("Invalid YouTube URL or ID"); return; }
    fetchYouTubeOEmbed(id).then((meta) => {
      setQueue((q) => {
        if (q.some((t) => t.videoId === id)) {
          setStatus(`Already in queue: ${meta?.title || id}`);
          return q;
        }
        setStatus(`Added: ${meta?.title || id}`);
        return [...q, { videoId: id, title: meta?.title || id, channelTitle: meta?.author || "" } as any];
      });
    }).catch(() => {
      setQueue((q) => (q.some((t) => t.videoId === id) ? q : [...q, { videoId: id, title: id, channelTitle: "" } as any]));
      setStatus(`Added: ${id}`);
    });
  }

  function playNow(item: YouTubeSearchItem) {
    setNowPlaying({ videoId: item.videoId, title: item.title, channelTitle: item.channelTitle });
    setQueue((q) => q.filter((t) => t.videoId !== item.videoId));
    setYoutubeUrl(`https://www.youtube.com/watch?v=${item.videoId}`);
    sendContent({ kind: "youtube", videoId: item.videoId, autoplay: true, volume, muted });
    setStatus(`Playing: ${item.title}`);
    mountOrUpdatePreview(item.videoId);
    try { previewPlayerRef.current?.playVideo?.(); } catch {}
  }

  function playNext(item: YouTubeSearchItem) {
    setQueue((q) => {
      const filtered = q.filter((t) => t.videoId !== item.videoId);
      return [...filtered.slice(0, 1), { videoId: item.videoId, title: item.title, channelTitle: item.channelTitle }, ...filtered.slice(1)];
    });
  }

  function addToQueue(item: YouTubeSearchItem) {
    setQueue((q) => {
      if (q.some((t) => t.videoId === item.videoId)) {
        setStatus(`Already in queue: ${item.title}`);
        return q;
      }
      setStatus(`Added: ${item.title}`);
      return [...q, { videoId: item.videoId, title: item.title, channelTitle: item.channelTitle }];
    });
  }

  function playNextInQueue() {
    setQueue((q) => {
      const [next, ...rest] = q;
      if (next) {
        setNowPlaying(next);
        sendContent({ kind: "youtube", videoId: next.videoId, autoplay: true, volume, muted });
        mountOrUpdatePreview(next.videoId);
        try { previewPlayerRef.current?.playVideo?.(); } catch {}
        setStatus(`Playing: ${next.title}`);
        return rest;
      } else {
        setStatus("Queue finished");
        return q;
      }
    });
  }

  async function loadPlaylistToQueue() {
    const id = extractPlaylistId(playlistUrl);
    if (!id) { setStatus("Invalid playlist link."); return; }
    setStatus("Loading playlist…");
    try {
      const items = await fetchPlaylistItems(id, 50);
      if (items.length === 0) { setStatus("Playlist empty or unavailable."); return; }
      setQueue((q) => {
        const existing = new Set(q.map((t) => t.videoId));
        const toAdd = items.filter((i) => !existing.has(i.videoId)).map((i) => ({ videoId: i.videoId, title: i.title, channelTitle: i.channelTitle, thumbnailUrl: i.thumbnailUrl } as any));
        return [...q, ...toAdd];
      });
      setStatus(`Added ${items.length} item(s) to queue.`);
    } catch (e: any) {
      setStatus(e?.message || "Failed to load playlist.");
    }
  }

  async function playPlaylistAll() {
    const id = extractPlaylistId(playlistUrl);
    if (!id) { setStatus("Invalid playlist link."); return; }
    setStatus("Loading playlist…");
    try {
      const items = await fetchPlaylistItems(id, 50);
      if (items.length === 0) { setStatus("Playlist empty or unavailable."); return; }
      const [first, ...rest] = items;
      if (first) {
        playNow({ videoId: first.videoId, title: first.title, channelTitle: first.channelTitle, thumbnailUrl: first.thumbnailUrl } as any);
        setQueue(rest.map((i) => ({ videoId: i.videoId, title: i.title, channelTitle: i.channelTitle, thumbnailUrl: i.thumbnailUrl } as any)));
        setStatus(`Playing playlist (${items.length} items).`);
      }
    } catch (e: any) {
      setStatus(e?.message || "Failed to play playlist.");
    }
  }

  function openYtMusic() {
    channelRef.current?.send({ type: "OPEN_YTMUSIC" });
    setStatus("Opening YouTube Music on output window");
  }

  function closeYtMusic() {
    channelRef.current?.send({ type: "CLOSE_YTMUSIC" });
    setStatus("Closed YouTube Music window");
  }

  function mountOrUpdatePreview(videoId: string) {
    if (!ytReady) return;
    if (!previewRef.current) return;
    if (!window.YT || !window.YT.Player) return;
    if (!previewPlayerRef.current) {
      previewPlayerRef.current = new window.YT.Player(previewRef.current, {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            try {
              previewPlayerRef.current.mute?.();
              previewPlayerRef.current.setVolume?.(0);
            } catch {}
          },
        },
      });
    } else {
      try {
        previewPlayerRef.current.loadVideoById({ videoId });
        previewPlayerRef.current.mute?.();
      } catch {}
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Presenting Mode"
        description="Control the output shown on the external display."
        actions={
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Back</button>
            <button onClick={openOutputWindow} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', borderColor: 'var(--border)' }}>Open Output Window</button>
            <span className={`px-3 py-1 rounded-full text-sm border ${connected ? "bg-green-600/20 text-green-200 border-green-600/50" : "bg-yellow-600/20 text-yellow-200 border-yellow-600/50"}`}>{connected ? "Connected" : "Waiting"}</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="font-semibold">Text</div>
          </CardHeader>
          <CardContent>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type text here. Use **bold** for emphasis."
              className="w-full h-40 rounded-xl p-4 border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            <div className="mt-3 flex justify-end">
              <button onClick={showText} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Send to Output</button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="font-semibold">Scripture</div>
          </CardHeader>
          <CardContent>
            <input value={scriptureRef} onChange={(e) => setScriptureRef(e.target.value)} placeholder="Reference (e.g., John 3:16)"
              className="w-full rounded-xl p-3 border mb-3" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            <textarea value={scriptureText} onChange={(e) => setScriptureText(e.target.value)} placeholder="Scripture text. Use **bold** for emphasis."
              className="w-full h-32 rounded-xl p-4 border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
            <div className="mt-3 flex justify-end">
              <button onClick={showScripture} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Send to Output</button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="font-semibold">YouTube Music/Video</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1">
                <div className="text-sm opacity-80 mb-2">Search</div>
                <div className="flex gap-2">
                  <input value={ytQuery} onChange={(e) => setYtQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTopSearchResult(); } }} placeholder="Search songs/videos"
                    className="w-full rounded-xl p-3 border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                  <button onClick={runSearch} disabled={isSearching} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>{isSearching ? '...' : 'Go'}</button>
                  <button onClick={addTopSearchResult} disabled={isSearching} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Add</button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 max-h-64 overflow-auto pr-1">
                  {isSearching ? (
                    <div className="col-span-2 text-sm opacity-70">Searching…</div>
                  ) : null}
                  {ytResults.map((r) => (
                    <div key={r.videoId} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                      <img src={r.thumbnailUrl} alt="thumbnail" className="w-full aspect-video object-cover" />
                      <div className="p-2 space-y-2">
                        <div className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--foreground)' }}>{r.title}</div>
                        <div className="text-xs opacity-70 line-clamp-1">{r.channelTitle}</div>
                        <div className="flex gap-2">
                          <button onClick={() => playNow(r)} className="text-xs px-2 py-1 rounded-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Play</button>
                          <button onClick={() => playNext(r)} className="text-xs px-2 py-1 rounded-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Play Next</button>
                          <button onClick={() => addToQueue(r)} className="text-xs px-2 py-1 rounded-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Queue</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrlToQueue(); } }} placeholder="Paste YouTube link or ID"
                  className="w-full rounded-xl p-3 border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <div className="mt-3">
                  <input value={playlistUrl} onChange={(e) => setPlaylistUrl(e.target.value)} placeholder="Paste YouTube playlist link (optional)"
                    className="w-full rounded-xl p-3 border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                  <div className="mt-2 flex gap-2">
                    <button onClick={loadPlaylistToQueue} className="px-3 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Load Playlist → Queue</button>
                    <button onClick={playPlaylistAll} className="px-3 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Play All</button>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 flex flex-col gap-3 items-stretch">
                <div className="flex gap-2">
                  <button onClick={showYouTube} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', borderColor: 'var(--border)' }}>Play URL</button>
                  <button onClick={addUrlToQueue} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Add URL</button>
                  <button onClick={stop} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Stop</button>
                  <button onClick={playNextInQueue} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Next ▶</button>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-sm opacity-80 mb-2">Queue</div>
                  {nowPlaying ? (
                    <div className="mb-2 text-sm flex items-center gap-2">
                      {(nowPlaying as any).thumbnailUrl ? <img src={(nowPlaying as any).thumbnailUrl} alt="thumb" className="w-10 h-10 object-cover rounded" /> : null}
                      <div><span className="opacity-70">Now: </span><span className="font-semibold">{nowPlaying.title || nowPlaying.videoId}</span></div>
                    </div>
                  ) : null}
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {queue.length === 0 ? (
                      <div className="text-sm opacity-60">Empty</div>
                    ) : (
                      queue.map((t, idx) => (
                        <div key={t.videoId} className="flex items-center justify-between gap-2 p-1 rounded-md border" style={{ borderColor: 'var(--border)' }} draggable onDragStart={() => setDragIndex(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => { setQueue((q) => { if (dragIndex === null || dragIndex === idx) return q; const copy = q.slice(); const [moved] = copy.splice(dragIndex, 1); copy.splice(idx, 0, moved); return copy; }); setDragIndex(null); }}>
                          <div className="flex items-center gap-2 min-w-0">
                            {(t as any).thumbnailUrl ? <img src={(t as any).thumbnailUrl} className="w-10 h-10 object-cover rounded" alt="thumb" /> : null}
                            <div className="text-sm truncate">{idx + 1}. {t.title || t.videoId}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => playNow({ videoId: t.videoId, title: t.title, channelTitle: t.channelTitle, thumbnailUrl: (t as any).thumbnailUrl } as any)} className="text-xs px-2 py-1 rounded-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Play</button>
                            <button onClick={() => setQueue((q) => q.filter((_, i) => i !== idx))} className="text-xs px-2 py-1 rounded-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Remove</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={play} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Play</button>
              <button onClick={pause} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Pause</button>
              {muted ? (
                <button onClick={unmute} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Unmute</button>
              ) : (
                <button onClick={mute} className="px-4 py-2 rounded-lg font-semibold border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>Mute</button>
              )}
              <div className="flex items-center gap-2">
                <label className="text-sm opacity-80">Volume</label>
                <input type="range" min={0} max={100} value={volume} onChange={(e) => setVol(Number(e.target.value))} />
                <span className="text-sm opacity-80 w-8 text-right">{volume}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm opacity-80">Seek</label>
                <button onClick={() => seek(0)} className="px-3 py-1 rounded-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>0:00</button>
                <button onClick={() => seek(60)} className="px-3 py-1 rounded-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>1:00</button>
                <button onClick={() => seek(120)} className="px-3 py-1 rounded-md border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>2:00</button>
              </div>
              <div className="flex items-center gap-3 w-full max-w-md">
                <input type="range" min={0} max={Math.max(0, Math.floor(progress.duration || 0))} value={seeking ? seekValue : Math.floor(progress.current || 0)} onChange={(e) => { setSeeking(true); setSeekValue(Number(e.target.value)); }} onMouseUp={() => { setSeeking(false); seek(seekValue); }} onTouchEnd={() => { setSeeking(false); seek(seekValue); }} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm opacity-80">Now</label>
                <span className="text-sm tabular-nums">{formatTime(progress.current)} / {formatTime(progress.duration)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${progress.state === 'playing' ? 'bg-green-600/20 text-green-200 border-green-600/50' : progress.state === 'paused' ? 'bg-yellow-600/20 text-yellow-200 border-yellow-600/50' : 'bg-blue-600/20 text-blue-200 border-blue-600/50'}`}>{progress.state}</span>
              </div>
            </div>

            <div className="mt-3 text-sm opacity-70">{status}</div>

            <div className="mt-6">
              <div className="text-sm opacity-80 mb-2">Preview</div>
              <div className="w-full md:w-[360px] max-w-full aspect-video rounded-xl overflow-hidden border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
                <div ref={previewRef} className="w-full h-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
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

function ensureYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
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

function formatTime(seconds: number) {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const m = Math.floor(seconds / 60);
  return `${m}:${s}`;
}


