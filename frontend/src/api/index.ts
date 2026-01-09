import type { BrowseResponse, SearchResult, VideoMetadata } from "./types";

// In Docker: nginx proxies /api/* to backend
// In dev: direct connection to localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = {
  async browse(
    path: string = "",
    page: number = 1,
    limit: number = 50
  ): Promise<BrowseResponse> {
    const params = new URLSearchParams({
      path,
      page: String(page),
      limit: String(limit),
    });
    const res = await fetch(`${API_BASE}/videos/browse?${params}`);
    if (!res.ok) throw new Error("Failed to browse");
    return res.json();
  },

  async search(query: string): Promise<SearchResult> {
    const res = await fetch(
      `${API_BASE}/videos/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error("Failed to search");
    return res.json();
  },

  async getMetadata(path: string): Promise<VideoMetadata> {
    const res = await fetch(
      `${API_BASE}/videos/metadata/${encodeURIComponent(path)}`
    );
    if (!res.ok) throw new Error("Failed to get metadata");
    return res.json();
  },

  getThumbnailUrl(path: string): string {
    return `${API_BASE}/thumbnails/${encodeURIComponent(path)}`;
  },

  getStreamUrl(path: string): string {
    return `${API_BASE}/stream/${encodeURIComponent(path)}`;
  },
};
