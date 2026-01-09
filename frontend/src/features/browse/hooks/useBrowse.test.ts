import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBrowse } from "./useBrowse";
import { createRoot, createEffect, on } from "solid-js";
import { api } from "@/api";

vi.mock("@/api", () => ({
  api: {
    browse: vi.fn(),
  },
}));

describe("useBrowse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default states", () => {
    createRoot((dispose) => {
      const { currentPath, items, page, loading } = useBrowse(50);
      expect(currentPath()).toBe("");
      expect(items()).toEqual([]);
      expect(page()).toBe(1);
      expect(loading()).toBe(false);
      dispose();
    });
  });

  it("should load data on mount and path change", async () => {
    const mockDataRoot = {
      items: [{ name: "folder", type: "directory", path: "folder" }],
      page: 1,
      totalPages: 1,
      total: 1,
    };
    const mockDataFolder = {
      items: [{ name: "video.mp4", type: "video", path: "folder/video.mp4" }],
      page: 1,
      totalPages: 1,
      total: 1,
    };

    (api.browse as any).mockImplementation((path: string) => {
      if (path === "") return Promise.resolve(mockDataRoot);
      return Promise.resolve(mockDataFolder);
    });

    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        const { items, changePath, currentPath } = useBrowse(50);

        createEffect(
          on(
            items,
            (currentItems) => {
              if (currentPath() === "" && currentItems.length > 0) {
                expect(api.browse).toHaveBeenCalledWith("", 1, 50);
                expect(currentItems).toEqual(mockDataRoot.items);
                changePath("folder");
              } else if (
                currentPath() === "folder" &&
                currentItems.length > 0
              ) {
                expect(api.browse).toHaveBeenCalledWith("folder", 1, 50);
                expect(currentItems).toEqual(mockDataFolder.items);
                dispose();
                resolve();
              }
            },
            { defer: true }
          )
        );
      });
    });
  });

  it("should handle page change", async () => {
    (api.browse as any).mockResolvedValue({
      items: [],
      page: 2,
      totalPages: 5,
      total: 250,
    });

    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        const { changePage, page } = useBrowse(50);

        // Mock global scrollTo
        window.scrollTo = vi.fn();

        changePage(2);

        createEffect(
          on(
            page,
            (p) => {
              if (p === 2) {
                expect(api.browse).toHaveBeenCalledWith("", 2, 50);
                expect(window.scrollTo).toHaveBeenCalled();
                dispose();
                resolve();
              }
            },
            { defer: true }
          )
        );
      });
    });
  });
});
