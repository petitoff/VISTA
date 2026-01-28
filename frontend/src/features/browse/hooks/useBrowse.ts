import { createSignal, createEffect, createMemo, onCleanup } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { api } from "@/api";
import type { BrowseItem, BrowseResponse, SortBy, SortOrder } from "@/api/types";

const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds when processing

export const useBrowse = (itemsPerPage: number) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = createSignal<BrowseItem[]>([]);
  const [totalPages, setTotalPages] = createSignal(1);
  const [total, setTotal] = createSignal(0);
  const [loading, setLoading] = createSignal(false);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  // Derive path and page from URL params
  const currentPath = createMemo(() => {
    const path = searchParams.path;
    return Array.isArray(path) ? path[0] || "" : path || "";
  });
  const page = createMemo(() => {
    const pageParam = searchParams.page;
    const pageStr = Array.isArray(pageParam) ? pageParam[0] : pageParam;
    const p = parseInt(pageStr || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });

  // Sort settings from URL
  const sortBy = createMemo((): SortBy => {
    const param = searchParams.sortBy;
    const value = Array.isArray(param) ? param[0] : param;
    return value === "date" ? "date" : "name";
  });
  const sortOrder = createMemo((): SortOrder => {
    const param = searchParams.sortOrder;
    const value = Array.isArray(param) ? param[0] : param;
    return value === "desc" ? "desc" : "asc";
  });

  // Check if any items are processing
  const hasProcessingItems = createMemo(() =>
    items().some(item => item.processing)
  );

  const loadData = async (
    path: string,
    pageNum: number,
    sort: SortBy,
    order: SortOrder,
    silent: boolean = false
  ) => {
    if (!silent) setLoading(true);
    try {
      const data: BrowseResponse = await api.browse(
        path,
        pageNum,
        itemsPerPage,
        sort,
        order
      );
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load browse data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Manage polling based on processing items
  const startPolling = () => {
    if (pollInterval) return;
    pollInterval = setInterval(() => {
      loadData(currentPath(), page(), sortBy(), sortOrder(), true);
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  // React to URL param changes - initial load
  createEffect(() => {
    loadData(currentPath(), page(), sortBy(), sortOrder());
  });

  // Start/stop polling based on processing state
  createEffect(() => {
    if (hasProcessingItems()) {
      startPolling();
    } else {
      stopPolling();
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    stopPolling();
  });

  const changePath = (path: string) => {
    stopPolling(); // Stop polling when changing path
    setSearchParams({ path: path || undefined, page: "1" });
  };

  const changePage = (newPage: number) => {
    stopPolling(); // Stop polling when changing page
    setSearchParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeSorting = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    stopPolling(); // Stop polling when changing sorting
    setSearchParams({
      sortBy: newSortBy,
      sortOrder: newSortOrder,
      page: "1", // Reset to first page when sorting changes
    });
  };

  // Force refresh (useful after triggering a job)
  const refresh = () => {
    loadData(currentPath(), page(), sortBy(), sortOrder(), true);
  };

  return {
    currentPath,
    items,
    page,
    totalPages,
    total,
    loading,
    sortBy,
    sortOrder,
    hasProcessingItems,
    changePath,
    changePage,
    changeSorting,
    refresh,
  };
};
