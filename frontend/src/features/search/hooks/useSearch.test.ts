import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSearch } from "./useSearch";
import { createRoot, createEffect } from "solid-js";
import { api } from "@/api";

vi.mock("@/api", () => ({
  api: {
    search: vi.fn(),
  },
}));

describe("useSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty query and results", () => {
    createRoot((dispose) => {
      const { searchQuery, searchResults, searchLoading, isSearching } =
        useSearch();
      expect(searchQuery()).toBe("");
      expect(searchResults()).toEqual([]);
      expect(searchLoading()).toBe(false);
      expect(isSearching()).toBe(false);
      dispose();
    });
  });

  it("should trigger search when query changes", async () => {
    const mockResults = { results: [{ name: "test.mp4", path: "test.mp4" }] };
    (api.search as any).mockResolvedValue(mockResults);

    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        const { setSearchQuery, searchResults } = useSearch();

        setSearchQuery("test");

        createEffect(() => {
          if (searchResults().length > 0) {
            expect(api.search).toHaveBeenCalledWith("test");
            expect(searchResults()).toEqual(mockResults.results);
            dispose();
            resolve();
          }
        });
      });
    });
  });

  it("should clear search", () => {
    createRoot((dispose) => {
      const { setSearchQuery, searchQuery, clearSearch } = useSearch();
      setSearchQuery("test");
      expect(searchQuery()).toBe("test");
      clearSearch();
      expect(searchQuery()).toBe("");
      dispose();
    });
  });
});
