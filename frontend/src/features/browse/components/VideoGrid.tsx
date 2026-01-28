import { Component, For, Show } from "solid-js";
import { VideoCard } from "./VideoCard";
import { SortControls } from "./SortControls";
import { Pagination } from "@/common/components/Pagination";
import type { BrowseItem, SearchItem, SortBy, SortOrder } from "@/api/types";
import { FiFolder, FiInbox } from "solid-icons/fi";

interface VideoGridProps {
  items: BrowseItem[];
  searchResults?: SearchItem[];
  isSearching: boolean;
  loading: boolean;
  // Pagination
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  // Sorting
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
  // Handlers
  onItemClick: (item: BrowseItem) => void;
  onSearchResultClick: (item: SearchItem) => void;
  onJobStarted?: () => void;
}

export const VideoGrid: Component<VideoGridProps> = (props) => {
  return (
    <div class="flex-1 overflow-auto p-6">
      {/* Loading State */}
      <Show when={props.loading}>
        <div class="thumbnail-grid">
          <For each={Array(8).fill(0)}>
            {() => (
              <div class="video-card">
                <div class="aspect-video loading-shimmer" />
                <div class="p-3 space-y-2">
                  <div class="h-4 loading-shimmer rounded w-3/4" />
                  <div class="h-3 loading-shimmer rounded w-1/2" />
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Search Results */}
      <Show when={!props.loading && props.isSearching && props.searchResults}>
        <Show
          when={props.searchResults!.length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-20 text-text-secondary">
              <FiInbox size={64} class="mb-4 text-text-muted" />
              <p class="text-lg">No videos found</p>
            </div>
          }
        >
          <div class="mb-4 text-sm text-text-secondary">
            Found {props.searchResults!.length} results
          </div>
          <div class="thumbnail-grid">
            <For each={props.searchResults}>
              {(item) => (
                <VideoCard
                  item={{
                    name: item.name,
                    type: "video",
                    path: item.path,
                    hostPath: item.hostPath,
                  }}
                  subtitle={item.directory || "Root"}
                  onClick={() => props.onSearchResultClick(item)}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* Normal Browse View */}
      <Show when={!props.loading && !props.isSearching}>
        <Show
          when={props.items.length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center py-20 text-text-secondary">
              <FiFolder size={64} class="mb-4 text-text-muted" />
              <p class="text-lg">This folder is empty</p>
            </div>
          }
        >
          {/* Header with sort controls and item count */}
          <div class="flex items-center justify-between mb-4">
            <SortControls
              sortBy={props.sortBy}
              sortOrder={props.sortOrder}
              onSortChange={props.onSortChange}
            />
            <div class="text-sm text-text-secondary">
              Showing {(props.currentPage - 1) * 50 + 1} -{" "}
              {Math.min(props.currentPage * 50, props.total)} of {props.total}{" "}
              items
            </div>
          </div>

          {/* Grid */}
          <div class="thumbnail-grid">
            <For each={props.items}>
              {(item) => (
                <VideoCard
                  item={item}
                  onClick={() => props.onItemClick(item)}
                  onJobStarted={props.onJobStarted}
                />
              )}
            </For>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={props.currentPage}
            totalPages={props.totalPages}
            onPageChange={props.onPageChange}
          />
        </Show>
      </Show>
    </div>
  );
};
