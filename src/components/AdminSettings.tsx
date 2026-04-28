import { useState } from 'react'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onSettingsChange: (s: Settings) => void
  slots?: unknown
  bookings?: unknown
  onSlotsChange?: unknown
  onBookingsChange?: unknown
}

export default function AdminSettings({ settings, onSettingsChange }: Props) {
  const [form, setForm] = useState<Settings>({ ...settings })
  const [saved, setSaved] = useState(false)

  const save = () => {
    if (!form.adminPassword.trim()) { alert('비밀번호는 비워둘 수 없습니다.'); return }
    onSettingsChange({ ...form, price: Number(form.price) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card">
      <div className="card-title">기본 설정</div>

      {saved && <div className="alert alert-green" style={{ marginBottom: '1rem' }}>저장되었습니다.</div>}

      <div className="form-group">
        <label className="form-label">수업명</label>
        <input className="form-input" type="text" value={form.className}
          onChange={e => setForm(f => ({ ...f, className: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">보충비 (원)</label>
        <input className="form-input" type="number" value={form.price}
          onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
      </div>
      <div className="form-group">
        <label className="form-label">스마트스토어 결제 링크</label>
        <input className="form-input" type="url" value={form.smartStoreUrl}
          placeholder="https://smartstore.naver.com/..."
          onChange={e => setForm(f => ({ ...f, smartStoreUrl: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">관리자 비밀번호</label>
        <input className="form-input" type="password" value={form.adminPassword}
          onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} />
      </div>

      <button className="btn btn-navy" onClick={save}>설정 저장</button>
    </div>
  )
}
