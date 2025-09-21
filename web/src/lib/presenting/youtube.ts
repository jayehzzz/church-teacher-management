"use client";

export function extractYouTubeVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1) || null;
    }
    if (url.hostname.includes("youtube.com")) {
      // Handle /watch?v=, /embed/, /shorts/
      const v = url.searchParams.get("v");
      if (v) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
    }
  } catch {
    // not a URL; maybe raw id
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  }
  return null;
}

export async function fetchYouTubeOEmbed(videoId: string): Promise<{ title: string; author?: string } | null> {
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


