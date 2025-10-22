# 코드베이스 리팩토링 분석 (2025-10-22)

## 프로젝트 개요
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS v4
- **Backend**: FastAPI + Python 3.12 + MongoDB (Motor)
- **인증**: JWT (Access/Refresh 토큰)

## 주요 발견사항

### 🟢 잘된 부분

1. **타입 안정성**: TypeScript 인터페이스가 잘 정의되어 있음
2. **인증 아키텍처**: Access/Refresh 토큰 패턴이 올바르게 구현됨
3. **컴포넌트 구조**: 폴더 구조가 기능별로 잘 분리됨
4. **무한 스크롤**: useReducer + Intersection Observer로 깔끔하게 구현

### 🟡 리팩토링 필요 영역

#### 1. **코드 중복 (DRY 위반)**
- **서비스 레이어**: `handleResponse()` 함수가 각 서비스 파일마다 중복됨
- **API_BASE_URL**: 3개 서비스 파일에 동일하게 선언됨
- **Helper 함수**: `post_helper`, `comment_helper`, `user_helper`가 유사한 패턴

#### 2. **백엔드 구조 (main.py가 너무 큼)**
- **단일 파일 972줄**: 라우터, 모델, 헬퍼가 모두 한 파일에
- **관심사 분리 부족**: CRUD, 인증, 모델 정의가 섞여 있음

#### 3. **에러 처리**
- **프론트엔드**: 일관되지 않은 에러 처리 (일부는 console.error, 일부는 throw)
- **백엔드**: 모든 에러가 HTTPException으로만 처리됨 (커스텀 에러 클래스 없음)

#### 4. **타입 정의**
- **응답 변환**: Pydantic의 alias_generator가 3번 중복 정의됨
- **ObjectId 검증**: `validate_object_id()`가 반복적으로 호출됨

#### 5. **설정 관리**
- **하드코딩**: CORS origins이 하드코딩됨
- **환경 변수**: .env 사용하지만 일부 기본값이 코드에 남아있음

### ⚠️ 잠재적 문제

1. **성능**: 
   - `post_helper()`에서 매번 author lookup (N+1 쿼리)
   - 댓글 수 계산이 매 요청마다 발생

2. **보안**:
   - JWT_SECRET_KEY 검증 부족
   - Rate limiting 없음

3. **확장성**:
   - 전역 database 변수 사용 (의존성 주입 권장)
   - 라우터가 모두 main.py에

## 제안 리팩토링 계획

### Phase 1: 백엔드 구조 개선 (우선순위 높음)

```
backend/
├── routers/
│   ├── posts.py      # 게시글 라우터
│   ├── comments.py   # 댓글 라우터
│   └── auth.py       # 인증 라우터 (기존 auth.py 확장)
├── models/
│   ├── post.py       # Post 모델들
│   ├── comment.py    # Comment 모델들
│   └── user.py       # User 모델들
├── services/
│   ├── post_service.py     # 비즈니스 로직
│   ├── comment_service.py
│   └── user_service.py
├── core/
│   ├── config.py     # 설정 관리
│   ├── database.py   # DB 연결 관리
│   └── security.py   # 보안 유틸 (auth.py에서 분리)
├── utils/
│   └── helpers.py    # 공통 헬퍼 함수
└── main.py           # 앱 진입점 (라우터 등록만)
```

### Phase 2: 프론트엔드 개선

#### 2.1 서비스 레이어 통합
```typescript
// src/services/api/config.ts
export const API_BASE_URL = "http://localhost:8000/api";

// src/services/api/client.ts
export async function handleResponse<T>(response: Response): Promise<T> {
  // 공통 응답 처리 로직
}

// src/services/api/index.ts
export { API_BASE_URL, handleResponse };
```

#### 2.2 에러 처리 개선
```typescript
// src/utils/errors.ts
export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}
```

#### 2.3 커스텀 훅 추출
```typescript
// src/hooks/usePosts.ts - 무한 스크롤 로직 재사용
export function usePosts(searchQuery: string, sortBy: string) {
  // Home.tsx의 로직 추출
}
```

### Phase 3: 성능 최적화

1. **백엔드**: 
   - Aggregation으로 N+1 쿼리 해결
   - Redis 캐싱 (좋아요 수, 댓글 수)

2. **프론트엔드**:
   - React.memo로 PostCard 최적화
   - useMemo로 검색 결과 메모이제이션

### Phase 4: 타입 안정성 강화

- Zod로 런타임 검증 추가
- API 응답 타입 자동 생성 (openapi-typescript)

## 우선순위 매트릭스

| 리팩토링 항목 | 영향도 | 난이도 | 우선순위 |
|------------|-------|-------|---------|
| 백엔드 라우터 분리 | 높음 | 중간 | ⭐⭐⭐ |
| 서비스 레이어 중복 제거 | 중간 | 낮음 | ⭐⭐⭐ |
| N+1 쿼리 해결 | 높음 | 중간 | ⭐⭐ |
| 에러 처리 개선 | 중간 | 낮음 | ⭐⭐ |
| 환경 설정 관리 | 낮음 | 낮음 | ⭐ |
