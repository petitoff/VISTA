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
  const [totalPages, setTotalPages] = createSignal(1);
  const [total, setTotal] = createSignal(0);
  const [loading, setLoading] = createSignal(false);

  // Search state
  const [searchResults, setSearchResults] = createSignal<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = createSignal(false);

  // Load browse data
  const loadData = async (path: string, pageNum: number) => {
    setLoading(true);

    try {
      const data: BrowseResponse = await api.browse(
        path,
        pageNum,
        ITEMS_PER_PAGE
      );
      setItems(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load on path change
  createEffect(() => {
    const path = currentPath();
    loadData(path, 1);
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

  const handlePageChange = (newPage: number) => {
    loadData(currentPath(), newPage);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        currentPage={page()}
        totalPages={totalPages()}
        total={total()}
        onPageChange={handlePageChange}
        onItemClick={handleItemClick}
        onSearchResultClick={handleSearchResultClick}
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
