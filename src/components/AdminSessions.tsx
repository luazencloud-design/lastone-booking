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

function calcEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + durationMinutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function formatDuration(min: number): string {
  if (min < 60) return `${min}분`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
}

function barColor(s: Session): string {
  const pct = s.bookedCount / s.capacity
  if (pct >= 1) return '#E24B4A'
  if (pct >= 0.7) return '#BA7517'
  return '#185FA5'
}

export default function AdminSessions({ sessions, settings, adminPw, onRefresh }: Props) {
  const [form, setForm]     = useState<SessionForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')
  const [showForm, setShowForm] = useState(false)

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
      await api.createSession({
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
      }, adminPw)
      await onRefresh()
      setForm(EMPTY)
      setShowForm(false)
    } catch (e: any) {
      setErr(e.message || '추가 실패')
    } finally {
      setSaving(false)
    }
  }

  const deleteSession = async (id: string) => {
    if (!confirm('삭제하면 해당 신청도 함께 삭제됩니다. 계속할까요?')) return
    try { await api.deleteSession(id, adminPw); await onRefresh() }
    catch (e: any) { alert(e.message) }
  }

  const sorted = [...sessions].sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
  )

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalSeats   = sessions.reduce((a, s) => a + s.capacity, 0)
  const bookedSeats  = sessions.reduce((a, s) => a + s.bookedCount, 0)
  const fullSessions = sessions.filter(s => s.bookedCount >= s.capacity).length

  // Group by subject for dashboard
  const subjects = Array.from(new Set(sorted.map(s => s.subject)))

  return (
    <>
      {/* ── Top Stats Row ────────────────────────────────────────────── */}
      <div className="session-stat-row">
        <div className="session-stat">
          <div className="session-stat-val">{sessions.length}</div>
          <div className="session-stat-lbl">전체 세션</div>
        </div>
        <div className="session-stat">
          <div className="session-stat-val">{bookedSeats}<span className="session-stat-total">/{totalSeats}</span></div>
          <div className="session-stat-lbl">신청 / 전체 좌석</div>
        </div>
        <div className="session-stat">
          <div className="session-stat-val" style={{ color: fullSessions > 0 ? '#E24B4A' : 'var(--text)' }}>{fullSessions}</div>
          <div className="session-stat-lbl">마감 세션</div>
        </div>
      </div>

      {/* ── Add Button ───────────────────────────────────────────────── */}
      <button
        className={`btn ${showForm ? '' : 'btn-navy'}`}
        style={{ marginBottom: '1rem' }}
        onClick={() => { setShowForm(v => !v); setErr('') }}
      >
        {showForm ? '✕  닫기' : '＋  새 세션 추가'}
      </button>

      {/* ── Add Form (collapsible) ────────────────────────────────────── */}
      {showForm && (
        <div className="session-add-panel">
          <div className="sap-title">새 세션</div>

          {/* Subject */}
          <div className="sap-subject-wrap">
            <label className="sap-subject-label">📚 수강 과목</label>
            <input
              className="form-input sap-subject-input"
              type="text"
              value={form.subject}
              placeholder="예) 수학, 영어, 국어"
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
          </div>

          <div className="sap-grid">
            <div className="form-group">
              <label className="form-label">날짜</label>
              <input className="form-input" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">시작 시간</label>
              <input className="form-input" type="time" value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">소요 시간 (분)</label>
              <input className="form-input" type="number" min="10" max="480" value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">정원 (명)</label>
              <input className="form-input" type="number" min="1" max="100" value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
            </div>
          </div>

          {/* Price */}
          <div className="sap-price-row">
            <label className={`sap-price-opt${form.isFree ? ' on' : ''}`}>
              <input type="checkbox" checked={form.isFree}
                onChange={e => setForm(f => ({ ...f, isFree: e.target.checked, customPriceEnabled: false }))} />
              무료
            </label>
            {!form.isFree && (
              <label className={`sap-price-opt${form.customPriceEnabled ? ' on' : ''}`}>
                <input type="checkbox" checked={form.customPriceEnabled}
                  onChange={e => setForm(f => ({ ...f, customPriceEnabled: e.target.checked }))} />
                가격 직접 설정
              </label>
            )}
            <div className="sap-price-display">
              {form.isFree ? '무료' : `₩${resolvedPrice().toLocaleString()}`}
            </div>
          </div>

          {!form.isFree && form.customPriceEnabled && (
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">가격 (원)</label>
              <input className="form-input" type="number" min="0" value={form.customPrice}
                placeholder={String(settings.defaultPrice)}
                onChange={e => setForm(f => ({ ...f, customPrice: e.target.value }))} />
            </div>
          )}

          {/* Live preview */}
          {(form.subject || form.date || form.startTime) && (
            <div className="sap-preview">
              <span className="sap-preview-subject">{form.subject || '(과목 미입력)'}</span>
              <span className="sap-preview-sep">·</span>
              <span>{form.date || '—'}</span>
              {form.startTime && (
                <>
                  <span className="sap-preview-sep">·</span>
                  <span>{form.startTime} – {calcEndTime(form.startTime, parseInt(form.durationMinutes) || 0)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-hint)', marginLeft: 4 }}>
                    ({formatDuration(parseInt(form.durationMinutes) || 0)})
                  </span>
                </>
              )}
              <span className="sap-preview-price">{form.isFree ? '무료' : `₩${resolvedPrice().toLocaleString()}`}</span>
            </div>
          )}

          {err && <div className="alert alert-red" style={{ marginTop: 10 }}>{err}</div>}
          <button className="btn btn-navy" onClick={addSession} disabled={saving} style={{ marginTop: 14 }}>
            {saving ? '추가 중...' : '+ 세션 추가'}
          </button>
        </div>
      )}

      {/* ── Session Dashboard ─────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="empty-state">등록된 세션이 없습니다.<br/>위 버튼으로 첫 세션을 추가해보세요.</div>
      ) : (
        subjects.map(subject => {
          const group = sorted.filter(s => s.subject === subject)
          const groupBooked = group.reduce((a, s) => a + s.bookedCount, 0)
          const groupTotal  = group.reduce((a, s) => a + s.capacity, 0)
          return (
            <div key={subject} className="session-subject-section">
              <div className="session-subject-header">
                <div className="session-subject-name">{subject}</div>
                <div className="session-subject-meta">{group.length}개 세션 · {groupBooked}/{groupTotal}석</div>
              </div>
              <div className="session-card-grid">
                {group.map(s => {
                  const full = s.bookedCount >= s.capacity
                  const rem  = s.capacity - s.bookedCount
                  const pct  = s.capacity > 0 ? Math.round((s.bookedCount / s.capacity) * 100) : 0
                  return (
                    <div key={s.id} className={`session-dash-card${full ? ' full' : ''}`}>
                      <div className="sdc-top">
                        <div className="sdc-date">{s.date}</div>
                        <span className={`badge ${s.isFree ? 'badge-green' : 'badge-blue'}`}>
                          {s.isFree ? '무료' : `₩${s.price.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="sdc-time">
                        {s.startTime} – {calcEndTime(s.startTime, s.durationMinutes)}
                        <span className="sdc-duration">({formatDuration(s.durationMinutes)})</span>
                      </div>
                      <div className="sdc-bar-wrap">
                        <div className="sdc-bar">
                          <div className="sdc-bar-fill" style={{ width: `${pct}%`, background: barColor(s) }} />
                        </div>
                        <div className="sdc-seats">
                          <span className={full ? 'sdc-full' : rem <= 2 ? 'sdc-few' : 'sdc-ok'}>
                            {full ? '마감' : `잔여 ${rem}석`}
                          </span>
                          <span className="sdc-count">{s.bookedCount}/{s.capacity}</span>
                        </div>
                      </div>
                      <button className="sdc-del-btn" onClick={() => deleteSession(s.id)}>삭제</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </>
  )
}
