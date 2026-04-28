import { useState } from 'react'
import type { Session, Booking, Settings, SessionForm } from '../types'
import * as api from '../api'

interface Props {
  sessions: Session[]
  bookings: Booking[]
  settings: Settings
  adminPw: string
  onSessionsChange: (s: Session[]) => void
  onBookingsChange: (b: Booking[]) => void
  onRefresh: () => Promise<void>
}

const EMPTY: SessionForm = {
  subject: '', date: '', startTime: '', durationMinutes: '60', capacity: '5',
  isFree: false, customPriceEnabled: false, customPrice: '',
}

function endTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + durationMinutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function AdminSessions({ sessions, bookings, settings, adminPw, onSessionsChange, onBookingsChange, onRefresh }: Props) {
  const [form, setForm]       = useState<SessionForm>(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const resolvedPrice = (): number => {
    if (form.isFree) return 0
    if (form.customPriceEnabled) return Number(form.customPrice) || 0
    return settings.defaultPrice
  }

  const addSession = async () => {
    if (!form.subject.trim() || !form.date || !form.startTime) {
      setErr('과목, 날짜, 시간을 모두 입력해주세요.'); return
    }
    const cap = parseInt(form.capacity)
    if (!cap || cap < 1) { setErr('정원을 올바르게 입력해주세요.'); return }

    setSaving(true); setErr('')
    try {
      const session: Session = {
        id: 'sl_' + Date.now(),
        subject: form.subject.trim(),
        date: form.date,
        startTime: form.startTime,
        durationMinutes: parseInt(form.durationMinutes) || 60,
        capacity: cap,
        bookedCount: 0,
        isFree: form.isFree,
        customPriceEnabled: form.customPriceEnabled,
        price: resolvedPrice(),
      }
      await api.createSession(session, adminPw)
      await onRefresh()
      setForm(EMPTY)
    } catch (e: any) {
      setErr(e.message || '추가 실패')
    } finally {
      setSaving(false)
    }
  }

  const deleteSession = async (id: string) => {
    if (!confirm('삭제하면 해당 신청도 함께 삭제됩니다. 계속할까요?')) return
    try {
      await api.deleteSession(id, adminPw)
      await onRefresh()
    } catch (e: any) { alert(e.message) }
  }

  const sorted = [...sessions].sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
  )

  return (
    <>
      {/* ── Add Session ──────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">세션 추가</div>

        <div className="form-group">
          <label className="form-label">수강 과목</label>
          <input className="form-input" type="text" value={form.subject}
            placeholder="수학, 영어, 국어 등"
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div>
            <label className="form-label">날짜</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">시작 시간</label>
            <input className="form-input" type="time" value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div>
            <label className="form-label">소요 시간 (분)</label>
            <input className="form-input" type="number" min="10" max="480" value={form.durationMinutes}
              onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">정원 (명)</label>
            <input className="form-input" type="number" min="1" max="100" value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
          </div>
        </div>

        {/* Pricing */}
        <div className="card-title" style={{ marginBottom: 10 }}>가격 설정</div>

        <div className="price-option-row">
          <label className="toggle-label">
            <input type="checkbox" checked={form.isFree}
              onChange={e => setForm(f => ({ ...f, isFree: e.target.checked, customPriceEnabled: false }))} />
            <span>무료 (결제 절차 생략)</span>
          </label>
        </div>

        {!form.isFree && (
          <div className="price-option-row">
            <label className="toggle-label">
              <input type="checkbox" checked={form.customPriceEnabled}
                onChange={e => setForm(f => ({ ...f, customPriceEnabled: e.target.checked }))} />
              <span>가격 직접 설정</span>
            </label>
          </div>
        )}

        {!form.isFree && form.customPriceEnabled && (
          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="form-label">가격 (원)</label>
            <input className="form-input" type="number" min="0" value={form.customPrice}
              placeholder={String(settings.defaultPrice)}
              onChange={e => setForm(f => ({ ...f, customPrice: e.target.value }))} />
          </div>
        )}

        {!form.isFree && !form.customPriceEnabled && (
          <div className="alert alert-blue" style={{ marginTop: 8 }}>
            기본 보충비 적용: ₩{settings.defaultPrice.toLocaleString()}
          </div>
        )}

        {form.isFree && (
          <div className="alert alert-green" style={{ marginTop: 8 }}>
            무료 세션 — 수강생의 결제 단계가 생략됩니다.
          </div>
        )}

        {form.startTime && form.durationMinutes && (
          <div className="session-preview">
            {form.subject && <span className="preview-subject">{form.subject}</span>}
            {form.date && <span className="preview-meta">{form.date}</span>}
            {form.startTime && <span className="preview-meta">{form.startTime} – {endTime(form.startTime, parseInt(form.durationMinutes) || 0)}</span>}
            <span className="preview-price">{form.isFree ? '무료' : `₩${resolvedPrice().toLocaleString()}`}</span>
          </div>
        )}

        {err && <div className="alert alert-red" style={{ marginTop: 12 }}>{err}</div>}
        <button className="btn btn-navy" onClick={addSession} disabled={saving} style={{ marginTop: 14 }}>
          {saving ? '추가 중...' : '+ 세션 추가'}
        </button>
      </div>

      {/* ── Session List ─────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="empty-state">등록된 세션이 없습니다.</div>
      ) : (
        <div className="card">
          <div className="card-title">등록된 세션 ({sorted.length}개)</div>
          {sorted.map(s => {
            const rem = s.capacity - s.bookedCount
            const badgeClass = s.bookedCount >= s.capacity ? 'badge-red' : rem <= 1 ? 'badge-amber' : 'badge-green'
            return (
              <div key={s.id} className="bk-row">
                <div>
                  <div className="bk-name">
                    {s.subject}
                    <span className={`badge ${s.isFree ? 'badge-green' : 'badge-blue'}`} style={{ marginLeft: 8 }}>
                      {s.isFree ? '무료' : `₩${s.price.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="bk-meta">
                    {s.date} · {s.startTime} – {endTime(s.startTime, s.durationMinutes)}
                    &nbsp;·&nbsp;정원 {s.capacity}명 · 신청 {s.bookedCount}명
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${badgeClass}`}>{rem > 0 ? `잔여 ${rem}석` : '마감'}</span>
                  <button className="btn btn-ghost-red btn-sm" onClick={() => deleteSession(s.id)}>삭제</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
