import { createSignal, createEffect } from "solid-js";
import { api } from "@/api";
import type { BrowseItem, BrowseResponse } from "@/api/types";

export const useBrowse = (itemsPerPage: number) => {
  const [currentPath, setCurrentPath] = createSignal("");
  const [items, setItems] = createSignal<BrowseItem[]>([]);
  const [page, setPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [total, setTotal] = createSignal(0);
  const [loading, setLoading] = createSignal(false);

  const loadData = async (path: string, pageNum: number) => {
    setLoading(true);
    try {
      const data: BrowseResponse = await api.browse(
        path,
        pageNum,
        itemsPerPage
      );
      setItems(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load browse data:", err);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    loadData(currentPath(), 1);
  });

  const changePath = (path: string) => {
    setCurrentPath(path);
  };

  const changePage = (newPage: number) => {
    loadData(currentPath(), newPage);
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
