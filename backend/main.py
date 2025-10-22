"""
Board API - 소셜 미디어 스타일 게시판 API
FastAPI 메인 애플리케이션 (모듈화된 구조)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import connect_to_mongo, close_mongo_connection
from routers import posts_router, comments_router, auth_router, users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()


# FastAPI 앱 인스턴스
app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS 미들웨어
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(auth_router)
app.include_router(users_router)


# 기본 엔드포인트
@app.get("/")
async def root():
    """API 상태 확인 엔드포인트"""
    return {
        "message": "Board API is running!",
        "version": settings.APP_VERSION,
        "database": settings.DATABASE_NAME,
    }


@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    from core.database import mongodb_client

    try:
        await mongodb_client.admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {e}"

    return {"status": "healthy", "database": db_status}
