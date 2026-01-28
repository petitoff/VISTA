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
    occurrences: Array<{
      taskId: number;
      taskUrl: string;
      projectId: number | null;
      projectName: string;
      stage?: string;
    }>;
    hasDuplicateInSameProject: boolean;
    duplicateProjectNames?: string[];
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

// Jenkins integration types
export type SendMethod = "roi" | "direct";

export interface SendToCvatRequest {
  videoPath: string;
  method: SendMethod;
  cvatProject: string;
  cvatOrg: string;
  modelName?: string;
  confidence?: number;
  padding?: number;
  assigneeId?: string;
}

export interface TriggerResponse {
  success: boolean;
  queueUrl?: string;
  error?: string;
  jobName?: string;
}

export interface JenkinsStatus {
  configured: boolean;
}

// Settings types
export interface Settings {
  cvatUrl: string | null;
  cvatUsername: string | null;
  cvatPassword: string | null;
  cvatCacheTimeoutMs: number;
  jenkinsUrl: string | null;
  jenkinsUsername: string | null;
  jenkinsApiToken: string | null;
}

export interface SettingsStatus {
  cvat: boolean;
  jenkins: boolean;
}

