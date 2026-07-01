import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

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
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>Что-то пошло не так</h2>
          <p style={{ color: 'var(--text-dim)', margin: '0 0 20px' }}>
            Произошла ошибка в приложении. Попробуйте перезагрузить страницу.
          </p>
          <button style={{
            padding: '8px 20px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
          }} onClick={() => window.location.reload()}>
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
