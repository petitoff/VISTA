import { createSignal, createEffect } from "solid-js";
import { api } from "@/api";
import type { SearchItem } from "@/api/types";

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = createSignal(false);

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

  const clearSearch = () => setSearchQuery("");
  const isSearching = () => searchQuery().length > 0;

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    clearSearch,
    isSearching,
  };
};
