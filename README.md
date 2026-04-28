# 라스트원 넥스트원 — 보충수업 신청 시스템

Vite + React + TypeScript로 제작된 보충수업 신청 및 관리 시스템입니다.

---

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## GitHub + Vercel 배포

### 1단계 — GitHub 저장소 생성

```bash
git init
git add .
git commit -m "init: 라스트원 넥스트원 보충 신청 시스템"
git branch -M main
git remote add origin https://github.com/luazencloud-design/lastone-booking.git
git push -u origin main
```

### 2단계 — Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정 연동
2. **Add New Project** → 위에서 만든 저장소 선택
3. 아래 설정 그대로 두고 **Deploy** 클릭

| 항목 | 값 |
|------|-----|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

배포 완료 후 `https://your-project.vercel.app` 주소로 접근 가능합니다.

---

## 데이터 저장 방식

현재는 **localStorage** 를 사용합니다.
- 같은 브라우저/기기 내에서만 데이터가 공유됩니다.
- 관리자와 수강생이 **다른 기기**를 사용한다면 아래 Firebase 연동을 권장합니다.

### Firebase Firestore 연동 (멀티 기기 공유)

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 생성 → Firestore 활성화
2. 의존성 추가: `npm install firebase`
3. `src/firebase.ts` 파일 생성:

```ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey:            "...",
  authDomain:        "...",
  projectId:         "...",
  storageBucket:     "...",
  messagingSenderId: "...",
  appId:             "...",
})

export const db = getFirestore(app)
```

4. `src/storage.ts` 의 각 함수를 Firestore read/write로 교체합니다.
   파일 내 주석에 예시 코드가 포함되어 있습니다.

---

## 관리자 초기 비밀번호

`1234` (설정 탭에서 변경 가능)

---

## 기술 스택

- **Vite 5** + **React 18** + **TypeScript 5**
- **Chart.js 4** + **react-chartjs-2** (대시보드 차트)
- **localStorage** (데이터 저장, Firebase로 교체 가능)
- **순수 CSS** (외부 UI 라이브러리 없음)
