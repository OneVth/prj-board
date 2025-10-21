from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

# MongoDB 연결 설정
MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "board"

# 전역 변수 (앱 시작 시 초기화됨)
mongodb_client: AsyncIOMotorClient = None
database = None

# ============================================
# Pydantic 모델 정의
# ============================================


class PyObjectId(str):
    """
    MongoDB ObjectId를 Pydantic에서 사용하기 위한 커스텀 타입
    """

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


class PostCreate(BaseModel):
    """
    게시글 작성 시 사용하는 모델
    - title: 게시글 제목 (필수)
    - content: 게시글 본문 (필수)
    """

    title: str = Field(..., min_length=1, max_length=200, description="게시글 제목")
    content: str = Field(..., min_length=1, description="게시글 본문")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "첫 번째 게시글",
                    "content": "FastAPI와 MongoDB로 만든 게시판입니다.",
                }
            ]
        }
    }


class PostUpdate(BaseModel):
    """
    게시글 수정 시 사용하는 모델
    - title: 게시글 제목 (선택)
    - content: 게시글 본문 (선택)
    """

    title: Optional[str] = Field(
        None, min_length=1, max_length=200, description="게시글 제목"
    )
    content: Optional[str] = Field(None, min_length=1, description="게시글 본문")

    model_config = {
        "json_schema_extra": {
            "examples": [{"title": "수정된 제목", "content": "수정된 내용입니다."}]
        }
    }


class PostResponse(BaseModel):
    """
    게시글 응답 모델
    - id: 게시글 ID (MongoDB ObjectId를 문자열로 변환)
    - title: 게시글 제목
    - content: 게시글 본문
    - created_at: 생성 시간 (ISO 8601 형식)
    - likes: 좋아요 수
    """

    id: str = Field(..., alias="_id")
    title: str
    content: str
    created_at: str
    likes: int = 0

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": "507f1f77bcf86cd799439011",
                    "title": "첫 번째 게시글",
                    "content": "게시글 내용입니다.",
                    "created_at": "2025-10-21T10:30:00.000Z",
                    "likes": 5,
                }
            ]
        },
    }


class PostListResponse(BaseModel):
    """
    게시글 목록 응답 모델 (페이지네이션)
    - posts: 게시글 배열
    - total_posts: 전체 게시글 수
    - current_page: 현재 페이지
    - total_pages: 전체 페이지 수
    """

    posts: list[PostResponse]
    total_posts: int
    current_page: int
    total_pages: int


# ============================================
# 헬퍼 함수
# ============================================


def post_helper(post) -> dict:
    """
    MongoDB 문서를 PostResponse 형식으로 변환
    """
    return {
        "_id": str(post["_id"]),
        "title": post["title"],
        "content": post["content"],
        "created_at": post["created_at"],
        "likes": post.get("likes", 0),
    }


# ============================================
# 나머지 코드
# ============================================


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
        "database": DATABASE_NAME,
    }  # JSON 응답 (자동 직렬화)


# 헬스체크 엔드포인트
@app.get("/health")
async def health_check():
    """
    서버 및 데이터베이스 헬스체크 엔드포인트
    """
    try:
        # MongoDB 연결 상태 확인
        await mongodb_client.admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {e}"
    return {"status": "healthy", "database": db_status}


# ============================================
# 테스트 엔드포인트 (모델 확인용)
# ============================================


@app.post("/api/posts/test", response_model=PostResponse, tags=["Test"])
async def test_post_create(post: PostCreate):
    """
    Pydantic 모델 테스트용 엔드포인트
    실제로 데이터를 저장하지 않고 입력값을 그대로 반환합니다.
    """
    return {
        "id": "507f1f77bcf86cd799439011",
        "title": post.title,
        "content": post.content,
        "created_at": "2025-10-21T10:30:00.000Z",
        "likes": 0,
    }


@app.get("/api/posts/test-list", response_model=PostListResponse, tags=["Test"])
async def test_post_list():
    """
    PostListResponse 모델 테스트용 엔드포인트
    """
    return {
        "posts": [
            {
                "_id": "507f1f77bcf86cd799439011",
                "title": "테스트 게시글 1",
                "content": "테스트 내용 1",
                "created_at": "2025-10-21T10:30:00.000Z",
                "likes": 3,
            },
            {
                "_id": "507f1f77bcf86cd799439012",
                "title": "테스트 게시글 2",
                "content": "테스트 내용 2",
                "created_at": "2025-10-21T11:00:00.000Z",
                "likes": 7,
            },
        ],
        "total_posts": 2,
        "current_page": 1,
        "total_pages": 1,
    }
