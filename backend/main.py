from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager

# MongoDB 연결 설정
MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "board"

# 전역 변수 (앱 시작 시 초기화됨)
mongodb_client: AsyncIOMotorClient = None
database = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI 앱의 생명주기 관리
    - startup: 앱 시작 시 실행
    - shutdown: 앱 종료 시 실행
    """
    # Startup: MongoDB 연결
    global mongodb_client, database

    print("🔌 Connecting to MongoDB...")
    mongodb_client = AsyncIOMotorClient(MONGO_URL)
    database = mongodb_client[DATABASE_NAME]

    # 연결 테스트
    try:
        await mongodb_client.admin.command("ping")
        print("✅ MongoDB connection successful!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

    await create_indexes()

    yield  # 여기서 앱이 실행됨

    # Shutdown: MongoDB 연결 종료
    print("🔌 Closing MongoDB connection...")
    mongodb_client.close()
    print("✅ MongoDB connection closed!")


async def create_indexes():
    """
    posts 컬렉션에 인덱스 생성
    - created_at: 내림차순 정렬을 위한 인덱스
    """
    posts_collection = database["posts"]

    # created_at 필드에 내림차순 인덱스 생성
    await posts_collection.create_index([("created_at", -1)])
    print("✅ Indexes created successfully!")


# FastAPI 앱 인스턴스 생성
app = FastAPI(
    title="Board API",  # Swagger UI 제목
    description="소셜 미디어 스타일 게시판 API",  # API 설명
    version="1.0.0",  # API 버전
    lifespan=lifespan,  # 생명주기 관리
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
        "database": DATABASE_NAME
    }  # JSON 응답 (자동 직렬화)


# 헬스체크 엔드포인트
@app.get("/health")
async def health_check():
    """
    서버 및 데이터베이스 헬스체크 엔드포인트
    """
    try:
        # MongoDB 연결 상태 확인
        await mongodb_client.admin.command('ping')
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {e}"
    return {"status": "healthy", "database": db_status}
