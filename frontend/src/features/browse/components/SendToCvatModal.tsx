import { Component, createSignal, Show } from "solid-js";
import { FiX, FiSend, FiLoader } from "solid-icons/fi";
import { api } from "@/api";
import type { SendMethod, BrowseItem } from "@/api/types";

interface SendToCvatModalProps {
    item: BrowseItem;
    onClose: () => void;
}

export const SendToCvatModal: Component<SendToCvatModalProps> = (props) => {
    const [method, setMethod] = createSignal<SendMethod>("direct");
    const [cvatProject, setCvatProject] = createSignal("cutting_line");
    const [cvatOrg, setCvatOrg] = createSignal("lanyard");
    const [modelName, setModelName] = createSignal("belt.pt");
    const [confidence, setConfidence] = createSignal(0.5);
    const [padding, setPadding] = createSignal(30);
    const [assigneeId, setAssigneeId] = createSignal("");
    const [loading, setLoading] = createSignal(false);
    const [result, setResult] = createSignal<{ success: boolean; message: string } | null>(null);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const response = await api.sendToCvat({
            videoPath: props.item.hostPath,
            method: method(),
            cvatProject: cvatProject(),
            cvatOrg: cvatOrg(),
            ...(method() === "roi" && {
                modelName: modelName(),
                confidence: confidence(),
                padding: padding(),
            }),
            ...(assigneeId() && { assigneeId: assigneeId() }),
        });

        setLoading(false);

        if (response.success) {
            setResult({
                success: true,
                message: `✓ Build queued: ${response.jobName}`,
            });
            // Auto-close after success
            setTimeout(() => props.onClose(), 2000);
        } else {
            setResult({
                success: false,
                message: response.error || "Failed to trigger build",
            });
        }
    };

    const handleOverlayClick = (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
            props.onClose();
        }
    };

    return (
        <div class="modal-overlay" onClick={handleOverlayClick}>
            <div class="modal-content w-full max-w-md">
                {/* Header */}
                <div class="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 class="text-lg font-semibold">Send to CVAT</h2>
                    <button
                        onClick={props.onClose}
                        class="text-text-muted hover:text-text-primary transition-colors"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} class="p-6 space-y-5">
                    {/* Video name */}
                    <div class="text-sm text-text-secondary truncate">
                        <span class="text-text-muted">Video:</span>{" "}
                        <span class="text-text-primary">{props.item.name}</span>
                    </div>

                    {/* Method selector */}
                    <div class="space-y-2">
                        <label class="block text-sm text-text-secondary">Method</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                class="method-button"
                                classList={{ "method-button--active": method() === "direct" }}
                                onClick={() => setMethod("direct")}
                            >
                                <span class="font-medium">Direct Upload</span>
                                <span class="text-xs text-text-muted">Full video to CVAT</span>
                            </button>
                            <button
                                type="button"
                                class="method-button"
                                classList={{ "method-button--active": method() === "roi" }}
                                onClick={() => setMethod("roi")}
                            >
                                <span class="font-medium">ROI Extraction</span>
                                <span class="text-xs text-text-muted">YOLO → frames</span>
                            </button>
                        </div>
                    </div>

                    {/* CVAT Settings */}
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm text-text-secondary mb-1">
                                Project
                            </label>
                            <input
                                type="text"
                                value={cvatProject()}
                                onInput={(e) => setCvatProject(e.currentTarget.value)}
                                class="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label class="block text-sm text-text-secondary mb-1">
                                Organization
                            </label>
                            <input
                                type="text"
                                value={cvatOrg()}
                                onInput={(e) => setCvatOrg(e.currentTarget.value)}
                                class="form-input"
                                required
                            />
                        </div>
                    </div>

                    {/* ROI-specific options */}
                    <Show when={method() === "roi"}>
                        <div class="space-y-4 pt-2 border-t border-border">
                            <div>
                                <label class="block text-sm text-text-secondary mb-1">
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    value={modelName()}
                                    onInput={(e) => setModelName(e.currentTarget.value)}
                                    class="form-input"
                                    placeholder="belt.pt"
                                />
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">
                                        Confidence
                                    </label>
                                    <input
                                        type="number"
                                        value={confidence()}
                                        onInput={(e) => setConfidence(parseFloat(e.currentTarget.value))}
                                        class="form-input"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">
                                        Padding (px)
                                    </label>
                                    <input
                                        type="number"
                                        value={padding()}
                                        onInput={(e) => setPadding(parseInt(e.currentTarget.value))}
                                        class="form-input"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Optional assignee */}
                    <div>
                        <label class="block text-sm text-text-secondary mb-1">
                            Assignee ID <span class="text-text-muted">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={assigneeId()}
                            onInput={(e) => setAssigneeId(e.currentTarget.value)}
                            class="form-input"
                            placeholder="Leave empty for no assignment"
                        />
                    </div>

                    {/* Result message */}
                    <Show when={result()}>
                        <div
                            class="px-4 py-3 text-sm"
                            classList={{
                                "bg-green-900/30 text-green-400": result()?.success,
                                "bg-red-900/30 text-red-400": !result()?.success,
                            }}
                        >
                            {result()?.message}
                        </div>
                    </Show>

                    {/* Submit */}
                    <button
                        type="submit"
                        class="w-full flex items-center justify-center gap-2 px-4 py-3 nvidia-green-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                        disabled={loading()}
                    >
                        <Show when={loading()} fallback={<FiSend size={18} />}>
                            <FiLoader size={18} class="animate-spin" />
                        </Show>
                        {loading() ? "Sending..." : "Send to CVAT"}
                    </button>
                </form>
            </div>
        </div>
    );
};
