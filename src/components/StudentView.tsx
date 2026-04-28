import { useState } from 'react'
import type { Session, Booking, Settings, StudentStep, StudentForm, PaymentMethod } from '../types'

interface Props {
  sessions: Session[]
  settings: Settings
  onBook: (b: Booking) => Promise<Booking>
}

const EMPTY_FORM: StudentForm = { name: '', phone: '', paymentMethod: '', orderNumber: '' }

function endTime(startTime: string, durationMinutes: number): string {
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
  const full = s.bookedCount >= s.capacity
  const few  = s.bookedCount >= s.capacity * 0.7 && !full
  return full ? '#E24B4A' : few ? '#BA7517' : '#185FA5'
}

function Steps({ current }: { current: StudentStep }) {
  const steps: [StudentStep, string][] = [[1, '세션 선택'], [2, '정보 입력'], [3, '결제']]
  return (
    <div className="steps">
      {steps.map(([n, label], i) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
          <div className={`step-num ${current > n ? 'done' : current === n ? 'active' : 'idle'}`}>
            {current > n ? '✓' : n}
          </div>
          <span className="step-label">{label}</span>
          {i < 2 && <div className="step-line" />}
        </div>
      ))}
    </div>
  )
}

export default function StudentView({ sessions, settings, onBook }: Props) {
  const [step, setStep]         = useState<StudentStep>(1)
  const [selId, setSelId]       = useState<string | null>(null)
  const [form, setForm]         = useState<StudentForm>(EMPTY_FORM)
  const [done, setDone]         = useState(false)
  const [doneBooking, setDoneBooking] = useState<Booking | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  const sorted = [...sessions].sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
  )
  const sel = sessions.find(s => s.id === selId) ?? null

  const reset = () => {
    setStep(1); setSelId(null); setForm(EMPTY_FORM)
    setDone(false); setDoneBooking(null); setError('')
  }

  const goStep3 = () => {
    if (!form.name.trim() || !form.phone.trim()) { setError('이름과 연락처를 입력해주세요.'); return }
    setError('')
    if (sel?.isFree) {
      // Skip payment step — directly submit
      handleSubmit('free', '')
    } else {
      setStep(3)
    }
  }

  const handleSubmit = async (method: PaymentMethod, orderNumber: string) => {
    if (!sel) return
    if (method !== 'free' && !orderNumber.trim()) {
      setError(method === 'transfer' ? '입금자명을 입력해주세요.' : '주문번호를 입력해주세요.')
      return
    }
    setSubmitting(true); setError('')
    try {
      const booking: Booking = {
        id: 'bk_' + Date.now(),
        sessionId: sel.id,
        name: form.name,
        phone: form.phone,
        paymentMethod: method,
        orderNumber,
        createdAt: new Date().toISOString(),
      }
      const result = await onBook(booking)
      setDoneBooking(result)
      setDone(true)
    } catch (e: any) {
      setError(e.message || '신청 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (done && doneBooking && sel) {
    return (
      <div className="card">
        <div className="success-wrap">
          <div className="success-icon">✓</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>신청이 완료되었습니다</p>
          <p style={{ fontSize: 15, color: 'var(--gold-mid)', fontWeight: 600, marginBottom: 4 }}>{sel.subject}</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {sel.date} · {sel.startTime} – {endTime(sel.startTime, sel.durationMinutes)}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {doneBooking.name} 수강생
            {doneBooking.paymentMethod !== 'free' && ` · ${doneBooking.orderNumber}`}
          </p>
        </div>
        <div className="divider" />
        <button className="btn" onClick={reset}>← 처음으로 돌아가기</button>
      </div>
    )
  }

  // ── Step 1: Select Session ─────────────────────────────────────────────────
  if (step === 1) {
    if (sessions.length === 0) return (
      <>
        <Steps current={1} />
        <div className="card">
          <div className="empty-state">등록된 보충 날짜가 없습니다.<br />곧 업데이트될 예정입니다.</div>
        </div>
      </>
    )

    // Group by subject
    const subjects = Array.from(new Set(sorted.map(s => s.subject)))

    return (
      <>
        <Steps current={1} />
        {subjects.map(subject => {
          const group = sorted.filter(s => s.subject === subject)
          return (
            <div key={subject} className="card" style={{ marginBottom: '1rem' }}>
              <div className="session-subject-title">{subject}</div>
              <div className="session-list">
                {group.map(s => {
                  const full = s.bookedCount >= s.capacity
                  const rem  = s.capacity - s.bookedCount
                  const pct  = s.capacity > 0 ? Math.round((s.bookedCount / s.capacity) * 100) : 0
                  const sel_ = selId === s.id
                  return (
                    <div
                      key={s.id}
                      className={`session-row${sel_ ? ' selected' : ''}${full ? ' full' : ''}`}
                      onClick={() => !full && setSelId(s.id)}
                    >
                      <div className="session-row-info">
                        <div className="session-row-date">{s.date}</div>
                        <div className="session-row-time">
                          {s.startTime} – {endTime(s.startTime, s.durationMinutes)}
                          <span className="session-duration">({formatDuration(s.durationMinutes)})</span>
                        </div>
                      </div>
                      <div className="session-row-right">
                        <div className="session-row-bar">
                          <div style={{ width: `${pct}%`, background: barColor(s), height: '100%', borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <span className={`badge ${full ? 'badge-red' : rem <= 2 ? 'badge-amber' : 'badge-green'}`}>
                            {full ? '마감' : `잔여 ${rem}석`}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {s.isFree ? '무료' : `₩${s.price.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div className="card">
          <button className="btn btn-navy" onClick={() => selId && setStep(2)} disabled={!selId}>
            다음 단계 →
          </button>
        </div>
      </>
    )
  }

  // ── Step 2: Info ───────────────────────────────────────────────────────────
  if (step === 2 && sel) {
    return (
      <>
        <Steps current={2} />
        <div className="card">
          <div className="session-summary-box">
            <div className="session-summary-subject">{sel.subject}</div>
            <div className="session-summary-meta">
              {sel.date} · {sel.startTime} – {endTime(sel.startTime, sel.durationMinutes)}
              &nbsp;·&nbsp;{sel.isFree ? '무료' : `₩${sel.price.toLocaleString()}`}
            </div>
          </div>

          <div className="card-title" style={{ marginTop: '1.25rem' }}>수강생 정보</div>

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

          {error && <div className="alert alert-red" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="btn-row">
            <button className="btn" onClick={() => setStep(1)}>← 이전</button>
            <button className="btn btn-navy" onClick={goStep3} disabled={submitting}>
              {sel.isFree ? '신청 완료' : '결제 →'}
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Step 3: Payment ────────────────────────────────────────────────────────
  if (step === 3 && sel) {
    return (
      <PaymentStep
        session={sel}
        settings={settings}
        name={form.name}
        submitting={submitting}
        error={error}
        onBack={() => setStep(2)}
        onSubmit={handleSubmit}
      />
    )
  }

  return null
}

// ── Payment Step Component ─────────────────────────────────────────────────────
interface PaymentStepProps {
  session: Session
  settings: Settings
  name: string
  submitting: boolean
  error: string
  onBack: () => void
  onSubmit: (method: PaymentMethod, orderNumber: string) => void
}

function PaymentStep({ session, settings, name, submitting, error, onBack, onSubmit }: PaymentStepProps) {
  const [method, setMethod]   = useState<PaymentMethod | ''>('')
  const [orderNum, setOrderNum] = useState('')
  const [depositor, setDepositor] = useState(name)

  const pm = settings.paymentMethods

  const availableMethods: { id: PaymentMethod; label: string; icon: string }[] = [
    ...(pm.card    ? [{ id: 'card'     as PaymentMethod, label: '신용/체크카드',        icon: '💳' }] : []),
    ...(pm.easypay ? [{ id: 'easypay'  as PaymentMethod, label: '간편결제',              icon: '⚡' }] : []),
    ...(pm.transfer? [{ id: 'transfer' as PaymentMethod, label: '무통장입금·계좌이체',   icon: '🏦' }] : []),
  ]

  function endTime(startTime: string, durationMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number)
    const total = h * 60 + m + durationMinutes
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }

  const handlePay = () => {
    if (!method) return
    if (method === 'transfer') onSubmit('transfer', depositor)
    else onSubmit(method, orderNum)
  }

  return (
    <>
      <div className="steps">
        {([1,2,3] as StudentStep[]).map((n, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div className={`step-num ${n < 3 ? 'done' : 'active'}`}>{n < 3 ? '✓' : n}</div>
            <span className="step-label">{['세션 선택','정보 입력','결제'][i]}</span>
            {i < 2 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="session-summary-box" style={{ marginBottom: '1.25rem' }}>
          <div className="session-summary-subject">{session.subject}</div>
          <div className="session-summary-meta">
            {session.date} · {session.startTime} – {endTime(session.startTime, session.durationMinutes)}
            &nbsp;·&nbsp;{name} 수강생
          </div>
        </div>

        <div className="pay-box">
          <div className="pay-label">결제 금액</div>
          <div className="pay-amount">₩{session.price.toLocaleString()}</div>
        </div>

        <div className="card-title">결제 수단 선택</div>
        <div className="payment-methods">
          {availableMethods.map(m => (
            <button
              key={m.id}
              className={`payment-method-btn${method === m.id ? ' selected' : ''}`}
              onClick={() => setMethod(m.id)}
            >
              <span className="pm-icon">{m.icon}</span>
              <span className="pm-label">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Card / Easy Pay */}
        {(method === 'card' || method === 'easypay') && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.7 }}>
              아래 버튼으로 스마트스토어에서 결제 후 주문번호를 입력해주세요.
            </p>
            {settings.smartStoreUrl ? (
              <a href={settings.smartStoreUrl} target="_blank" rel="noreferrer"
                style={{ display: 'block', textDecoration: 'none', marginBottom: 12 }}>
                <button className="btn btn-naver">네이버 스마트스토어에서 결제하기</button>
              </a>
            ) : (
              <div className="alert alert-amber" style={{ marginBottom: 12 }}>
                스마트스토어 링크가 설정되지 않았습니다. 관리자에게 문의해주세요.
              </div>
            )}
            <div className="form-group">
              <label className="form-label">
                주문번호&nbsp;<span style={{ color: '#A32D2D', fontSize: 11 }}>결제 후 입력</span>
              </label>
              <input className="form-input" type="text" value={orderNum}
                placeholder="네이버 주문번호"
                onChange={e => setOrderNum(e.target.value)} />
            </div>
          </div>
        )}

        {/* Bank Transfer */}
        {method === 'transfer' && (
          <div style={{ marginTop: '1rem' }}>
            {settings.bankAccount ? (
              <div className="bank-info-box">
                <div className="bank-info-label">입금 계좌</div>
                <div className="bank-info-account">
                  {settings.bankName} {settings.bankAccount}
                </div>
                <div className="bank-info-holder">예금주: {settings.bankHolder}</div>
                <div className="bank-info-amount">₩{session.price.toLocaleString()}</div>
              </div>
            ) : (
              <div className="alert alert-amber" style={{ marginBottom: 12 }}>
                계좌 정보가 설정되지 않았습니다. 관리자에게 문의해주세요.
              </div>
            )}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">입금자명</label>
              <input className="form-input" type="text" value={depositor}
                placeholder="입금자 이름"
                onChange={e => setDepositor(e.target.value)} />
            </div>
          </div>
        )}

        {error && <div className="alert alert-red" style={{ margin: '12px 0' }}>{error}</div>}

        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button className="btn" onClick={onBack}>← 이전</button>
          <button
            className="btn btn-navy"
            onClick={handlePay}
            disabled={!method || submitting}
          >
            {submitting ? '처리 중...' : '신청 완료'}
          </button>
        </div>
      </div>
    </>
  )
}
