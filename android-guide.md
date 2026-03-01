# 🤖 안드로이드 운동 자동 기록 가이드

> MacroDroid 앱을 사용하여 운동 완료 시 키웁에 자동으로 기록하는 방법

---

## 📌 전체 흐름

```
워치/밴드에서 운동 완료
  → 삼성헬스(또는 다른 건강 앱) 알림 발생
  → MacroDroid가 알림 감지
  → Firebase에 자동으로 완료 기록
  → 키웁 앱에서 자동 반영 ✅
```

---

## 1단계: MacroDroid 설치

1. Play Store에서 **MacroDroid** 검색 → 설치 (무료, 매크로 5개까지 무료)
2. 앱 실행 → 알림 접근 권한 **허용**

---

## 2단계: 키웁에서 내 정보 확인

키웁 앱에서 습관 상세 화면(바텀시트)을 열면 아래 정보가 표시됩니다:

- **단축어 키**: `g3` (예시, 본인 습관의 번호 확인)
- **내 유저 ID**: 키웁 로그인 ID (예: `jin`)

> ⚠️ 이 두 값은 MacroDroid 설정 시 반드시 필요합니다.

---

## 3단계: MacroDroid 매크로 만들기

### 🔔 트리거 설정

1. MacroDroid 열기 → **매크로 추가** → 트리거 탭
2. **Notification** (알림) 선택
3. 앱 선택: **Samsung Health** (또는 사용 중인 건강 앱)
4. 알림 텍스트 조건:
   - "Contains text" → **운동** 입력
   - (영문 앱이면 **Workout** 또는 **Exercise**)

### ⚡ 액션 설정

1. 액션 탭 → **Open Website / HTTP GET**
2. **HTTP GET 대신 HTTP Request (커스텀)** 선택
3. 아래 값 입력:

| 항목 | 값 |
|---|---|
| Method | **PUT** |
| URL | 아래 참고 |
| Body | `true` |
| Content Type | `application/json` |

**URL 형식:**

```
https://grow-goal-default-rtdb.firebaseio.com/dashboards/내유저ID/completions/g번호_{year}_{month}_{day}.json
```

**실제 예시** (유저 ID: `jin`, 습관 키: `g3`):

```
https://grow-goal-default-rtdb.firebaseio.com/dashboards/jin/completions/g3_{year}_{month}_{day}.json
```

### 📅 날짜 자동 삽입 (매직 텍스트)

MacroDroid에서 URL 입력 시 날짜 부분을 직접 타이핑하지 말고 **매직 텍스트**를 사용하세요:

- `{year}` → 현재 연도 (2026)
- `{month}` → 현재 월 (3)
- `{day_of_month}` → 현재 일 (1)

**최종 URL 입력값:**

```
https://grow-goal-default-rtdb.firebaseio.com/dashboards/jin/completions/g3_{year}_{month}_{day_of_month}.json
```

> 💡 MacroDroid 매직 텍스트 삽입: URL 입력 필드에서 **{ }** 아이콘을 탭하면 목록이 나옵니다.

---

## 4단계: 테스트

1. 매크로 저장 후 **활성화**
2. 삼성헬스에서 운동 하나 기록 (짧게 걷기 등)
3. 키웁 앱 새로고침 → 해당 습관에 오늘 날짜 체크 확인

---

## 🔧 운동 여러 개일 때

운동 종류마다 별도 매크로를 만드세요:

| 운동 | 키웁 습관 키 | 알림 텍스트 조건 |
|---|---|---|
| 달리기 | g3 | "달리기" 또는 "Running" |
| 웨이트 | g4 | "웨이트" 또는 "Strength" |
| 수영 | g5 | "수영" 또는 "Swimming" |

> 알림 텍스트 조건을 운동 종류에 맞게 설정하면 각각 다른 습관에 기록됩니다.

---

## ❓ 문제 해결

| 증상 | 해결 |
|---|---|
| 알림 감지 안 됨 | 설정 → 앱 → MacroDroid → 알림 접근 허용 확인 |
| 배터리 최적화로 중단 | 설정 → 배터리 → MacroDroid → 제한 없음 |
| Firebase 기록 실패 | URL의 유저ID와 g번호 확인, 인터넷 연결 확인 |
| 날짜가 이상하게 들어감 | 매직 텍스트 `{year}_{month}_{day_of_month}` 확인 |

---

## 📱 지원하는 건강 앱

Samsung Health 외에도 알림이 발생하는 앱이면 모두 사용 가능:

- Samsung Health
- Google Fit / Health Connect
- Mi Fitness (샤오미)
- Zepp (어메이즈핏)
- Huawei Health

트리거에서 해당 앱을 선택하고, 알림 텍스트 조건만 맞추면 됩니다.
