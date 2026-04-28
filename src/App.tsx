import { useState, useEffect, useCallback } from 'react'
import type { Session, Booking, Settings } from './types'
import { DEFAULT_SETTINGS } from './types'
import * as api from './api'
import StudentView from './components/StudentView'
import AdminView from './components/AdminView'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  const [tab, setTab]           = useState<'student' | 'admin'>('student')
  const [sessions, setSessions] = useState<Session[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading]   = useState(true)
  const [adminPw, setAdminPw]   = useState('')

  const refresh = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([api.getSessions(), api.getSettings()])
      // 방어적으로 배열/객체 여부 확인
      setSessions(Array.isArray(s) ? s : [])
      setSettings(st && typeof st === 'object' ? st : DEFAULT_SETTINGS)
    } catch (e) {
      console.error('refresh error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshBookings = useCallback(async (pw: string) => {
    try {
      const b = await api.getBookings(pw)
      setBookings(Array.isArray(b) ? b : [])
    } catch (e) {
      console.error('refreshBookings error:', e)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/logo.png" alt="LAST ONE" className="loading-logo" />
        <p>불러오는 중...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="page">
        <div className="top-bar">
          <div className="top-bar-logo">
            <img src="/logo.png" alt="LAST ONE" />
            <span>{settings.className}</span>
          </div>
          {tab === 'student' && (
            <button className="admin-btn" onClick={() => setTab('admin')}>
              관리자
            </button>
          )}
        </div>

        <ErrorBoundary>
          {tab === 'student' ? (
            <StudentView
              sessions={sessions}
              settings={settings}
              onBook={async (booking) => {
                const updated = await api.createBooking(booking)
                await refresh()
                return updated
              }}
            />
          ) : (
            <AdminView
              sessions={sessions}
              bookings={bookings}
              settings={settings}
              adminPw={adminPw}
              onAdminPwChange={setAdminPw}
              onBack={() => setTab('student')}
              onSessionsChange={setSessions}
              onBookingsChange={setBookings}
              onSettingsChange={setSettings}
              onRefresh={refresh}
              onRefreshBookings={() => refreshBookings(adminPw)}
            />
          )}
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}
