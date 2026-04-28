import type { Session, Booking, Settings } from '../types'
import * as api from '../api'

const METHOD_LABELS: Record<string, string> = {
  card: '신용/체크카드', easypay: '간편결제', transfer: '계좌이체', free: '무료',
}

interface Props {
  sessions: Session[]
  bookings: Booking[]
  settings: Settings
  adminPw: string
  onSessionsChange: (s: Session[]) => void
  onBookingsChange: (b: Booking[]) => void
  onRefresh: () => Promise<void>
}

function endTime(startTime: string, dur: number) {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + dur
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}

export default function AdminBookings({ sessions, bookings, settings, adminPw, onRefresh }: Props) {
  const totalRev = bookings.reduce((acc, bk) => {
    const s = sessions.find(x => x.id === bk.sessionId)
    return acc + (s?.price ?? 0)
  }, 0)

  const del = async (id: string) => {
    if (!confirm('이 신청을 삭제하시겠습니까?')) return
    try { await api.deleteBooking(id, adminPw); await onRefresh() }
    catch (e: any) { alert(e.message) }
  }

  if (bookings.length === 0) return <div className="empty-state">아직 신청 내역이 없습니다.</div>

  const sorted = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <div className="alert alert-blue" style={{ marginBottom: '1rem' }}>
        총 {bookings.length}건 · 예상 수입 ₩{totalRev.toLocaleString()}
      </div>
      <div className="card">
        <div className="card-title">전체 신청 내역</div>
        {sorted.map(bk => {
          const s = sessions.find(x => x.id === bk.sessionId)
          return (
            <div key={bk.id} className="bk-row">
              <div>
                <div className="bk-name">{bk.name}</div>
                <div className="bk-meta">{s ? `${s.subject} · ${s.date} ${s.startTime}–${endTime(s.startTime, s.durationMinutes)}` : '(세션 삭제됨)'}</div>
                <div className="bk-meta">
                  {bk.phone} · {METHOD_LABELS[bk.paymentMethod] ?? bk.paymentMethod}
                  {bk.paymentMethod !== 'free' && ` · ${bk.orderNumber}`}
                </div>
              </div>
              <button className="btn btn-ghost-red btn-sm" onClick={() => del(bk.id)}>삭제</button>
            </div>
          )
        })}
      </div>
    </>
  )
}
