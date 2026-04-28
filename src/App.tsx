import { useState, useEffect } from 'react'
import type { Slot, Booking, Settings, AppTab } from './types'
import { loadSlots, loadBookings, loadSettings, saveSlots, saveBookings, saveSettings } from './storage'
import BrandHeader from './components/BrandHeader'
import StudentView from './components/StudentView'
import AdminView from './components/AdminView'

export default function App() {
  const [tab, setTab] = useState<AppTab>('student')
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    setSlots(loadSlots())
    setBookings(loadBookings())
    setSettings(loadSettings())
  }, [])

  const handleSlotsChange = (next: Slot[]) => {
    setSlots(next)
    saveSlots(next)
  }

  const handleBookingsChange = (next: Booking[]) => {
    setBookings(next)
    saveBookings(next)
  }

  const handleSettingsChange = (next: Settings) => {
    setSettings(next)
    saveSettings(next)
  }

  if (!settings) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--text-muted)' }}>
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="page">
      <BrandHeader settings={settings} />

      <div className="nav-tabs">
        <button
          className={`nav-tab${tab === 'student' ? ' active' : ''}`}
          onClick={() => setTab('student')}
        >
          수강생 신청
        </button>
        <button
          className={`nav-tab${tab === 'admin' ? ' active' : ''}`}
          onClick={() => setTab('admin')}
        >
          관리자 대시보드
        </button>
      </div>

      {tab === 'student' ? (
        <StudentView
          slots={slots}
          settings={settings}
          onBook={(booking, updatedSlots) => {
            handleBookingsChange([...bookings, booking])
            handleSlotsChange(updatedSlots)
          }}
        />
      ) : (
        <AdminView
          slots={slots}
          bookings={bookings}
          settings={settings}
          onSlotsChange={handleSlotsChange}
          onBookingsChange={handleBookingsChange}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </div>
  )
}
