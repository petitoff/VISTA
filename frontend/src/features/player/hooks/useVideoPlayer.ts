import { createSignal } from "solid-js";

export const useVideoPlayer = () => {
  const [selectedVideo, setSelectedVideo] = createSignal<string | null>(null);

  const openVideo = (path: string) => setSelectedVideo(path);
  const closeVideo = () => setSelectedVideo(null);

  return {
    selectedVideo,
    openVideo,
    closeVideo,
  };
};
