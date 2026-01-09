import { Component, JSX } from "solid-js";
import { FiVideo, FiHardDrive } from "solid-icons/fi";

interface AppLayoutProps {
  headerRight?: JSX.Element;
  searchBar?: JSX.Element;
  breadcrumb?: JSX.Element;
  children: JSX.Element;
}

export const AppLayout: Component<AppLayoutProps> = (props) => {
  return (
    <div class="min-h-screen flex flex-col">
      {/* Header */}
      <header class="bg-bg-secondary border-b border-border px-6 py-4">
        <div class="flex items-center justify-between gap-6">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-accent/20 rounded-lg">
              <FiVideo size={24} class="text-accent" />
            </div>
            <div>
              <h1 class="text-xl font-bold">VISTA</h1>
              <p class="text-sm text-text-secondary">Video Dataset Browser</p>
            </div>
          </div>

          <div class="flex-1 max-w-xl">{props.searchBar}</div>

          <div class="flex items-center gap-2 text-sm text-text-secondary">
            {props.headerRight || (
              <>
                <FiHardDrive size={16} />
                <span>Local Storage</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb Area */}
      <div class="bg-bg-secondary/50 border-b border-border px-6 py-3">
        {props.breadcrumb}
      </div>

      {/* Main Content */}
      <main class="flex-1 flex flex-col overflow-hidden">{props.children}</main>
    </div>
  );
};
