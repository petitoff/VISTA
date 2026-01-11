import {
  Component,
  createSignal,
  createResource,
  Show,
  onMount,
  onCleanup,
} from "solid-js";
import {
  FiX,
  FiCopy,
  FiCheck,
  FiSkipForward,
  FiSkipBack,
  FiPlay,
  FiPause,
} from "solid-icons/fi";
import { api } from "@/api";
import type { VideoMetadata } from "@/api/types";

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
  const [streamStartTime, setStreamStartTime] = createSignal(0);
  const [currentTime, setCurrentTime] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isPlaying, setIsPlaying] = createSignal(true);

  let videoRef: HTMLVideoElement | undefined;

  // Use hostPath from metadata if available, fallback to props.path
  const displayPath = () => metadata()?.hostPath || props.path;

  // Total duration from metadata
  const totalDuration = () => metadata()?.duration || 0;

  // Actual current time in the original video
  const actualTime = () => streamStartTime() + currentTime();

  // Progress percentage
  const progress = () =>
    totalDuration() > 0 ? (actualTime() / totalDuration()) * 100 : 0;

  // Generate stream URL with current start time
  const streamUrl = () => api.getStreamUrl(props.path, streamStartTime());

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(displayPath());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
    if (e.key === " ") {
      e.preventDefault();
      togglePlayPause();
    }
  };

  // Play/Pause toggle
  const togglePlayPause = () => {
    if (!videoRef) return;
    if (videoRef.paused) {
      videoRef.play();
      setIsPlaying(true);
    } else {
      videoRef.pause();
      setIsPlaying(false);
    }
  };

  // Seek to specific time by reloading the stream
  const seekTo = (targetTime: number) => {
    const clampedTime = Math.max(0, Math.min(targetTime, totalDuration()));
    console.log(`Seeking to ${clampedTime}s`);
    setIsLoading(true);
    setStreamStartTime(clampedTime);
    setCurrentTime(0);
  };

  // Handle click on custom progress bar
  const handleProgressBarClick = (e: MouseEvent) => {
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const targetTime = clickPosition * totalDuration();
    seekTo(targetTime);
  };

  // Skip forward/backward buttons
  const skipForward = () => seekTo(actualTime() + 10);
  const skipBackward = () => seekTo(actualTime() - 10);

  // Track current playback time
  const handleTimeUpdate = () => {
    if (videoRef) {
      setCurrentTime(videoRef.currentTime);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
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
          <button onClick={props.onClose} class="p-2 hover:bg-bg-hover">
            <FiX size={24} />
          </button>
        </div>

        {/* Video */}
        <div class="bg-black relative">
          {/* Loading overlay */}
          <Show when={isLoading()}>
            <div class="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div class="text-accent text-lg">Loading...</div>
            </div>
          </Show>

          <video
            ref={videoRef}
            src={streamUrl()}
            autoplay
            preload="metadata"
            class="w-full max-h-[60vh]"
            onTimeUpdate={handleTimeUpdate}
            onCanPlay={handleCanPlay}
            onLoadStart={() => setIsLoading(true)}
            onError={(e) => {
              const video = e.target as HTMLVideoElement;
              const error = video.error;
              console.error("Video error:", {
                code: error?.code,
                message: error?.message,
              });
              setIsLoading(false);
            }}
          />
        </div>

        {/* Custom Seek Controls */}
        <div class="px-4 py-3 bg-bg-secondary border-t border-border">
          {/* Progress bar */}
          <div
            class="h-2 bg-bg-tertiary cursor-pointer mb-3 relative group"
            onClick={handleProgressBarClick}
          >
            <div
              class="h-full bg-accent transition-all"
              style={{ width: `${progress()}%` }}
            />
            <div
              class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                left: `${progress()}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* Time display and skip buttons */}
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <button
                onClick={skipBackward}
                class="p-1 hover:text-accent transition-colors"
                title="Skip back 10s"
              >
                <FiSkipBack size={18} />
              </button>
              <button
                onClick={togglePlayPause}
                class="p-2 hover:text-accent transition-colors bg-bg-tertiary"
                title={isPlaying() ? "Pause" : "Play"}
              >
                {isPlaying() ? <FiPause size={20} /> : <FiPlay size={20} />}
              </button>
              <button
                onClick={skipForward}
                class="p-1 hover:text-accent transition-colors"
                title="Skip forward 10s"
              >
                <FiSkipForward size={18} />
              </button>
              <span class="text-text-secondary min-w-[100px] ml-2">
                {formatDuration(actualTime())} /{" "}
                {formatDuration(totalDuration())}
              </span>
            </div>
            <span class="text-text-muted text-xs">
              Click progress bar to seek
            </span>
          </div>
        </div>

        {/* Metadata */}
        <Show when={metadata()}>
          <div class="p-4 flex flex-wrap gap-3 border-t border-border">
            <span class="metadata-badge">
              {metadata()!.width} × {metadata()!.height}
            </span>
            <span class="metadata-badge">{metadata()!.fps} FPS</span>
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
