import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render failed", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            App recovery
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Something failed to load.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Refresh the page to reconnect. The app now shows this recovery screen instead of a blank page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}