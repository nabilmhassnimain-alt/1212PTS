import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('React Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg">
                        <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
                        <pre className="text-xs bg-red-100 p-4 rounded overflow-auto max-h-64 text-red-800">
                            {this.state.error?.message || 'Unknown error'}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
