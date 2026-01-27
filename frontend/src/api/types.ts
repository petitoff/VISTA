export type SortBy = "name" | "date";
export type SortOrder = "asc" | "desc";

export interface BrowseItem {
  name: string;
  type: "directory" | "video";
  path: string;
  hostPath: string;
  size?: number;
  modifiedAt?: number;
  cvat?: {
    exists: boolean;
    taskId?: number;
    taskUrl?: string;
    projectName?: string;
    stage?: string;
  };
}

export interface BrowseResponse {
  path: string;
  hostPath: string;
  items: BrowseItem[];
  // Pagination
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
