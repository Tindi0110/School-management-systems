import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string; // To identify which boundary failed (e.g., "Toast System", "Main Layout")
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error(`[ErrorBoundary: ${this.props.name || 'Unknown'}] caught an error:`, error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default Error UI
            return (
                <div className="p-4 m-4 border-l-4 border-red-500 bg-red-50 text-red-900 rounded shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">⚠️</span>
                        <h2 className="text-lg font-bold">Something went wrong</h2>
                    </div>
                    <p className="mb-2 font-medium">
                        {this.props.name ? `Error in ${this.props.name}` : 'A component failed to load.'}
                    </p>
                    <details className="mb-4 text-xs font-mono bg-white p-2 rounded border border-red-100 opacity-80 cursor-pointer">
                        <summary>Error Details</summary>
                        {this.state.error && this.state.error.toString()}
                    </details>
                    <button
                        onClick={this.handleRetry}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
