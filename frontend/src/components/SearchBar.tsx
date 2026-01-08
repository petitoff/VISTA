import { Component, createSignal, onCleanup } from "solid-js";
import { FiSearch, FiX } from "solid-icons/fi";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
}

export const SearchBar: Component<SearchBarProps> = (props) => {
  const [value, setValue] = createSignal("");
  let debounceTimer: ReturnType<typeof setTimeout>;

  const handleInput = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    setValue(target.value);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (target.value.trim()) {
        props.onSearch(target.value.trim());
      } else {
        props.onClear();
      }
    }, 300);
  };

  const handleClear = () => {
    setValue("");
    props.onClear();
  };

  onCleanup(() => clearTimeout(debounceTimer));

  const showIcon = () => !value();

  return (
    <div class="relative">
      <div
        class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-opacity duration-200 pointer-events-none"
        classList={{ "opacity-0": !showIcon(), "opacity-100": showIcon() }}
      >
        <FiSearch size={18} />
      </div>
      <input
        type="text"
        value={value()}
        onInput={handleInput}
        placeholder="Search videos by name..."
        class="search-input py-3 transition-[padding] duration-200"
        classList={{ "pl-10 pr-10": showIcon(), "pl-4 pr-10": !showIcon() }}
      />
      {value() && (
        <button
          onClick={handleClear}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-opacity duration-200"
        >
          <FiX size={18} />
        </button>
      )}
    </div>
  );
};
