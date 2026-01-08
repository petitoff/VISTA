// In Docker: nginx proxies /api/* to backend
// In dev: direct connection to localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface BrowseItem {
  name: string;
  type: "directory" | "video";
  path: string;
  hostPath: string;
  size?: number;
}

export interface BrowseResponse {
  path: string;
  hostPath: string;
  items: BrowseItem[];
}

export interface VideoMetadata {
  path: string;
  hostPath: string;
  filename: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

export interface SearchResult {
  query: string;
  total: number;
  results: SearchItem[];
}

export interface SearchItem {
  name: string;
  path: string;
  hostPath: string;
  directory: string;
}

export const api = {
  async browse(path: string = ""): Promise<BrowseResponse> {
    const res = await fetch(
      `${API_BASE}/videos/browse?path=${encodeURIComponent(path)}`
    );
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
