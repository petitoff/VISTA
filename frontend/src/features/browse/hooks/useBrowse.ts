import { createSignal, createEffect, createMemo } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { api } from "@/api";
import type { BrowseItem, BrowseResponse } from "@/api/types";

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

  const loadData = async (path: string, pageNum: number) => {
    setLoading(true);
    try {
      const data: BrowseResponse = await api.browse(
        path,
        pageNum,
        itemsPerPage
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
    loadData(currentPath(), page());
  });

  const changePath = (path: string) => {
    setSearchParams({ path: path || undefined, page: "1" });
  };

  const changePage = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    currentPath,
    items,
    page,
    totalPages,
    total,
    loading,
    changePath,
    changePage,
  };
};
