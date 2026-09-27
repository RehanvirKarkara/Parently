import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || "Something went wrong." };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center bg-background bg-mesh-primary p-6 text-center"
      >
        <div className="w-full max-w-md rounded-[1.5rem] border border-border/70 bg-card/95 p-7 text-left shadow-soft-lg">
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.025em]">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{this.state.message}</p>
          <Button onClick={this.handleReload} className="mt-6">Reload page</Button>
        </div>
      </div>
    );
  }
}
