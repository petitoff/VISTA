import { Component, createSignal, createEffect, Show } from "solid-js";
import {
  api,
  type BrowseItem,
  type BrowseResponse,
  type SearchItem,
} from "./services/api";
import { PathBreadcrumb } from "./components/PathBreadcrumb";
import { SearchBar } from "./components/SearchBar";
import { VideoGrid } from "./components/VideoGrid";
import { VideoPlayer } from "./components/VideoPlayer";
import { FiVideo, FiHardDrive } from "solid-icons/fi";

const ITEMS_PER_PAGE = 50;

const App: Component = () => {
  const [currentPath, setCurrentPath] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedVideo, setSelectedVideo] = createSignal<string | null>(null);

  // Pagination state
  const [items, setItems] = createSignal<BrowseItem[]>([]);
  const [page, setPage] = createSignal(1);
  const [hasMore, setHasMore] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [loadingMore, setLoadingMore] = createSignal(false);

  // Search state
  const [searchResults, setSearchResults] = createSignal<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = createSignal(false);

  // Load browse data
  const loadData = async (
    path: string,
    pageNum: number,
    append: boolean = false
  ) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data: BrowseResponse = await api.browse(
        path,
        pageNum,
        ITEMS_PER_PAGE
      );

      if (append) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }

      setPage(data.page);
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load on path change
  createEffect(() => {
    const path = currentPath();
    setPage(1);
    setItems([]);
    loadData(path, 1, false);
  });

  // Search effect
  createEffect(() => {
    const query = searchQuery();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    api
      .search(query)
      .then((data) => setSearchResults(data.results))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  });

  const handleLoadMore = () => {
    if (loadingMore() || !hasMore()) return;
    loadData(currentPath(), page() + 1, true);
  };

  const handleItemClick = (item: BrowseItem) => {
    if (item.type === "directory") {
      setSearchQuery("");
      setCurrentPath(item.path);
    } else {
      setSelectedVideo(item.path);
    }
  };

  const handleSearchResultClick = (item: SearchItem) => {
    setSelectedVideo(item.path);
  };

  const handleNavigate = (path: string) => {
    setSearchQuery("");
    setCurrentPath(path);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const isSearching = () => searchQuery().length > 0;

  return (
    <div class="min-h-screen flex flex-col">
      {/* Header */}
      <header class="bg-bg-secondary border-b border-border px-6 py-4">
        <div class="flex items-center justify-between gap-6">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-accent/20 rounded-lg">
              <FiVideo size={24} class="text-accent" />
            </div>
            <div>
              <h1 class="text-xl font-bold">VISTA</h1>
              <p class="text-sm text-text-secondary">Video Dataset Browser</p>
            </div>
          </div>

          <div class="flex-1 max-w-xl">
            <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
          </div>

          <div class="flex items-center gap-2 text-sm text-text-secondary">
            <FiHardDrive size={16} />
            <span>Local Storage</span>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div class="bg-bg-secondary/50 border-b border-border px-6 py-3">
        <PathBreadcrumb path={currentPath()} onNavigate={handleNavigate} />
      </div>

      {/* Main Content */}
      <VideoGrid
        items={items()}
        searchResults={searchResults()}
        isSearching={isSearching()}
        loading={loading() || (isSearching() && searchLoading())}
        loadingMore={loadingMore()}
        hasMore={hasMore()}
        onItemClick={handleItemClick}
        onSearchResultClick={handleSearchResultClick}
        onLoadMore={handleLoadMore}
      />

      {/* Video Player Modal */}
      <Show when={selectedVideo()}>
        <VideoPlayer
          path={selectedVideo()!}
          onClose={() => setSelectedVideo(null)}
        />
      </Show>
    </div>
  );
};

export default App;
