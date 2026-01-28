import { Component, createSignal, onMount, Show } from "solid-js";
import { FiSettings, FiSave, FiCheck, FiX, FiArrowLeft } from "solid-icons/fi";
import { api } from "@/api";
import type { Settings } from "@/api/types";

export const SettingsPage: Component = () => {
    const [settings, setSettings] = createSignal<Settings | null>(null);
    const [loading, setLoading] = createSignal(true);
    const [saving, setSaving] = createSignal(false);
    const [saved, setSaved] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    // Form state
    const [cvatUrl, setCvatUrl] = createSignal("");
    const [cvatUsername, setCvatUsername] = createSignal("");
    const [cvatPassword, setCvatPassword] = createSignal("");
    const [jenkinsUrl, setJenkinsUrl] = createSignal("");
    const [jenkinsUsername, setJenkinsUsername] = createSignal("");
    const [jenkinsApiToken, setJenkinsApiToken] = createSignal("");

    onMount(async () => {
        try {
            const data = await api.getSettings();
            setSettings(data);
            setCvatUrl(data.cvatUrl || "");
            setCvatUsername(data.cvatUsername || "");
            // Password shows masked value from server
            setCvatPassword("");
            setJenkinsUrl(data.jenkinsUrl || "");
            setJenkinsUsername(data.jenkinsUsername || "");
            setJenkinsApiToken("");
        } catch (err) {
            setError("Failed to load settings");
        } finally {
            setLoading(false);
        }
    });

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);

        try {
            const updates: Partial<Settings> = {};

            // Only send values that have been modified
            if (cvatUrl()) updates.cvatUrl = cvatUrl();
            if (cvatUsername()) updates.cvatUsername = cvatUsername();
            if (cvatPassword()) updates.cvatPassword = cvatPassword();
            if (jenkinsUrl()) updates.jenkinsUrl = jenkinsUrl();
            if (jenkinsUsername()) updates.jenkinsUsername = jenkinsUsername();
            if (jenkinsApiToken()) updates.jenkinsApiToken = jenkinsApiToken();

            const updated = await api.updateSettings(updates);
            setSettings(updated);
            setSaved(true);

            // Clear password fields after save
            setCvatPassword("");
            setJenkinsApiToken("");

            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const hasExistingCvatPassword = () => settings()?.cvatPassword === "••••••••";
    const hasExistingJenkinsToken = () => settings()?.jenkinsApiToken === "••••••••";

    return (
        <div class="min-h-screen bg-bg-primary p-6">
            <div class="max-w-2xl mx-auto">
                {/* Header */}
                <div class="flex items-center gap-4 mb-8">
                    <a href="/" class="text-text-muted hover:text-accent transition-colors">
                        <FiArrowLeft size={24} />
                    </a>
                    <FiSettings size={28} class="text-accent" />
                    <h1 class="text-2xl font-bold">Settings</h1>
                </div>

                <Show when={loading()}>
                    <div class="text-text-muted">Loading settings...</div>
                </Show>

                <Show when={!loading()}>
                    <div class="space-y-8">
                        {/* CVAT Section */}
                        <section class="p-6 bg-bg-secondary border border-border">
                            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                                CVAT Integration
                                <Show when={hasExistingCvatPassword()}>
                                    <span class="text-xs px-2 py-1 bg-green-900/30 text-green-400">Configured</span>
                                </Show>
                            </h2>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">CVAT URL</label>
                                    <input
                                        type="url"
                                        value={cvatUrl()}
                                        onInput={(e) => setCvatUrl(e.currentTarget.value)}
                                        class="form-input"
                                        placeholder="http://your-cvat-server:8080"
                                    />
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm text-text-secondary mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={cvatUsername()}
                                            onInput={(e) => setCvatUsername(e.currentTarget.value)}
                                            class="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm text-text-secondary mb-1">
                                            Password
                                            <Show when={hasExistingCvatPassword()}>
                                                <span class="text-text-muted ml-1">(leave empty to keep current)</span>
                                            </Show>
                                        </label>
                                        <input
                                            type="password"
                                            value={cvatPassword()}
                                            onInput={(e) => setCvatPassword(e.currentTarget.value)}
                                            class="form-input"
                                            placeholder={hasExistingCvatPassword() ? "••••••••" : ""}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Jenkins Section */}
                        <section class="p-6 bg-bg-secondary border border-border">
                            <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                                Jenkins Integration
                                <Show when={hasExistingJenkinsToken()}>
                                    <span class="text-xs px-2 py-1 bg-green-900/30 text-green-400">Configured</span>
                                </Show>
                            </h2>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm text-text-secondary mb-1">Jenkins URL</label>
                                    <input
                                        type="url"
                                        value={jenkinsUrl()}
                                        onInput={(e) => setJenkinsUrl(e.currentTarget.value)}
                                        class="form-input"
                                        placeholder="http://your-jenkins-server:8080"
                                    />
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm text-text-secondary mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={jenkinsUsername()}
                                            onInput={(e) => setJenkinsUsername(e.currentTarget.value)}
                                            class="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm text-text-secondary mb-1">
                                            API Token
                                            <Show when={hasExistingJenkinsToken()}>
                                                <span class="text-text-muted ml-1">(leave empty to keep current)</span>
                                            </Show>
                                        </label>
                                        <input
                                            type="password"
                                            value={jenkinsApiToken()}
                                            onInput={(e) => setJenkinsApiToken(e.currentTarget.value)}
                                            class="form-input"
                                            placeholder={hasExistingJenkinsToken() ? "••••••••" : ""}
                                        />
                                    </div>
                                </div>
                                <p class="text-xs text-text-muted">
                                    Get your API token from Jenkins → Your Name → Configure → API Token
                                </p>
                            </div>
                        </section>

                        {/* Error / Success */}
                        <Show when={error()}>
                            <div class="px-4 py-3 bg-red-900/30 text-red-400 flex items-center gap-2">
                                <FiX size={18} />
                                {error()}
                            </div>
                        </Show>

                        <Show when={saved()}>
                            <div class="px-4 py-3 bg-green-900/30 text-green-400 flex items-center gap-2">
                                <FiCheck size={18} />
                                Settings saved successfully!
                            </div>
                        </Show>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving()}
                            class="w-full flex items-center justify-center gap-2 px-4 py-3 nvidia-green-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                        >
                            <FiSave size={18} />
                            {saving() ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </Show>
            </div>
        </div>
    );
};
