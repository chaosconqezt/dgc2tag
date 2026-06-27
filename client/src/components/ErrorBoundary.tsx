import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const FALLBACK_CONTENT = (
  <div className="error-boundary">
    <div className="error-boundary-icon">⚠️</div>
    <h2 className="error-boundary-title">Что-то пошло не так</h2>
    <p className="error-boundary-desc">Произошла ошибка в приложении. Попробуйте перезагрузить страницу.</p>
    <button
      onClick={() => window.location.reload()}
      className="error-boundary-btn"
    >
      Перезагрузить
    </button>
  </div>
);

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return FALLBACK_CONTENT;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
