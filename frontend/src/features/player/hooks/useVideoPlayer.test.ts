import { describe, it, expect } from "vitest";
import { useVideoPlayer } from "./useVideoPlayer";
import { createRoot } from "solid-js";

describe("useVideoPlayer", () => {
  it("should initialize with no selected video", () => {
    createRoot((dispose) => {
      const { selectedVideo } = useVideoPlayer();
      expect(selectedVideo()).toBeNull();
      dispose();
    });
  });

  it("should open and close video", () => {
    createRoot((dispose) => {
      const { selectedVideo, openVideo, closeVideo } = useVideoPlayer();

      openVideo("test/path.mp4");
      expect(selectedVideo()).toBe("test/path.mp4");

      closeVideo();
      expect(selectedVideo()).toBeNull();

      dispose();
    });
  });
});
