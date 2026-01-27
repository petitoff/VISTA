import { createSignal, createEffect, createMemo } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { api } from "@/api";
import type { BrowseItem, BrowseResponse, SortBy, SortOrder } from "@/api/types";

export const useBrowse = (itemsPerPage: number) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = createSignal<BrowseItem[]>([]);
  const [totalPages, setTotalPages] = createSignal(1);
  const [total, setTotal] = createSignal(0);
  const [loading, setLoading] = createSignal(false);

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

  const loadData = async (
    path: string,
    pageNum: number,
    sort: SortBy,
    order: SortOrder
  ) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  // React to URL param changes
  createEffect(() => {
    loadData(currentPath(), page(), sortBy(), sortOrder());
  });

  const changePath = (path: string) => {
    setSearchParams({ path: path || undefined, page: "1" });
  };

  const changePage = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeSorting = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSearchParams({
      sortBy: newSortBy,
      sortOrder: newSortOrder,
      page: "1", // Reset to first page when sorting changes
    });
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
    changePath,
    changePage,
    changeSorting,
  };
};
