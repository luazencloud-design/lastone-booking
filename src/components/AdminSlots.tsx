import { useState } from 'react'
import type { Slot, Booking, Settings, SlotForm } from '../types'

interface Props {
  slots: Slot[]
  bookings: Booking[]
  settings: Settings
  onSlotsChange: (s: Slot[]) => void
  onBookingsChange: (b: Booking[]) => void
}

const EMPTY: SlotForm = { date: '', time: '', capacity: '5' }

export default function AdminSlots({ slots, bookings, onSlotsChange, onBookingsChange }: Props) {
  const [form, setForm] = useState<SlotForm>(EMPTY)

  const addSlot = () => {
    if (!form.date || !form.time) { alert('날짜와 시간을 입력해주세요.'); return }
    const cap = parseInt(form.capacity)
    if (!cap || cap < 1) { alert('정원을 올바르게 입력해주세요.'); return }
    onSlotsChange([...slots, {
      id:          'sl_' + Date.now(),
      date:        form.date,
      time:        form.time,
      capacity:    cap,
      bookedCount: 0,
    }])
    setForm(EMPTY)
  }

  const deleteSlot = (id: string) => {
    if (!confirm('삭제하면 해당 신청도 함께 삭제됩니다. 계속할까요?')) return
    onSlotsChange(slots.filter(s => s.id !== id))
    onBookingsChange(bookings.filter(b => b.slotId !== id))
  }

  const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      {/* ── Add Slot ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">날짜 추가</div>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div>
            <label className="form-label">날짜</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">시간</label>
            <input className="form-input" type="time" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">정원 (최대 인원)</label>
          <input className="form-input" type="number" min="1" max="100" value={form.capacity}
            onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
        </div>
        <button className="btn btn-navy" onClick={addSlot}>+ 날짜 추가</button>
      </div>

      {/* ── Slot List ───────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="empty-state">등록된 날짜가 없습니다.</div>
      ) : (
        <div className="card">
          <div className="card-title">등록된 날짜 ({sorted.length}개)</div>
          {sorted.map(sl => {
            const rem = sl.capacity - sl.bookedCount
            const full = rem <= 0
            const few  = rem <= 1 && !full
            const badgeClass = full ? 'badge badge-red' : few ? 'badge badge-amber' : 'badge badge-green'
            return (
              <div key={sl.id} className="bk-row">
                <div>
                  <div className="bk-name">{sl.date} <span style={{ fontWeight: 400 }}>{sl.time}</span></div>
                  <div className="bk-meta">정원 {sl.capacity}명 · 신청 {sl.bookedCount}명</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={badgeClass}>{full ? '마감' : `잔여 ${rem}석`}</span>
                  <button className="btn btn-ghost-red btn-sm" onClick={() => deleteSlot(sl.id)}>삭제</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
