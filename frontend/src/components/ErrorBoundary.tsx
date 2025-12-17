'use client';
import { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                We're sorry, but an unexpected error has occurred. Our team has been notified.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
                <Link
                  href="/"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-center"
                >
                  Go to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
