import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FONT, FS, COLORS } from './styles';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const FALLBACK_CONTENT = (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '32px',
    color: COLORS.textMuted,
    fontFamily: FONT,
  }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
    <h2 style={{ margin: '0 0 8px', color: COLORS.text, fontSize: FS, fontWeight: '600', fontFamily: FONT }}>
      Что-то пошло не так
    </h2>
    <p style={{ margin: '0 0 20px', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' }}>
      Произошла ошибка в приложении. Попробуйте перезагрузить страницу.
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{
        padding: '8px 20px',
        background: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: FS,
        fontFamily: FONT,
      }}
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
