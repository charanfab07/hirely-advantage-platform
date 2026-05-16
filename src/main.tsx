import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AppErrorBoundary } from "./components/AppErrorBoundary.tsx";

const rootElement = document.getElementById("root");

function renderStartupError(error: unknown) {
  const message = error instanceof Error ? error.message : "The app could not start.";
  if (!rootElement) return;

  rootElement.innerHTML = `
    <main class="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
      <section class="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <p class="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">App recovery</p>
        <h1 class="mt-2 text-2xl font-semibold tracking-tight">Something failed to load.</h1>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">The app caught a startup problem instead of showing a blank white screen.</p>
        <p class="mt-3 rounded-lg border border-border bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground break-words"></p>
        <button type="button" class="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">Reload app</button>
      </section>
    </main>
  `;

  rootElement.querySelector("p:last-of-type")!.textContent = message;
  rootElement.querySelector("button")?.addEventListener("click", () => window.location.reload());
}

window.addEventListener("error", (event) => {
  const isBlank = rootElement && rootElement.childElementCount === 0;
  if (isBlank) renderStartupError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  const isBlank = rootElement && rootElement.childElementCount === 0;
  if (isBlank) renderStartupError(event.reason);
});

try {
  if (!rootElement) throw new Error("Missing root element.");

  createRoot(rootElement).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>,
  );
} catch (error) {
  console.error("App startup failed", error);
  renderStartupError(error);
}
