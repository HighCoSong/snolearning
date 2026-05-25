# snolearning

> **숙명여자대학교 학생을 위한 AI 기반 학업 지원 서비스**  
> Upstage Document AI + Solar LLM + n8n 로우코드 자동화로 구현한 모바일 웹 앱

![Award](https://img.shields.io/badge/2026_Low--Code_AI_CHALLENGE-대상-gold?style=for-the-badge)
![Organizer](https://img.shields.io/badge/주관-숙명여대_SW중심대학사업단-5B4FCF?style=for-the-badge)
![Partner](https://img.shields.io/badge/파트너-Upstage-00B4D8?style=for-the-badge)

---

## 개요

대학생이 매 학기 반복하는 세 가지 번거로운 작업을 AI로 자동화합니다.

| 문제 | 기존 방식 | snolearning |
|------|-----------|-------------|
| 졸업요건 파악 | 학사 시스템 직접 확인, 수작업 계산 | 이수표 PDF 업로드 → AI가 잔여 학점 분석 + 학기별 로드맵 생성 |
| 수업 일정 관리 | 강의계획서 읽으며 직접 캘린더 입력 | 강의계획서 PDF 업로드 → 구글 캘린더 자동 등록 |
| 공지 확인 | 포털 · 학과 홈페이지 각각 접속 | 학과 · 키워드 선택 → 맞춤 공지 한 곳에서 조회 |

---

## 핵심 기능

### 1. 졸업요건 분석

```
이수표 PDF
    └─ Upstage Document Parse (OCR)
    └─ 학과 홈페이지 크롤링 (졸업요건 자동 수집)
    └─ 병합 → Solar LLM 분석
    └─ 결과: 학점 현황 · 부족 과목 · 학기별 수강 로드맵
```

- 학과 선택 (숙명여대 전체 학과 지원)
- 남은 학기 수 · 희망 진로 입력 시 맞춤 로드맵 생성
- 분석 결과를 **학업 분석** / **취업 아카이빙** 탭으로 분리 표시
- 희망 진로 입력 시 이수 과목 역량 아카이빙 탭 활성화
- 이미 수강 중인 과목(`*` 표시)은 추천에서 자동 제외
- 학번 기반 교양필수 규정 자동 적용

### 2. 학기 일정 관리

```
강의계획서 PDF
    └─ Upstage Document Parse (OCR)
    └─ Solar LLM 일정 추출 (수업 · 시험 · 과제 · 퀴즈 · 발표)
    └─ Google Calendar API 자동 등록
```

- 강의명 · 교수명 · 강의실 · 수업 요일/시간 자동 추출
- 중간고사 · 기말고사 · 과제 마감 · 퀴즈 일정 포함
- 구글 로그인 연동 → 원클릭으로 캘린더에 반영

### 3. 공지 통합 조회

```
학과 + 키워드 선택
    └─ 학과 공지 · 포털 공지 크롤링
    └─ 통합 목록 반환
```

- 학과공지 · 비교과 · **학사 공지** 탭으로 분류
- 장학금 · 취업 · 학사 등 카테고리 필터
- **AI 맞춤 분석 카드**: 저장된 학과 · 진로 · 남은 학기 기반 맞춤 공지 분석 표시
- 기간형 공지의 dateRange 뱃지 표시

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| **AI / LLM** | [Upstage Solar LLM](https://upstage.ai) (`solar-pro`) |
| **문서 처리** | [Upstage Document Parse](https://upstage.ai) (PDF OCR) |
| **워크플로우 자동화** | [n8n](https://n8n.io) (로우코드, 셀프호스팅) |
| **프론트엔드** | Next.js 16 + React 19, TypeScript |
| **캘린더 연동** | Google Calendar API (OAuth 2.0) |
| **배포** | Vercel (프론트) + n8n 로컬/셀프호스팅 (`N8N_BASE_URL` 환경변수로 연결) |

---

## 아키텍처

```
[모바일 브라우저]
       │ PDF base64 + 메타데이터
       ▼
[Next.js API Route]  (/api/graduation | /api/syllabus | /api/notice)
       │ HTTP POST
       ▼
[n8n Webhook]
       │
       ├─ [Upstage Document Parse] ← PDF OCR
       │
       ├─ [학과 홈페이지 HTTP 요청] ← 졸업요건 자동 수집
       │
       ├─ [Merge Node] ← 이수표 + 졸업요건 병합
       │
       ├─ [Code Node] ← Solar LLM 프롬프트 구성 (JSON.stringify)
       │
       ├─ [Upstage Solar LLM API] ← 분석 / 일정 추출
       │
       └─ [Google Calendar API] ← 일정 자동 등록 (syllabus)
       │
       ▼
[Next.js] → 마크다운 렌더링 (ReactMarkdown + remark-gfm)
```

---

## n8n 워크플로우 구성

### 졸업요건 분석 워크플로우

```
Webhook (POST /graduation)
  → Base64 디코딩 + Upstage Document Parse
  → 학과 홈페이지 HTTP 요청 (졸업요건 크롤링)
  → Merge (이수표 텍스트 + 졸업요건 텍스트)
  → Code Node: Solar LLM 요청 본문 구성 (SYSTEM_PROMPT 내장)
  → HTTP Request: Upstage Solar LLM API 호출
  → Respond to Webhook (마크다운 텍스트 반환)
```

### 강의계획서 분석 워크플로우

```
Webhook (POST /syllabus)
  → Upstage Document Parse (PDF OCR)
  → Code Node: 일정 추출 프롬프트 구성
  → Upstage Solar LLM API (수업·시험·과제·퀴즈·발표 추출)
  → Code Node: Google Calendar 이벤트 객체 변환
  → Google Calendar API (이벤트 생성)
  → Respond to Webhook (추출된 일정 JSON 반환)
```

### 공지 통합 조회 워크플로우

```
Webhook (POST /notice)
  → 학과 공지 HTTP 요청 + 포털 공지 HTTP 요청 (병렬)
  → Merge → 정렬 · 필터
  → Respond to Webhook (공지 목록 JSON 반환)
```

---

## 로컬 실행

### 사전 준비

- Node.js 18+
- n8n (셀프호스팅 또는 n8n Cloud)
- Upstage API Key
- Google Calendar OAuth 자격증명

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### n8n 워크플로우 불러오기

1. n8n 대시보드 → `Import workflow`
2. `workflow_snolearning_all.json` 업로드
3. Upstage API Key, Google Calendar 자격증명 설정
4. 워크플로우 활성화

### 환경 변수

n8n 워크플로우 내 credential로 관리:

| 항목 | 설정 위치 |
|------|----------|
| Upstage API Key | n8n Credentials → HTTP Header Auth |
| Google Calendar | n8n Credentials → Google OAuth2 |

프론트엔드 환경 변수 (`.env.local`):

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `N8N_BASE_URL` | `http://localhost:5678` | n8n 웹훅 베이스 URL |

---

## 주요 설계 결정

### PDF OCR에 Upstage Document Parse 사용
이수표·강의계획서는 표 구조가 복잡해 일반 텍스트 추출로는 열/행 관계 파악이 어렵습니다. Upstage Document Parse는 표 구조를 마크다운 형태로 보존해 LLM이 학점 집계를 정확하게 수행할 수 있습니다.

### JSON 직렬화를 Code Node에서 처리
n8n의 `jsonBody` 템플릿 내에 시스템 프롬프트를 직접 삽입하면 줄바꿈 문자로 인해 `Bad control character in JSON` 오류가 발생합니다. Code Node에서 `JSON.stringify()`로 전체 요청 본문을 구성한 뒤 HTTP Request Node에 객체로 전달하는 방식으로 해결했습니다.

### 로드맵에서 수강 중 과목 제외
이수표의 `*` 표기(현재 수강 중, 성적 미확정) 과목을 AI가 "수강하지 않은 과목"으로 오인해 추천하는 문제를 그룹 분류(완료/수강중/미수강)로 명확히 구분해 해결했습니다.

---

## 한계 및 유의사항

- 분석 결과는 AI 생성 참고 자료입니다. 학사 시스템에서 반드시 최종 확인하세요.
- 학과별 세부 규정(교직 이수, 트랙 등)은 AI가 정확히 파악하지 못할 수 있습니다.
- n8n이 실행 중이어야 기능이 동작합니다. (`N8N_BASE_URL` 환경변수로 엔드포인트 지정)

---

## 개발 환경

- **대상**: 숙명여자대학교 재학생
- **플랫폼**: 모바일 웹 (PWA 형태)
- **제작**: Upstage 로우코드 해커톤 출품작
