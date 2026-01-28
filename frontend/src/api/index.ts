import type { BrowseResponse, SearchResult, VideoMetadata, SortBy, SortOrder, SendToCvatRequest, TriggerResponse, JenkinsStatus, Settings, SettingsStatus } from "./types";

// In Docker: nginx proxies /api/* to backend
// In dev: direct connection to localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = {
  async browse(
    path: string = "",
    page: number = 1,
    limit: number = 50,
    sortBy: SortBy = "name",
    sortOrder: SortOrder = "asc"
  ): Promise<BrowseResponse> {
    const params = new URLSearchParams({
      path,
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
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

  getStreamUrl(path: string, startTime?: number): string {
    // Use transcoding stream for codec compatibility
    // Add ?start= parameter for seeking support
    const url = `${API_BASE}/stream/${encodeURIComponent(path)}`;
    return startTime && startTime > 0 ? `${url}?start=${startTime}` : url;
  },

  // Jenkins integration
  async getJenkinsStatus(): Promise<JenkinsStatus> {
    const res = await fetch(`${API_BASE}/jenkins/status`);
    if (!res.ok) return { configured: false };
    return res.json();
  },

  async sendToCvat(request: SendToCvatRequest): Promise<TriggerResponse> {
    const res = await fetch(`${API_BASE}/jenkins/trigger/send-to-cvat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      return { success: false, error: "Request failed" };
    }
    return res.json();
  },

  // Settings
  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error("Failed to get settings");
    return res.json();
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return res.json();
  },

  async getSettingsStatus(): Promise<SettingsStatus> {
    const res = await fetch(`${API_BASE}/settings/status`);
    if (!res.ok) return { cvat: false, jenkins: false };
    return res.json();
  },
};
