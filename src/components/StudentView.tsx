import { useState } from 'react'
import type { Slot, Booking, Settings, StudentStep, StudentForm } from '../types'

interface Props {
  slots: Slot[]
  settings: Settings
  onBook: (booking: Booking, updatedSlots: Slot[]) => void
}

const EMPTY_FORM: StudentForm = { name: '', phone: '', subject: '', orderNumber: '' }

function Steps({ current }: { current: StudentStep }) {
  const labels: [StudentStep, string][] = [[1, '날짜 선택'], [2, '정보 입력'], [3, '결제 완료']]
  return (
    <div className="steps">
      {labels.map(([n, label], i) => {
        const cls = current > n ? 'done' : current === n ? 'active' : 'idle'
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div className={`step-num ${cls}`}>{current > n ? '✓' : n}</div>
            <span className="step-label">{label}</span>
            {i < 2 && <div className="step-line" />}
          </div>
        )
      })}
    </div>
  )
}

function getBarColor(slot: Slot): string {
  const full = slot.bookedCount >= slot.capacity
  const few  = slot.bookedCount >= slot.capacity * 0.7 && !full
  return full ? '#E24B4A' : few ? '#BA7517' : '#185FA5'
}

function getBadgeClass(slot: Slot): string {
  const full = slot.bookedCount >= slot.capacity
  const few  = slot.bookedCount >= slot.capacity * 0.7 && !full
  return full ? 'badge badge-red' : few ? 'badge badge-amber' : 'badge badge-green'
}

function getRemainingLabel(slot: Slot): string {
  const full = slot.bookedCount >= slot.capacity
  return full ? '마감' : `잔여 ${slot.capacity - slot.bookedCount}석`
}

