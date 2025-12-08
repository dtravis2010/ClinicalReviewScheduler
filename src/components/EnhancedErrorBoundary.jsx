import { Component } from 'react';
import { logger } from '../utils/logger';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * Enhanced Error Boundary with recovery options
 * Catches React errors and provides user-friendly error UI
 */
export default class EnhancedErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    logger.error('React Error Boundary caught error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  handleTryAgain = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      const { error, errorInfo, errorCount } = this.state;

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error Message */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Something went wrong
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  We're sorry, but something unexpected happened. You can try one of the options below to recover.
                </p>
                {errorCount > 1 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    This error has occurred {errorCount} times. Consider reloading the page.
                  </p>
                )}
              </div>

              {/* Recovery Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={this.handleTryAgain}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-thr-blue-500 dark:hover:border-thr-blue-500 hover:bg-thr-blue-50 dark:hover:bg-thr-blue-900/20 transition-all group"
                >
                  <RefreshCw className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-thr-blue-600 dark:group-hover:text-thr-blue-400" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Try Again</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Attempt to recover
                  </span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-thr-green-500 dark:hover:border-thr-green-500 hover:bg-thr-green-50 dark:hover:bg-thr-green-900/20 transition-all group"
                >
                  <RefreshCw className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-thr-green-600 dark:group-hover:text-thr-green-400" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Reload Page</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Fresh start
                  </span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-thr-purple-500 dark:hover:border-thr-purple-500 hover:bg-thr-purple-50 dark:hover:bg-thr-purple-900/20 transition-all group"
                >
                  <Home className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-thr-purple-600 dark:group-hover:text-thr-purple-400" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Go Home</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Return to dashboard
                  </span>
                </button>
              </div>

              {/* Developer Info (only in development) */}
              {isDev && error && (
                <details className="mt-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Developer Information
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Error:</h3>
                      <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-lg overflow-auto">
                        {error.toString()}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Component Stack:</h3>
                        <pre className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-300 p-3 rounded-lg overflow-auto max-h-64">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
