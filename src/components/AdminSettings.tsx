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
  const [form, setForm]     = useState<Settings>({ ...settings })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')

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

  const setF = (key: keyof Settings, val: any) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="card">
      <div className="card-title">기본 설정</div>

      {saved && <div className="alert alert-green" style={{ marginBottom: '1rem' }}>저장되었습니다.</div>}
      {err   && <div className="alert alert-red"   style={{ marginBottom: '1rem' }}>{err}</div>}

      <div className="form-group">
        <label className="form-label">수업명</label>
        <input className="form-input" type="text" value={form.className}
          onChange={e => setF('className', e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">기본 보충비 (원)</label>
        <input className="form-input" type="number" value={form.defaultPrice}
          onChange={e => setF('defaultPrice', Number(e.target.value))} />
      </div>

      <div className="divider" />
      <div className="card-title">결제 설정</div>

      <div className="form-group">
        <label className="form-label">네이버 스마트스토어 결제 링크</label>
        <input className="form-input" type="url" value={form.smartStoreUrl}
          placeholder="https://smartstore.naver.com/..."
          onChange={e => setF('smartStoreUrl', e.target.value)} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
          수강생 결제 시 이 링크로 이동합니다. 결제 후 주문번호를 입력해 신청을 완료합니다.
        </p>
      </div>

      <div className="divider" />
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
        관리자 비밀번호는 Vercel 환경변수&nbsp;
        <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3 }}>
          ADMIN_PASSWORD
        </code>
        &nbsp;에서 관리됩니다.
      </p>

      <button className="btn btn-navy" onClick={save} disabled={saving}>
        {saving ? '저장 중...' : '설정 저장'}
      </button>
    </div>
  )
}
