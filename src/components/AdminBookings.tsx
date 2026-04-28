import type { Slot, Booking, Settings } from '../types'

interface Props {
  slots: Slot[]
  bookings: Booking[]
  settings: Settings
  onSlotsChange: (s: Slot[]) => void
  onBookingsChange: (b: Booking[]) => void
}

export default function AdminBookings({ slots, bookings, settings, onSlotsChange, onBookingsChange }: Props) {
  const totalRev = bookings.length * settings.price

  const deleteBooking = (id: string) => {
    if (!confirm('이 신청을 삭제하시겠습니까?')) return
    const bk = bookings.find(b => b.id === id)
    if (bk) {
      onSlotsChange(slots.map(s =>
        s.id === bk.slotId && s.bookedCount > 0
          ? { ...s, bookedCount: s.bookedCount - 1 }
          : s
      ))
    }
    onBookingsChange(bookings.filter(b => b.id !== id))
  }

  if (bookings.length === 0) {
    return <div className="empty-state">아직 신청 내역이 없습니다.</div>
  }

  const sorted = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <div className="alert alert-blue" style={{ marginBottom: '1rem' }}>
        총 {bookings.length}건 · 예상 수입 ₩{totalRev.toLocaleString()}
      </div>
      <div className="card">
        <div className="card-title">전체 신청 내역</div>
        {sorted.map(bk => {
          const sl = slots.find(s => s.id === bk.slotId)
          return (
            <div key={bk.id} className="bk-row">
              <div>
                <div className="bk-name">{bk.name}</div>
                <div className="bk-meta">{bk.subject} · {bk.phone}</div>
                <div className="bk-meta">
                  {sl ? `${sl.date} ${sl.time}` : '(날짜 삭제됨)'} · 주문번호 {bk.orderNumber}
                </div>
              </div>
              <button className="btn btn-ghost-red btn-sm" onClick={() => deleteBooking(bk.id)}>삭제</button>
            </div>
          )
        })}
      </div>
    </>
  )
}
