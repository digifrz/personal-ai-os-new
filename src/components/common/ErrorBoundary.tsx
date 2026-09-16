import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] w-full flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-[var(--color-surface)] p-8 text-center shadow-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-base font-bold text-[var(--color-text)] sm:text-lg">
            {this.props.fallbackTitle || 'Something interrupted this view'}
          </h2>
          <p className="mt-1.5 max-w-md text-xs text-[var(--color-muted)] leading-relaxed">
            {this.state.error?.message || 'A runtime error occurred. Other parts of the system remain intact.'}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry / Recover</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
