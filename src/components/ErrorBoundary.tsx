import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          maxWidth: 500, margin: '3rem auto', padding: '2rem',
          background: 'var(--red-50)', border: '1px solid var(--red-100)',
          borderRadius: 14, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--red-600)' }}>
            화면 오류가 발생했습니다
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            {this.state.error.message}
          </p>
          <button
            style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: 'var(--navy)', color: '#E6F1FB',
              cursor: 'pointer', fontSize: 14,
            }}
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          >
            새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