export default function StudentView({ slots, settings, onBook }: Props) {
  const [step, setStep] = useState<StudentStep>(1)
  const [selSlotId, setSelSlotId] = useState<string | null>(null)
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM)
  const [done, setDone] = useState(false)
  const [doneBooking, setDoneBooking] = useState<Booking | null>(null)

  const sortedSlots = [...slots].sort((a, b) => a.date.localeCompare(b.date))
  const selSlot = slots.find(s => s.id === selSlotId) ?? null

  const reset = () => {
    setStep(1); setSelSlotId(null); setForm(EMPTY_FORM); setDone(false); setDoneBooking(null)
  }

  const handleStep2 = () => {
    if (!selSlotId) return
    setStep(2)
  }

  const handleStep3 = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.subject.trim()) {
      alert('모든 항목을 입력해주세요.')
      return
    }
    setStep(3)
  }

  const handleSubmit = () => {
    if (!form.orderNumber.trim()) { alert('주문번호를 입력해주세요.'); return }
    if (!selSlot) { alert('날짜를 다시 선택해주세요.'); return }
    if (selSlot.bookedCount >= selSlot.capacity) {
      alert('이미 마감된 날짜입니다. 다른 날짜를 선택해주세요.')
      return
    }

    const booking: Booking = {
      id:          'bk_' + Date.now(),
      slotId:      selSlot.id,
      name:        form.name,
      phone:       form.phone,
      subject:     form.subject,
      orderNumber: form.orderNumber,
      createdAt:   new Date().toISOString(),
    }

    const updatedSlots = slots.map(s =>
      s.id === selSlot.id ? { ...s, bookedCount: s.bookedCount + 1 } : s
    )

    onBook(booking, updatedSlots)
    setDoneBooking(booking)
    setDone(true)
  }

  // ── Success Screen ────────────────────────────────────────────────────────
  if (done && doneBooking) {
    return (
      <div className="card">
        <div className="success-wrap">
          <div className="success-icon">✓</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>신청이 완료되었습니다</p>
          {selSlot && (
            <p style={{ fontSize: 14, color: 'var(--navy-light)', marginBottom: 4 }}>
              {selSlot.date} {selSlot.time}
            </p>
          )}
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {doneBooking.name} 수강생 · 주문번호 {doneBooking.orderNumber}
          </p>
        </div>
        <div className="divider" />
        <button className="btn" onClick={reset}>← 처음으로 돌아가기</button>
      </div>
    )
  }

  // ── Step 1: Choose Date ───────────────────────────────────────────────────
  if (step === 1) {
    if (slots.length === 0) {
      return (
        <>
          <Steps current={1} />
          <div className="card">
            <div className="empty-state">
              등록된 보충 날짜가 없습니다.<br />곧 일정이 업데이트될 예정입니다.
            </div>
          </div>
        </>
      )
    }
    return (
      <>
        <Steps current={1} />
        <div className="card">
          <div className="card-title">보충 가능 날짜</div>
          <div className="slot-grid">
            {sortedSlots.map(sl => {
              const full = sl.bookedCount >= sl.capacity
              const pct  = sl.capacity > 0 ? Math.round((sl.bookedCount / sl.capacity) * 100) : 0
              return (
                <div
                  key={sl.id}
                  className={`slot-card${selSlotId === sl.id ? ' selected' : ''}${full ? ' full' : ''}`}
                  onClick={() => !full && setSelSlotId(sl.id)}
                >
                  <div className="slot-date">{sl.date}</div>
                  <div className="slot-time">{sl.time}</div>
                  <div className="slot-bar">
                    <div className="slot-bar-fill" style={{ width: `${pct}%`, background: getBarColor(sl) }} />
                  </div>
                  <span className={getBadgeClass(sl)}>{getRemainingLabel(sl)}</span>
                </div>
              )
            })}
          </div>
          <button className="btn btn-navy" onClick={handleStep2} disabled={!selSlotId}>
            다음 단계 →
          </button>
        </div>
      </>
    )
  }

  // ── Step 2: Fill Info ─────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <>
        <Steps current={2} />
        <div className="card">
          {selSlot && (
            <div className="alert alert-blue" style={{ marginBottom: '1.25rem' }}>
              선택하신 날짜: <strong>{selSlot.date} {selSlot.time}</strong>
            </div>
          )}
          <div className="card-title">수강생 정보 입력</div>

          <div className="form-group">
            <label className="form-label">이름</label>
            <input className="form-input" type="text" value={form.name} placeholder="홍길동"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">연락처</label>
            <input className="form-input" type="tel" value={form.phone} placeholder="010-0000-0000"
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">수강 과목</label>
            <input className="form-input" type="text" value={form.subject} placeholder="수학, 영어, 국어 등"
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </div>

          <div className="btn-row">
            <button className="btn" onClick={() => setStep(1)}>← 이전</button>
            <button className="btn btn-navy" onClick={handleStep3}>다음 →</button>
          </div>
        </div>
      </>
    )
  }

  // ── Step 3: Payment ───────────────────────────────────────────────────────
  const price    = settings.price.toLocaleString()
  const hasUrl   = Boolean(settings.smartStoreUrl.trim())

  return (
    <>
      <Steps current={3} />
      <div className="card">
        {selSlot && (
          <div className="alert alert-blue" style={{ marginBottom: '1rem' }}>
            {selSlot.date} {selSlot.time} · {form.name} 수강생
          </div>
        )}

        <div className="pay-box">
          <div className="pay-label">보충수업 결제 금액</div>
          <div className="pay-amount">₩{price}</div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.7 }}>
          아래 버튼으로 스마트스토어에서 결제 후, 주문번호를 입력하고 신청을 완료해주세요.
        </p>

        {hasUrl ? (
          <a href={settings.smartStoreUrl} target="_blank" rel="noreferrer"
            style={{ display: 'block', textDecoration: 'none', marginBottom: 14 }}>
            <button className="btn btn-gold">네이버 스마트스토어에서 결제하기</button>
          </a>
        ) : (
          <div className="alert alert-amber" style={{ marginBottom: 14 }}>
            스마트스토어 링크가 설정되지 않았습니다. 관리자에게 문의해주세요.
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            주문번호&nbsp;
            <span style={{ color: '#A32D2D', fontSize: 11 }}>결제 후 입력</span>
          </label>
          <input className="form-input" type="text" value={form.orderNumber}
            placeholder="네이버 주문번호를 입력해주세요"
            onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))} />
        </div>

        <div className="btn-row">
          <button className="btn" onClick={() => setStep(2)}>← 이전</button>
          <button className="btn btn-navy" onClick={handleSubmit}>신청 완료</button>
        </div>
      </div>
    </>
  )
}
