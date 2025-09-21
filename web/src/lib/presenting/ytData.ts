"use client";

export type YouTubeSearchItem = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
};

export async function searchYouTube(query: string, maxResults = 12): Promise<YouTubeSearchItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_YT_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key missing. Set NEXT_PUBLIC_YT_API_KEY in your environment.");
  }
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    key: apiKey,
    videoEmbeddable: "true",
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const items: YouTubeSearchItem[] = (data.items || []).map((i: any) => ({
    videoId: i.id?.videoId,
    title: i.snippet?.title,
    channelTitle: i.snippet?.channelTitle,
    thumbnailUrl: i.snippet?.thumbnails?.medium?.url || i.snippet?.thumbnails?.default?.url,
  })).filter((x: any) => Boolean(x.videoId));
  return items;
}

export type YouTubePlaylistItem = YouTubeSearchItem;

export function extractPlaylistId(input: string): string | null {
  try {
    const url = new URL(input);
    if (!(url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be"))) return null;
    const list = url.searchParams.get("list");
    if (list) return list;
  } catch {
    // not a URL; ignore
  }
  return null;
}

export async function fetchPlaylistItems(playlistId: string, maxResults = 50): Promise<YouTubePlaylistItem[]> {
  const apiKey = process.env.NEXT_PUBLIC_YT_API_KEY;
  if (!apiKey) throw new Error("YouTube API key missing. Set NEXT_PUBLIC_YT_API_KEY.");
  const params = new URLSearchParams({
    part: "snippet",
    playlistId,
    maxResults: String(Math.min(maxResults, 50)),
    key: apiKey,
  });
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const items: YouTubePlaylistItem[] = (data.items || [])
    .map((i: any) => ({
      videoId: i.snippet?.resourceId?.videoId,
      title: i.snippet?.title,
      channelTitle: i.snippet?.videoOwnerChannelTitle || i.snippet?.channelTitle,
      thumbnailUrl: i.snippet?.thumbnails?.medium?.url || i.snippet?.thumbnails?.default?.url,
    }))
    .filter((x: any) => Boolean(x.videoId));
  return items;
}


