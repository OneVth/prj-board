from fastapi import FastAPI

# FastAPI 앱 인스턴스 생성
app = FastAPI(
    title="Board API",  # Swagger UI 제목
    description="소셜 미디어 스타일 게시판 API",  # API 설명
    version="1.0.0",  # API 버전
)


# 기본 라우트 (루트 경로)
@app.get("/")  # HTTP GET 메서드, "/" 경로
async def root():  # 비동기 함수 (async)
    """
    API 상태 확인 엔드포인트
    """
    return {
        "message": "Board API is running!",
        "version": "1.0.0",
    }  # JSON 응답 (자동 직렬화)


# 헬스체크 엔드포인트
@app.get("/health")
async def health_check():
    """
    서버 헬스체크 엔드포인트
    """
    return {"status": "healthy"}
