# 올페어 (Allfare) v1

복지 혜택 조회 + 문화누리카드 내 주변 사용처 찾기. 로그인 없는 조회 전용 모바일 웹앱.

- Next.js 14 (App Router) · TypeScript · Supabase · Vercel
- 데이터: 행정안전부 「대한민국 공공서비스(혜택) 정보」, 한국문화예술위원회 「문화누리카드 오프라인 가맹점 목록」, 카카오 로컬·지도 API

## 화면

| 탭 | 하는 일 |
|---|---|
| 혜택 | 내 조건 입력 안내 → 지역(전국 + 내 시·도 + 내 시·군·구) 혜택 목록, 분야 배지, 검색, 정렬(마감 임박/최신/좋아요/조회), 조건 맞음·확인 필요 배지, 상세(좋아요·카카오톡 공유·신청하러 가기) |
| 문화누리 | 현재 위치 또는 동네 검색 → 카카오 지도 + 반경(500m/1km/3km) + 분야 배지 → 가게 상세(전화·길찾기·카카오맵 영업시간 링크·후기/하트/신고) |
| 내 조건 | 주민번호 앞 6자리→만 나이, 시·도/시·군·구, 가구원 수+월 소득→중위소득 구간 자동 계산, 해당 상황, 글자 크기(− 돋보기 +), 이 기기 저장값·초기화 |

- 내 조건은 브라우저(localStorage)에만 저장. 서버로 안 보냄(시·도/시·군·구만 목록 요청에 사용).
- 좋아요·후기 하트·신고는 무작위 기기 ID로 1회만 반영.
- `/benefit/[id]` : 카카오톡 공유 링크가 열리는 혜택 소개 페이지
- `/admin` : 동기화 실행, 가맹점 좌표 채우기, 후기 숨김/삭제 (ADMIN_PASSWORD)

## 데이터 흐름

1. **혜택**: 매일 04:00(KST) 버셀 크론 → `/api/sync/benefits` → 정부24 serviceList + supportConditions 전체를 받아 `benefits` 테이블에 저장. 소관기관명으로 지역 판별, 신청기한에서 마감일 추출, 법인·소상공인 전용은 제외.
2. **가맹점**: `/admin`에서 ① 목록 가져오기 → ② 좌표·전화번호 채우기(카카오 주소 검색 + 장소 검색). 이후 매일 04:30 크론이 남은 것을 이어서 채우고, 매주 월요일 목록을 새로 받음.
3. 앱은 Supabase만 읽음(공공 API를 사용자마다 직접 부르지 않음).

## 처음 설정 순서

1. Supabase 새 프로젝트 → SQL Editor에 `allfare_v1.sql` 실행
2. 버셀 환경변수 (`.env.example` 참고)
   - `DATA_GO_KR_SERVICE_KEY`, `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`, `ADMIN_PASSWORD`, (선택) `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CONTACT_EMAIL`
3. 카카오 디벨로퍼스 → 앱 → 플랫폼 → Web 사이트 도메인에 배포 주소 등록 (지도·공유용)
4. 깃헙 푸시 → 버셀 배포
5. `배포주소/admin` 접속 → 혜택 지금 동기화 → 가맹점 목록 가져오기 → 좌표·전화번호 채우기

## 폴더

```
src/app            화면(page), API(api/*), 공유 페이지(benefit/[id]), 관리자(admin)
src/components     탭·상세 시트·지도 컴포넌트
src/lib            조건 판정(match), 지역(regions), 마감일(deadline), 내 조건(profile)
src/lib/server     Supabase·카카오·동기화 (서버 전용)
supabase/          DB 스키마 SQL
```
