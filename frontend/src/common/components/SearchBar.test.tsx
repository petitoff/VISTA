import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("should render correctly", () => {
    const { getByPlaceholderText } = render(() => (
      <SearchBar onSearch={() => {}} onClear={() => {}} />
    ));
    expect(getByPlaceholderText("Search videos by name...")).toBeDefined();
  });

  it("should debounce search input", () => {
    const onSearch = vi.fn();
    const { getByPlaceholderText } = render(() => (
      <SearchBar onSearch={onSearch} onClear={() => {}} />
    ));

    const input = getByPlaceholderText(
      "Search videos by name..."
    ) as HTMLInputElement;
    fireEvent.input(input, { target: { value: "test" } });

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith("test");
  });

  it("should call onClear when input is emptied", () => {
    const onClear = vi.fn();
    const { getByPlaceholderText } = render(() => (
      <SearchBar onSearch={() => {}} onClear={onClear} />
    ));

    const input = getByPlaceholderText(
      "Search videos by name..."
    ) as HTMLInputElement;
    fireEvent.input(input, { target: { value: "test" } });
    fireEvent.input(input, { target: { value: "" } });

    vi.advanceTimersByTime(300);
    expect(onClear).toHaveBeenCalled();
  });

  it("should clear input when X button is clicked", () => {
    const onClear = vi.fn();
    const { getByPlaceholderText, getByRole } = render(() => (
      <SearchBar onSearch={() => {}} onClear={onClear} />
    ));

    const input = getByPlaceholderText(
      "Search videos by name..."
    ) as HTMLInputElement;
    fireEvent.input(input, { target: { value: "test" } });

    // The X button should appear
    const clearButton = document.querySelector("button");
    expect(clearButton).toBeDefined();

    fireEvent.click(clearButton!);
    expect(input.value).toBe("");
    expect(onClear).toHaveBeenCalled();
  });
});
