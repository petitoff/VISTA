import { Component, createSignal, Show } from "solid-js";
import { FiFolder, FiFilm, FiClock } from "solid-icons/fi";
import { api, type BrowseItem } from "../services/api";

interface VideoCardProps {
  item: BrowseItem;
  onClick: () => void;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const VideoCard: Component<VideoCardProps> = (props) => {
  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [imageError, setImageError] = createSignal(false);

  const isVideo = () => props.item.type === "video";

  return (
    <div class="video-card" onClick={props.onClick}>
      <Show when={isVideo()}>
        <div class="relative aspect-video bg-bg-tertiary">
          <Show when={!imageLoaded() && !imageError()}>
            <div class="absolute inset-0 loading-shimmer" />
          </Show>
          <Show when={!imageError()}>
            <img
              src={api.getThumbnailUrl(props.item.path)}
              alt={props.item.name}
              class="w-full h-full object-cover"
              classList={{ "opacity-0": !imageLoaded() }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </Show>
          <Show when={imageError()}>
            <div class="absolute inset-0 flex items-center justify-center">
              <FiFilm size={48} class="text-text-muted" />
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!isVideo()}>
        <div class="aspect-video bg-bg-tertiary flex items-center justify-center">
          <FiFolder size={64} class="text-accent" />
        </div>
      </Show>

      <div class="p-3">
        <h3 class="font-medium text-sm truncate mb-2" title={props.item.name}>
          {props.item.name}
        </h3>
        <div class="flex items-center gap-2">
          <Show when={isVideo() && props.item.size}>
            <span class="metadata-badge">{formatSize(props.item.size!)}</span>
          </Show>
          <span class="metadata-badge">{isVideo() ? "MP4" : "Folder"}</span>
        </div>
      </div>
    </div>
  );
};
