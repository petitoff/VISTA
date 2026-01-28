import { Component, createSignal, For, Show } from "solid-js";
import { FiFolder, FiFilm, FiExternalLink, FiUpload, FiAlertTriangle, FiLoader } from "solid-icons/fi";
import { api } from "@/api";
import type { BrowseItem } from "@/api/types";
import { SendToCvatModal } from "./SendToCvatModal";

interface VideoCardProps {
  item: BrowseItem;
  onClick: () => void;
  subtitle?: string;
  onJobStarted?: () => void;
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
  const [showSendModal, setShowSendModal] = createSignal(false);

  const isVideo = () => props.item.type === "video";
  const hasCvat = () => props.item.cvat?.exists;
  const hasDuplicate = () => props.item.cvat?.hasDuplicateInSameProject;
  const occurrences = () => props.item.cvat?.occurrences || [];
  const isProcessing = () => !!props.item.processing;

  // Get unique project names
  const uniqueProjects = () => {
    const projects = occurrences().map((o) => o.projectName);
    return [...new Set(projects)];
  };

  const handleCvatClick = (e: MouseEvent) => {
    e.stopPropagation();
    // Open first occurrence
    const firstOcc = occurrences()[0];
    if (firstOcc?.taskUrl) {
      window.open(firstOcc.taskUrl, "_blank");
    }
  };

  const handleSendClick = (e: MouseEvent) => {
    e.stopPropagation();
    setShowSendModal(true);
  };

  return (
    <>
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
            {/* CVAT/Processing Status Badges - in dark overlay strip at bottom */}
            <Show when={isVideo() && props.item.cvat}>
              <div class="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-2 py-1.5 flex gap-1 items-center justify-end">
                {/* Duplicate Warning */}
                <Show when={hasDuplicate()}>
                  <div
                    class="cvat-badge cvat-badge--warning"
                    title={`⚠️ Duplikat w projekcie: ${props.item.cvat?.duplicateProjectNames?.join(", ")}`}
                  >
                    <FiAlertTriangle size={14} />
                  </div>
                </Show>
                <Show when={hasCvat()}>
                  <button
                    class="cvat-badge cvat-badge--exists"
                    onClick={handleCvatClick}
                    title={`Open in CVAT (${occurrences().length} task${occurrences().length > 1 ? "s" : ""})`}
                  >
                    <span>CVAT</span>
                    <Show when={occurrences().length > 1}>
                      <span class="text-xs">({occurrences().length})</span>
                    </Show>
                    <FiExternalLink size={12} />
                  </button>
                </Show>
                {/* Processing badge */}
                <Show when={isProcessing()}>
                  <div
                    class="cvat-badge cvat-badge--processing"
                    title={`Processing: ${props.item.processing?.jobName}`}
                  >
                    <FiLoader size={12} class="animate-spin" />
                    <span>Processing</span>
                  </div>
                </Show>
                {/* Send to CVAT button - only show when not in CVAT and not processing */}
                <Show when={!hasCvat() && !isProcessing()}>
                  <button
                    class="cvat-badge cvat-badge--send"
                    onClick={handleSendClick}
                    title="Send to CVAT"
                  >
                    <FiUpload size={12} />
                    <span>Send to CVAT</span>
                  </button>
                </Show>
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
          <h3 class="font-medium text-sm truncate mb-1" title={props.item.name}>
            {props.item.name}
          </h3>
          <Show when={props.subtitle}>
            <p
              class="text-xs text-text-secondary truncate mb-2"
              title={props.subtitle}
            >
              {props.subtitle}
            </p>
          </Show>
          {/* CVAT Projects List */}
          <Show when={hasCvat() && uniqueProjects().length > 0}>
            <div class="mb-2">
              <For each={uniqueProjects()}>
                {(projectName) => (
                  <p class="text-xs text-accent truncate" title={projectName}>
                    📁 {projectName}
                  </p>
                )}
              </For>
            </div>
          </Show>
          <div class="flex items-center gap-2 flex-wrap">
            <Show when={isVideo() && props.item.size}>
              <span class="metadata-badge">{formatSize(props.item.size!)}</span>
            </Show>
            <span class="metadata-badge">{isVideo() ? "MP4" : "Folder"}</span>
            {/* Show first occurrence stage */}
            <Show when={hasCvat() && occurrences()[0]?.stage}>
              <span class="metadata-badge metadata-badge--cvat">{occurrences()[0]?.stage}</span>
            </Show>
          </div>
        </div>
      </div>

      {/* Send to CVAT Modal */}
      <Show when={showSendModal()}>
        <SendToCvatModal
          item={props.item}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false);
            props.onJobStarted?.();
          }}
        />
      </Show>
    </>
  );
};
