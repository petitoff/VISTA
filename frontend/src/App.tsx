import { Component, createSignal, createResource, Show } from "solid-js";
import {
  api,
  type BrowseItem,
  type SearchItem,
  type SearchResult,
} from "./services/api";
import { PathBreadcrumb } from "./components/PathBreadcrumb";
import { SearchBar } from "./components/SearchBar";
import { VideoGrid } from "./components/VideoGrid";
import { VideoPlayer } from "./components/VideoPlayer";
import { FiVideo, FiHardDrive } from "solid-icons/fi";

const App: Component = () => {
  const [currentPath, setCurrentPath] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedVideo, setSelectedVideo] = createSignal<string | null>(null);

  const [browseData, { refetch }] = createResource(currentPath, api.browse);
  const [searchData] = createResource(searchQuery, async (q) => {
    if (!q) return null;
    return api.search(q);
  });

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
        items={browseData()?.items || []}
        searchResults={searchData()?.results}
        isSearching={isSearching()}
        loading={browseData.loading || (isSearching() && searchData.loading)}
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
