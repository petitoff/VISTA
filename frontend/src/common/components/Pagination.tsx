import { Component, For, Show } from "solid-js";
import { FiChevronLeft, FiChevronRight } from "solid-icons/fi";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: Component<PaginationProps> = (props) => {
  const getVisiblePages = () => {
    const pages: (number | "...")[] = [];
    const current = props.currentPage;
    const total = props.totalPages;

    if (total <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push("...");
      }

      // Pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  };

  return (
    <Show when={props.totalPages > 1}>
      <div class="flex items-center justify-center gap-2 py-6">
        {/* Previous button */}
        <button
          onClick={() => props.onPageChange(props.currentPage - 1)}
          disabled={props.currentPage <= 1}
          class="p-2 hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <FiChevronLeft size={20} />
        </button>

        {/* Page numbers */}
        <For each={getVisiblePages()}>
          {(page) => (
            <Show
              when={page !== "..."}
              fallback={<span class="px-2 text-text-muted">...</span>}
            >
              <button
                onClick={() => props.onPageChange(page as number)}
                class="min-w-[40px] h-10 font-medium transition-colors"
                classList={{
                  "bg-accent text-white": props.currentPage === page,
                  "hover:bg-bg-hover": props.currentPage !== page,
                }}
              >
                {page}
              </button>
            </Show>
          )}
        </For>

        {/* Next button */}
        <button
          onClick={() => props.onPageChange(props.currentPage + 1)}
          disabled={props.currentPage >= props.totalPages}
          class="p-2 hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    </Show>
  );
};
