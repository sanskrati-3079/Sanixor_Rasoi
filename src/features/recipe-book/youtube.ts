const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/u;
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

/** Extracts the 11-character video id from a YouTube URL, or null. */
export function parseYouTubeId(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!HOSTS.has(url.hostname.toLowerCase())) return null;

  let id: string | null = null;
  if (url.hostname.toLowerCase() === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (url.pathname === "/watch") {
    id = url.searchParams.get("v");
  } else {
    const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/u);
    id = match?.[1] ?? null;
  }

  return id && VIDEO_ID.test(id) ? id : null;
}

export function youTubeEmbedUrl(id: string): string {
  return "https://www.youtube-nocookie.com/embed/" + id + "?rel=0";
}

/** A YouTube search for the dish — used when a recipe has no video. */
export function youTubeSearchUrl(title: string): string {
  return (
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(title + " recipe")
  );
}
