# hyunsmeetinthemiddle 🚇
> 수도권 지하철 네트워크 기반 **N명(최대 10명)의 출발역 맞춤형 최적 중간 모임역 계산기**

외부 유료 API 연동이나 API Key 없이, 내장된 수도권 지하철 네트워크 그래프 데이터와 **다익스트라(Dijkstra) & Minimax 알고리즘**을 활용하여 모두에게 가장 공평하고 빠른 최적의 중간역을 찾아주는 웹 서비스입니다.

---

## ✨ 주요 기능

1. **최대 10명 동적 인원 설정**
   - 2명부터 최대 10명까지 인원 추가 및 삭제 지원
   - 각 참여자별 이름 커스텀 및 출발역 검색 자동완성(초성 검색 지원, 예: `ㄱㄴ` -> `강남역`)

2. **Dijkstra & Minimax 공평 알고리즘**
   - 1순위: $\max(T_1, \dots, T_N)$ (가장 오래 걸리는 인원의 소요시간) 최소화 (누구 한 명만 소외되지 않도록 보장)
   - 2순위: $\sum T_i$ (전체 인원의 총 소요시간 합) 최소화
   - 3순위: 인원 간 소요시간 편차 최소화
   - 최적 1위~3위 후보역 도출 및 상세 이동 경로 표시

3. **OpenStreetMap & Leaflet.js 시각화**
   - 유료 지도 Key 없이 무료 OSM 지도 타일 연동
   - 각 출발역별 번호 배지 마커 및 중간역 왕관 마커
   - 출발역에서 중간역으로 이어지는 점선 경로(Polyline) 및 `fitBounds` 자동 줌 맞춤

4. **외부 길찾기 원클릭 연동**
   - 카카오맵 길찾기 바로가기
   - 네이버지도 길찾기 바로가기

5. **클린 라이트 모드 (White Mode) UI/UX**
   - 눈이 편안한 화이트/슬레이트/블루 포인트 디자인
   - 데스크톱 & 모바일 반응형 완벽 대응

---

## 🛠 기술 스택

- **Framework**: React 18, Vite, TypeScript
- **Styling**: TailwindCSS, Pretendard Font, Lucide Icons (`lucide-react`)
- **Map Engine**: Leaflet.js, React-Leaflet
- **Deployment**: Vercel (SPA)

---

## 🚀 로컬 개발 및 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 프로덕션 빌드 검증
npm run build
```

---

## 🌐 Vercel 배포 가이드

1. 본 저장소를 GitHub에 Push합니다.
2. [Vercel 대시보드](https://vercel.com)에서 **Add New Project**를 선택하고 해당 저장소를 Import합니다.
3. 빌드 설정(기본값 적용):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Deploy** 버튼을 누르면 즉시 글로벌 배포가 완료됩니다!
