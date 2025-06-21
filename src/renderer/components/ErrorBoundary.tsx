import * as React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { debugLog } from '../utils/debugLog';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolateErrors?: boolean; // Whether to isolate errors to this boundary
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error details (in production, send to monitoring service)
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.retryCount,
    };

    // Enhanced debug logging
    debugLog('RENDER_ERROR', errorDetails);

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Details:', errorDetails);
      console.groupEnd();
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, errorDetails);
      
      // For now, log sanitized version
      console.error('[ErrorBoundary]', {
        message: error.message,
        errorId: this.state.errorId,
        timestamp: errorDetails.timestamp,
      });
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private renderErrorFallback() {
    const { error } = this.state;
    
    if (this.props.fallback) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={error!} retry={this.handleRetry} />;
    }

    const canRetry = this.retryCount < this.maxRetries;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We apologize for the inconvenience. An unexpected error occurred.
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h4 className="text-sm font-semibold text-red-800 mb-2">
                  Error Details (Development Mode)
                </h4>
                <p className="text-xs font-mono text-red-700 break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {this.state.errorId && (
              <p className="mt-4 text-xs text-gray-500">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Try Again ({this.maxRetries - this.retryCount} attempts left)
              </button>
            )}

            <button
              onClick={this.handleReload}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Reload Application
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support with the error ID above.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error reporting in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    
    // Log the error
    debugLog('FUNCTIONAL_COMPONENT_ERROR', { message: error.message, stack: error.stack });
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // errorTrackingService.captureException(error);
    }
  }, []);

  // Throw error to be caught by nearest error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;
