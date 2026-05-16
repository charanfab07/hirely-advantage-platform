import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "The interface hit an unexpected rendering problem.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render failed", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
        <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            App recovery
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Something failed to load.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The app caught the problem and kept the screen usable instead of going blank.
          </p>
          {this.state.message && (
            <p className="mt-3 rounded-lg border border-border bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground break-words">
              {this.state.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: undefined });
              window.location.reload();
            }}
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}