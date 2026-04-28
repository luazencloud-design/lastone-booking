import type { Settings } from '../types'

interface Props {
  settings: Settings
}

export default function BrandHeader({ settings }: Props) {
  return (
    <div className="brand-header">
      <div className="brand-sub">LAST ONE · NEXT ONE</div>
      <div className="brand-title">
        {settings.className} <span>신청</span>
      </div>
      <div className="brand-desc">날짜 선택 → 정보 입력 → 결제 후 신청 완료</div>
    </div>
  )
}
