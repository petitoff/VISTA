export class BrowseResponseDto {
  path: string;
  hostPath: string; // Real path on host for display
  items: BrowseItemDto[];
  // Pagination
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class BrowseItemDto {
  name: string;
  type: 'directory' | 'video';
  path: string;
  hostPath: string; // Real path on host for display
  size?: number;
}

export class VideoMetadataDto {
  path: string;
  hostPath: string; // Real path on host for display
  filename: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

export class SearchResultDto {
  query: string;
  total: number;
  results: SearchItemDto[];
}

export class SearchItemDto {
  name: string;
  path: string;
  hostPath: string; // Real path on host for display
  directory: string;
}
