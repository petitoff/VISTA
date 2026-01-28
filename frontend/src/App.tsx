import { Component, Show } from "solid-js";
import { useBrowse } from "./features/browse/hooks/useBrowse";
import { useSearch } from "./features/search/hooks/useSearch";
import { useVideoPlayer } from "./features/player/hooks/useVideoPlayer";

import { AppLayout } from "./layouts/AppLayout";
import { SearchBar } from "./common/components/SearchBar";
import { PathBreadcrumb } from "./features/browse/components/PathBreadcrumb";
import { VideoGrid } from "./features/browse/components/VideoGrid";
import { VideoPlayer } from "./features/player/components/VideoPlayer";

const ITEMS_PER_PAGE = 50;

const App: Component = () => {
  const browse = useBrowse(ITEMS_PER_PAGE);
  const search = useSearch();
  const player = useVideoPlayer();

  const handleItemClick = (item: any) => {
    if (item.type === "directory") {
      search.clearSearch();
      browse.changePath(item.path);
    } else {
      player.openVideo(item.path);
    }
  };

  const handleNavigate = (path: string) => {
    search.clearSearch();
    browse.changePath(path);
  };

  return (
    <AppLayout
      searchBar={
        <SearchBar
          onSearch={search.setSearchQuery}
          onClear={search.clearSearch}
        />
      }
      breadcrumb={
        <PathBreadcrumb
          path={browse.currentPath()}
          onNavigate={handleNavigate}
        />
      }
    >
      <VideoGrid
        items={browse.items()}
        searchResults={search.searchResults()}
        isSearching={search.isSearching()}
        loading={
          browse.loading() || (search.isSearching() && search.searchLoading())
        }
        currentPage={browse.page()}
        totalPages={browse.totalPages()}
        total={browse.total()}
        onPageChange={browse.changePage}
        sortBy={browse.sortBy()}
        sortOrder={browse.sortOrder()}
        onSortChange={browse.changeSorting}
        onItemClick={handleItemClick}
        onSearchResultClick={(item) => player.openVideo(item.path)}
        onJobStarted={browse.refresh}
      />

      <Show when={player.selectedVideo()}>
        <VideoPlayer
          path={player.selectedVideo()!}
          onClose={player.closeVideo}
        />
      </Show>
    </AppLayout>
  );
};

export default App;
