import {
  Component,
  createSignal,
  createResource,
  Show,
  onMount,
  onCleanup,
} from "solid-js";
import { FiX, FiCopy, FiCheck } from "solid-icons/fi";
import { api, type VideoMetadata } from "../services/api";

interface VideoPlayerProps {
  path: string;
  onClose: () => void;
}

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const VideoPlayer: Component<VideoPlayerProps> = (props) => {
  const [metadata] = createResource(() => props.path, api.getMetadata);
  const [copied, setCopied] = createSignal(false);

  // Use hostPath from metadata if available, fallback to props.path
  const displayPath = () => metadata()?.hostPath || props.path;

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(displayPath());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
  };

  onMount(() => document.addEventListener("keydown", handleKeyDown));
  onCleanup(() => document.removeEventListener("keydown", handleKeyDown));

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div
        class="modal-content w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="flex items-center justify-between p-4 border-b border-border">
          <div class="flex-1 min-w-0 mr-4">
            <h2 class="font-semibold truncate mb-1">
              {props.path.split("/").pop()}
            </h2>
            <div class="flex items-center gap-2 text-sm text-text-secondary">
              <span class="truncate">{displayPath()}</span>
              <button
                onClick={handleCopyPath}
                class="flex-shrink-0 p-1 hover:text-accent"
                title="Copy path"
              >
                {copied() ? <FiCheck size={14} /> : <FiCopy size={14} />}
              </button>
            </div>
          </div>
          <button
            onClick={props.onClose}
            class="p-2 hover:bg-bg-hover rounded-lg"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Video */}
        <div class="bg-black relative">
          <video
            src={api.getStreamUrl(props.path)}
            controls
            autoplay
            preload="metadata"
            class="w-full max-h-[60vh]"
            onError={(e) => {
              const video = e.target as HTMLVideoElement;
              const error = video.error;
              console.error("Video error:", {
                code: error?.code,
                message: error?.message,
                MEDIA_ERR_ABORTED: error?.code === 1,
                MEDIA_ERR_NETWORK: error?.code === 2,
                MEDIA_ERR_DECODE: error?.code === 3,
                MEDIA_ERR_SRC_NOT_SUPPORTED: error?.code === 4,
              });
            }}
            onLoadStart={() => console.log("Video: loading started")}
            onCanPlay={() => console.log("Video: can play")}
            onWaiting={() => console.log("Video: waiting for data")}
          />
        </div>

        {/* Metadata */}
        <Show when={metadata()}>
          <div class="p-4 flex flex-wrap gap-3">
            <span class="metadata-badge">
              {metadata()!.width} × {metadata()!.height}
            </span>
            <span class="metadata-badge">{metadata()!.fps} FPS</span>
            <span class="metadata-badge">
              {formatDuration(metadata()!.duration)}
            </span>
            <span class="metadata-badge">{formatSize(metadata()!.size)}</span>
            <span class="metadata-badge">
              {metadata()!.codec.toUpperCase()}
            </span>
          </div>
        </Show>
      </div>
    </div>
  );
};
