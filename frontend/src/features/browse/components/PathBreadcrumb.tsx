import { Component, For, Show } from "solid-js";
import { FiChevronRight, FiHome } from "solid-icons/fi";

interface PathBreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export const PathBreadcrumb: Component<PathBreadcrumbProps> = (props) => {
  const segments = () => {
    if (!props.path) return [];
    return props.path.split("/").filter(Boolean);
  };

  const getPathUpTo = (index: number) => {
    return segments()
      .slice(0, index + 1)
      .join("/");
  };

  return (
    <div class="flex items-center gap-2 text-sm flex-wrap">
      <button
        class="breadcrumb-item flex items-center gap-1 hover:text-accent-hover"
        onClick={() => props.onNavigate("")}
      >
        <FiHome size={16} />
        <span>Root</span>
      </button>

      <For each={segments()}>
        {(segment, index) => (
          <>
            <FiChevronRight size={14} class="text-text-muted" />
            <button
              class="breadcrumb-item hover:text-accent-hover"
              onClick={() => props.onNavigate(getPathUpTo(index()))}
            >
              {segment}
            </button>
          </>
        )}
      </For>
    </div>
  );
};
