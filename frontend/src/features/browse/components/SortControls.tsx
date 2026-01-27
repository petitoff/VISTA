import { Component } from "solid-js";
import { FiArrowUp, FiArrowDown } from "solid-icons/fi";
import type { SortBy, SortOrder } from "@/api/types";

interface SortControlsProps {
    sortBy: SortBy;
    sortOrder: SortOrder;
    onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
}

export const SortControls: Component<SortControlsProps> = (props) => {
    const handleSortByChange = (e: Event) => {
        const target = e.target as HTMLSelectElement;
        props.onSortChange(target.value as SortBy, props.sortOrder);
    };

    const toggleSortOrder = () => {
        props.onSortChange(
            props.sortBy,
            props.sortOrder === "asc" ? "desc" : "asc"
        );
    };

    return (
        <div class="flex items-center gap-2">
            <label class="text-sm text-text-secondary">Sort by:</label>
            <select
                value={props.sortBy}
                onChange={handleSortByChange}
                class="bg-surface-secondary text-text-primary text-sm rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                style={{ "color-scheme": "dark" }}
            >
                <option value="name" class="bg-bg-secondary text-text-primary">Name</option>
                <option value="date" class="bg-bg-secondary text-text-primary">Date Modified</option>
            </select>
            <button
                onClick={toggleSortOrder}
                class="flex items-center gap-1 px-3 py-1.5 text-sm bg-surface-secondary text-text-primary rounded-lg border border-border hover:bg-surface-hover transition-colors"
                title={props.sortOrder === "asc" ? "Ascending" : "Descending"}
            >
                {props.sortOrder === "asc" ? (
                    <>
                        <FiArrowUp size={14} />
                        <span>Asc</span>
                    </>
                ) : (
                    <>
                        <FiArrowDown size={14} />
                        <span>Desc</span>
                    </>
                )}
            </button>
        </div>
    );
};
