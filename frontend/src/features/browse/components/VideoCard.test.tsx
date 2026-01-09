import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { VideoCard } from "./VideoCard";
import type { BrowseItem } from "@/api/types";

vi.mock("@/api", () => ({
  api: {
    getThumbnailUrl: vi.fn((path) => `thumbnail/${path}`),
  },
}));

describe("VideoCard", () => {
  afterEach(() => {
    cleanup();
  });

  const directoryItem: BrowseItem = {
    name: "My Folder",
    type: "directory",
    path: "my-folder",
    hostPath: "/abs/my-folder",
  };

  const videoItem: BrowseItem = {
    name: "My Video",
    type: "video",
    path: "my-video.mp4",
    hostPath: "/abs/my-video.mp4",
    size: 1024 * 1024 * 5, // 5MB
  };

  it("should render directory item", () => {
    const { getByText, queryByRole } = render(() => (
      <VideoCard item={directoryItem} onClick={() => {}} />
    ));

    expect(getByText("My Folder")).toBeDefined();
    expect(getByText("Folder")).toBeDefined();
    // Directories shouldn't have an img normally in this app (they show an icon)
    expect(queryByRole("img")).toBeNull();
  });

  it("should render video item with thumbnail", () => {
    const { getByText, getByRole } = render(() => (
      <VideoCard item={videoItem} onClick={() => {}} />
    ));

    expect(getByText("My Video")).toBeDefined();
    expect(getByText("MP4")).toBeDefined();
    expect(getByText("5.0 MB")).toBeDefined();

    const img = getByRole("img") as HTMLImageElement;
    expect(img.src).toContain("thumbnail/my-video.mp4");
  });

  it("should call onClick when clicked", () => {
    const onClick = vi.fn();
    const { getByText } = render(() => (
      <VideoCard item={videoItem} onClick={onClick} />
    ));

    getByText("My Video").click();
    expect(onClick).toHaveBeenCalled();
  });
});
