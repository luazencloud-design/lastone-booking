import { useState, useEffect } from 'react'
import type { Session, Booking, Settings, AdminTab } from '../types'
import * as api from '../api'
import AdminDashboard from './AdminDashboard'
import AdminSessions from './AdminSessions'
import AdminBookings from './AdminBookings'
import AdminSettings from './AdminSettings'

interface Props {
  sessions: Session[]
  bookings: Booking[]
  settings: Settings
  adminPw: string
  onAdminPwChange: (pw: string) => void
  onBack: () => void
  onSessionsChange: (s: Session[]) => void
  onBookingsChange: (b: Booking[]) => void
  onSettingsChange: (s: Settings) => void
  onRefresh: () => Promise<void>
  onRefreshBookings: () => Promise<void>
}

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'sessions',  label: '세션 관리' },
  { id: 'bookings',  label: '신청 현황' },
  { id: 'settings',  label: '설정' },
]

export default function AdminView(props: Props) {
  const { settings, adminPw, onAdminPwChange, onBack, onRefresh, onRefreshBookings } = props
  const [unlocked, setUnlocked] = useState(Boolean(adminPw))
  const [pw, setPw]             = useState('')
  const [tab, setTab]           = useState<AdminTab>('dashboard')
  const [logging, setLogging]   = useState(false)
  const [loginErr, setLoginErr] = useState('')

  const handleLogin = async () => {
    setLogging(true); setLoginErr('')
    const ok = await api.verifyAdmin(pw)
    if (ok) {
      onAdminPwChange(pw)
      setUnlocked(true)
      setPw('')
      await Promise.all([onRefresh(), onRefreshBookings()])
    } else {
      setLoginErr('비밀번호가 틀렸습니다.')
    }
    setLogging(false)
  }

  // refresh bookings when entering admin
  useEffect(() => {
    if (unlocked && adminPw) onRefreshBookings()
  }, [unlocked])

  if (!unlocked) {
    return (
      <>
        <button className="btn btn-sm back-btn" onClick={onBack} style={{ marginBottom: 16 }}>
          ← 수강생 신청으로
        </button>
        <div className="pw-wrap">
          <img src="/logo.png" alt="LAST ONE" style={{ width: 56, height: 56, borderRadius: '50%', marginBottom: 16 }} />
          <p>관리자 전용 페이지입니다.</p>
          <input
            className="form-input"
            type="password"
            value={pw}
            placeholder="비밀번호"
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ marginBottom: 10 }}
          />
          {loginErr && <p style={{ color: '#A32D2D', fontSize: 13, marginBottom: 10 }}>{loginErr}</p>}
          <button className="btn btn-navy" onClick={handleLogin} disabled={logging}>
            {logging ? '확인 중...' : '로그인'}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ── Admin Header ──────────────────────────────────────────────── */}
      <div className="admin-header-row">
        <button className="btn btn-sm back-btn" onClick={onBack}>
          ← 수강생 신청으로
        </button>
        <button
          className="btn btn-sm"
          style={{ width: 'auto', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          onClick={() => { setUnlocked(false); onAdminPwChange('') }}
        >
          로그아웃
        </button>
      </div>

      <div className="sub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`sub-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <AdminDashboard {...props} />}
      {tab === 'sessions'  && <AdminSessions  {...props} />}
      {tab === 'bookings'  && <AdminBookings  {...props} />}
      {tab === 'settings'  && <AdminSettings  {...props} />}
    </>
  )
}
