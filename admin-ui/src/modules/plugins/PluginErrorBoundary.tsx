import React from 'react';

interface Props {
  pluginName: string;
  componentName: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class PluginErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Plugin "${this.props.pluginName}" crashed in component "${this.props.componentName}":`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-danger bg-danger-surface p-4 my-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-danger">
                Plugin &quot;{this.props.pluginName}&quot; encountered an error
              </p>
              <p className="text-xs text-text-muted mt-1">
                Component: {this.props.componentName}
              </p>
              {this.state.error && (
                <details className="mt-2">
                  <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
                    Error details
                  </summary>
                  <pre className="mt-1 text-xs text-text-muted whitespace-pre-wrap break-words font-mono bg-surface p-2 rounded max-h-32 overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack &&
                      `\n${this.state.error.stack.split('\n').slice(1, 4).join('\n')}`}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="ml-4 shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-raised transition-colors"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PluginErrorBoundary;
