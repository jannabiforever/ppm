# 📘 Project Protocol Manager

**Project Protocol Manager**는 여러 프로젝트를 병렬로 운영하는 개인이 각 프로젝트별 시간 프로토콜을 정의하고, 시간 사용을 계획·기록·시각화하며, 노트 기반의 회고까지 할 수 있도록 돕는 로컬 기반 생산성 앱입니다.

---

## 🧱 기술 스택

- **Frontend**: SvelteKit  
- **UI Framework**: TailwindCSS  
- **DB**: SQLite (via Prisma) 또는 SurrealDB (선택 가능)  
- **Charts**: Recharts or Chart.js  
- **지원 포맷**: PNG, PDF, TXT, MD  
- **배포 형태**: 로컬 앱 또는 Tauri 연계 (선택)

---

## ✅ 핵심 기능

### 1. 프로젝트 프로토콜 관리

- 프로젝트별 핵심 정보 입력  
  - 이름, 중요도, 주간 목표 시간, 일일 최대 집중 가능 시간, 선호 장소, 시간대
- 모든 프로젝트는 이 데이터를 기반으로 스케줄링

### 2. 주간 시간 계획

- 가용 시간대 블록 설정 (ex. 월–금, 08–17)
- 각 프로젝트에 시간 할당  
  - 자동 분배: 프로토콜 기반 제안  
  - 수동 배정: Drag & Drop  
- 초과 감지 및 경고 (일일 상한 / 주간 목표 초과)

### 3. 일간 시간 기록

- 날짜, 프로젝트, 소요 시간, 간단한 메모 입력
- 일간 누적 시간 자동 계산
- 프로젝트별 진행률 추적

### 4. 시각화 대시보드

- 막대그래프: 프로젝트별 누적 시간 vs 목표 시간  
- 원형그래프: 주간 전체 시간 분배  
- 경고 알림: 과도한 몰입 / 미달 프로젝트 강조 표시

### 5. 프로젝트 노트 기능

- 각 프로젝트마다 노트는 1개만 존재  
- Envelope Note 형식 (자유롭게 끄적이는 메모들의 시간순 기록)
- 시간 기록과는 별도로 수시로 작성 가능
- Markdown 에디터 지원 및 정렬 방식 선택

### 6. 회고 및 계획 보정

- 하루 종료 시 회고 노트 작성 가능
- 수정 필요 작업 이월 처리
- 자동 재계획 기능

### 7. 파일 내보내기 지원

| 포맷 | 지원 대상 |
|------|------------|
| PNG | 주간 계획표 스크린샷 or 차트 이미지 저장 |
| PDF | 프로젝트별 전체 시간 기록 및 노트 내보내기 |
| TXT | 프로젝트 노트 내보내기 |
| MD  | 프로젝트 노트 마크다운 내보내기 |

---

## 🗃️ DB 모델 요약 (SurrealDB 기준)

SurrealDB는 스키마리스 구조를 가질 수 있지만, 다음과 같이 문서형 데이터 형태로 구성합니다.

```sql
-- 프로젝트 문서 예시
DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD name ON project TYPE string;
DEFINE FIELD priority ON project TYPE string;
DEFINE FIELD weekly_goal_minutes ON project TYPE int;
DEFINE FIELD daily_max_minutes ON project TYPE int;
DEFINE FIELD location ON project TYPE string;
DEFINE FIELD preferred_slots ON project TYPE array;

-- 시간 기록 예시
DEFINE TABLE time_log SCHEMAFULL;
DEFINE FIELD project_id ON time_log TYPE record(project);
DEFINE FIELD date ON time_log TYPE datetime;
DEFINE FIELD duration ON time_log TYPE int;
DEFINE FIELD note ON time_log TYPE string;

-- 프로젝트 노트 예시
DEFINE TABLE project_note SCHEMAFULL;
DEFINE FIELD project_id ON project_note TYPE record(project);
DEFINE FIELD timestamp ON project_note TYPE datetime;
DEFINE FIELD content ON project_note TYPE string;
```
---

## 🧭 사용 흐름 요약

1. 프로젝트 등록 + 프로토콜 작성
2. 가용 시간 블록 설정 → 주간 계획 수립
3. 일일 시간 기록 + 노트 작성
4. 시각화 → 회고 → 계획 수정
5. 원하는 형식으로 결과 내보내기 (.png, .pdf, .md, .txt)
