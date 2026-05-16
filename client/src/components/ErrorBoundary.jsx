import React from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Don't catch postMessage errors or YouTube API errors - these are harmless
    const errorMessage = error?.message || error?.toString() || '';
    if (
      errorMessage.includes('postMessage') ||
      errorMessage.includes('YouTube player') ||
      errorMessage.includes('not attached')
    ) {
      // These are harmless warnings, don't trigger error boundary
      return null;
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Check if this is a harmless error we should ignore
    const errorMessage = error?.message || error?.toString() || '';
    if (
      errorMessage.includes('postMessage') ||
      errorMessage.includes('YouTube player') ||
      errorMessage.includes('not attached')
    ) {
      // These are harmless warnings, don't show error boundary
      console.debug('Ignoring harmless error:', errorMessage);
      return;
    }
    
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleHome = () => {
    if (this.props.navigate) {
      this.props.navigate('/');
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1763026348/Robowunder_Banner_1_qxdhb7.jpg')] bg-cover bg-center md:bg-top bg-no-repeat pt-24 pb-12">
          <div className="relative z-10 max-w-md mx-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl p-8 md:p-12 text-center">
              <div className="bg-red-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-red-500/50">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
              <p className="text-white/70 mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
                  <p className="text-red-300 text-sm font-mono break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button
                  onClick={this.handleReset}
                  className="bg-[#F58120] hover:bg-[#F58120]/90 text-white flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleHome}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks with class component
const ErrorBoundary = ({ children }) => {
  const navigate = useNavigate();
  return <ErrorBoundaryClass navigate={navigate}>{children}</ErrorBoundaryClass>;
};

export default ErrorBoundary;

