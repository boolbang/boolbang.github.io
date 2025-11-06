# 보안 가이드

## Firebase 설정 보안

### 현재 상태
- Firebase API 키가 `/js/firebase-config.js`에 공개되어 있습니다.
- 이는 클라이언트 사이드 웹 앱에서는 일반적이지만, 추가 보안 조치가 필요합니다.

### 권장 보안 조치

#### 1. Firebase 보안 규칙 설정
Firebase Console에서 보안 규칙을 설정하여 데이터 접근을 제한하세요:

```javascript
// Firestore 보안 규칙 예시
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // posts 컬렉션: 읽기는 모두 허용, 쓰기는 인증된 사용자만
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // scores 컬렉션: 읽기는 모두 허용, 쓰기는 제한
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if request.resource.data.score is number
                    && request.resource.data.name is string;
      allow update, delete: if false;
    }
  }
}
```

#### 2. Firebase API 키 제한
Firebase Console → 프로젝트 설정 → API 제한사항에서:
- HTTP 리퍼러(웹사이트) 제한 추가
- `https://www.boolbang.com/*` 같은 도메인만 허용

#### 3. App Check 활성화 (선택사항)
Firebase App Check를 활성화하여 인증된 앱에서만 접근 가능하도록 설정

#### 4. 환경변수 사용 (향후 개선)
빌드 프로세스 도입시 환경변수로 관리:
```bash
# .env 파일
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
```

## Git 보안

### 민감한 정보 커밋 방지
- `.env` 파일은 절대 커밋하지 마세요
- `.env.example` 파일만 커밋하세요
- API 키가 실수로 커밋된 경우 즉시 키를 재생성하세요

### 이미 커밋된 민감한 정보 제거
```bash
# Git 히스토리에서 파일 완전 제거
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch js/firebase-config.js" \
  --prune-empty --tag-name-filter cat -- --all

# 또는 BFG Repo-Cleaner 사용 권장
```

## 정기 보안 점검 체크리스트

- [ ] Firebase 보안 규칙 검토
- [ ] API 키 제한 설정 확인
- [ ] 사용하지 않는 Firebase 기능 비활성화
- [ ] 의심스러운 접근 로그 확인
- [ ] 의존성 라이브러리 보안 업데이트

## 문의
보안 이슈 발견시: fromboolbang@gmail.com
