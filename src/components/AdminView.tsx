import { useState } from 'react'
import type { Slot, Booking, Settings, AdminTab } from '../types'
import AdminDashboard from './AdminDashboard'
import AdminSlots from './AdminSlots'
import AdminBookings from './AdminBookings'
import AdminSettings from './AdminSettings'

interface Props {
  slots: Slot[]
  bookings: Booking[]
  settings: Settings
  onSlotsChange: (s: Slot[]) => void
  onBookingsChange: (b: Booking[]) => void
  onSettingsChange: (s: Settings) => void
}

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'slots',     label: '날짜 관리' },
  { id: 'bookings',  label: '신청 현황' },
  { id: 'settings',  label: '설정' },
]

export default function AdminView(props: Props) {
  const { settings } = props
  const [unlocked, setUnlocked]     = useState(false)
  const [pw, setPw]                 = useState('')
  const [activeTab, setActiveTab]   = useState<AdminTab>('dashboard')

  const handleLogin = () => {
    if (pw === settings.adminPassword) { setUnlocked(true); setPw('') }
    else alert('비밀번호가 틀렸습니다.')
  }

  if (!unlocked) {
    return (
      <div className="pw-wrap">
        <p>관리자 전용 페이지입니다.<br />비밀번호를 입력해주세요.</p>
        <input
          className="form-input"
          type="password"
          value={pw}
          placeholder="비밀번호"
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ marginBottom: 12 }}
        />
        <button className="btn btn-navy" onClick={handleLogin}>로그인</button>
      </div>
    )
  }

  return (
    <>
      <div className="sub-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`sub-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <AdminDashboard {...props} />}
      {activeTab === 'slots'     && <AdminSlots {...props} />}
      {activeTab === 'bookings'  && <AdminBookings {...props} />}
      {activeTab === 'settings'  && <AdminSettings {...props} />}

      <button
        className="btn btn-sm"
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', width: 'auto', marginTop: 4 }}
        onClick={() => setUnlocked(false)}
      >
        로그아웃
      </button>
    </>
  )
}
