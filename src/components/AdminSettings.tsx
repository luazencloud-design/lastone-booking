import { useState } from 'react'
import type { Settings } from '../types'
import * as api from '../api'

interface Props {
  settings: Settings
  adminPw: string
  onSettingsChange: (s: Settings) => void
  sessions?: unknown; bookings?: unknown
  onSessionsChange?: unknown; onBookingsChange?: unknown; onRefresh?: unknown
}

export default function AdminSettings({ settings, adminPw, onSettingsChange }: Props) {
  const [form, setForm] = useState<Settings>({ ...settings })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [err, setErr]         = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const updated = await api.updateSettings(form, adminPw)
      onSettingsChange(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setErr(e.message || '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const setF = (key: keyof Settings, val: any) => setForm(f => ({ ...f, [key]: val }))
  const setPM = (key: keyof Settings['paymentMethods'], val: boolean) =>
    setForm(f => ({ ...f, paymentMethods: { ...f.paymentMethods, [key]: val } }))

  return (
    <div className="card">
      <div className="card-title">기본 설정</div>

      {saved && <div className="alert alert-green" style={{ marginBottom: '1rem' }}>저장되었습니다.</div>}
      {err   && <div className="alert alert-red"   style={{ marginBottom: '1rem' }}>{err}</div>}

      <div className="form-group">
        <label className="form-label">수업명</label>
        <input className="form-input" type="text" value={form.className} onChange={e => setF('className', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">기본 보충비 (원)</label>
        <input className="form-input" type="number" value={form.defaultPrice} onChange={e => setF('defaultPrice', Number(e.target.value))} />
      </div>

      <div className="card-title" style={{ marginTop: '1.25rem', marginBottom: 12 }}>결제 수단 설정</div>

      <div className="settings-payment-grid">
        <div className="settings-pm-row">
          <div className="pm-toggle-info">
            <span className="pm-icon">💳</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>신용/체크카드</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>스마트스토어 연동</div>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={form.paymentMethods.card} onChange={e => setPM('card', e.target.checked)} />
            <span className="slider" />
          </label>
        </div>
        <div className="settings-pm-row">
          <div className="pm-toggle-info">
            <span className="pm-icon">⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>간편결제</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>카카오페이·네이버페이·토스</div>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={form.paymentMethods.easypay} onChange={e => setPM('easypay', e.target.checked)} />
            <span className="slider" />
          </label>
        </div>
        <div className="settings-pm-row">
          <div className="pm-toggle-info">
            <span className="pm-icon">🏦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>무통장입금·계좌이체</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>아래 계좌 정보 입력 필요</div>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={form.paymentMethods.transfer} onChange={e => setPM('transfer', e.target.checked)} />
            <span className="slider" />
          </label>
        </div>
      </div>

      {(form.paymentMethods.card || form.paymentMethods.easypay) && (
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">스마트스토어 결제 링크</label>
          <input className="form-input" type="url" value={form.smartStoreUrl}
            placeholder="https://smartstore.naver.com/..."
            onChange={e => setF('smartStoreUrl', e.target.value)} />
        </div>
      )}

      {form.paymentMethods.transfer && (
        <>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div>
              <label className="form-label">은행명</label>
              <input className="form-input" type="text" value={form.bankName}
                placeholder="국민은행" onChange={e => setF('bankName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">계좌번호</label>
              <input className="form-input" type="text" value={form.bankAccount}
                placeholder="000-0000-0000-00" onChange={e => setF('bankAccount', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">예금주</label>
            <input className="form-input" type="text" value={form.bankHolder}
              placeholder="홍길동" onChange={e => setF('bankHolder', e.target.value)} />
          </div>
        </>
      )}

      <div className="divider" />
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
        관리자 비밀번호는 Vercel 환경변수 <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3 }}>ADMIN_PASSWORD</code>에서 관리됩니다.
      </p>

      <button className="btn btn-navy" onClick={save} disabled={saving}>
        {saving ? '저장 중...' : '설정 저장'}
      </button>
    </div>
  )
}
