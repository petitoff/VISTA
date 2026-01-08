import { Component, For, Show, onMount, onCleanup } from "solid-js";
import { VideoCard } from "./VideoCard";
import type { BrowseItem, SearchItem } from "../services/api";
import { FiFolder, FiFilm, FiInbox, FiLoader } from "solid-icons/fi";

interface VideoGridProps {
  items: BrowseItem[];
  searchResults?: SearchItem[];
  isSearching: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onItemClick: (item: BrowseItem) => void;
  onSearchResultClick: (item: SearchItem) => void;
  onLoadMore: () => void;
}

export const VideoGrid: Component<VideoGridProps> = (props) => {
  let scrollRef: HTMLDivElement | undefined;

  const handleScroll = () => {
    if (!scrollRef) return;
    if (
      props.loading ||
      props.loadingMore ||
      !props.hasMore ||
      props.isSearching
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef;
    // Load more when 300px from bottom
    if (scrollHeight - scrollTop - clientHeight < 300) {
      console.log("Loading more...", { scrollTop, scrollHeight, clientHeight });
      props.onLoadMore();
    }
  };

  onMount(() => {
    if (scrollRef) {
      scrollRef.addEventListener("scroll", handleScroll);
    }
  });

  onCleanup(() => {
    if (scrollRef) {
      scrollRef.removeEventListener("scroll", handleScroll);
    }
  });

  return (
    <div ref={scrollRef} class="flex-1 overflow-auto p-6">
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
          <div class="space-y-2">
            <For each={props.searchResults}>
              {(item) => (
                <div
                  class="folder-item"
                  onClick={() => props.onSearchResultClick(item)}
                >
                  <FiFilm size={20} class="text-accent flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{item.name}</p>
                    <p class="text-sm text-text-secondary truncate">
                      {item.directory || "Root"}
                    </p>
                  </div>
                </div>
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
          <div class="thumbnail-grid">
            <For each={props.items}>
              {(item) => (
                <VideoCard
                  item={item}
                  onClick={() => props.onItemClick(item)}
                />
              )}
            </For>
          </div>

          {/* Load More Indicator */}
          <Show when={props.loadingMore}>
            <div class="flex items-center justify-center py-8">
              <FiLoader size={24} class="animate-spin text-accent" />
              <span class="ml-2 text-text-secondary">Loading more...</span>
            </div>
          </Show>

          {/* Manual Load More Button as fallback */}
          <Show when={!props.loadingMore && props.hasMore}>
            <div class="flex items-center justify-center py-6">
              <button
                onClick={() => props.onLoadMore()}
                class="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
              >
                Load More
              </button>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
};
