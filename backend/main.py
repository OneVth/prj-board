from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime


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

    id: str
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
        "id": str(post["_id"]),  # _id를 id로 변환하여 프론트엔드에 전달
        "title": post["title"],
        "content": post["content"],
        "created_at": post.get("created_at", "1970-01-01T00:00:00.000Z"),
        "likes": post.get("likes", 0),
    }


def validate_object_id(post_id: str) -> ObjectId:
    """
    ObjectId 유효성 검증 및 변환

    Args:
        post_id: 검증할 ID 문자열

    Returns:
        ObjectId: 변환된 ObjectId 객체

    Raises:
        HTTPException: ID가 유효하지 않을 경우 400 에러
    """
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid post ID format"
        )
    return ObjectId(post_id)


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

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:5174",  # Vite alternative port
        "http://localhost:5175",
        "http://localhost:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE, PATCH 모두 허용
    allow_headers=["*"],  # Content-Type, Authorization 등 모두 허용
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
# CRUD API 엔드포인트
# ============================================


@app.get("/api/posts", response_model=PostListResponse, tags=["Posts"])
async def get_posts(page: int = 1, limit: int = 10):
    """
    게시글 목록 조회 (페이지네이션)
    - **page**: 페이지 번호 (기본값: 1)
    - **limit**: 페이지당 게시글 수 (기본값: 10, 최대: 100)
    """
    # limit 최대값 제한
    limit = min(limit, 100)

    # skip 계산 (오프셋)
    skip = (page - 1) * limit

    posts_collection = database["posts"]

    # 전체 게시글 수
    total_posts = await posts_collection.count_documents({})

    # 페이지네이션된 게시글 조회 (created_at 내림차순)
    cursor = posts_collection.find().sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)

    # 전체 페이지 수 계산
    total_pages = (total_posts + limit - 1) // limit

    return {
        "posts": [post_helper(post) for post in posts],
        "total_posts": total_posts,
        "current_page": page,
        "total_pages": total_pages,
    }


@app.get("/api/posts/{post_id}", response_model=PostResponse, tags=["Posts"])
async def get_post(post_id: str):
    """
    게시글 상세 조회
    - **post_id**: 게시글 ID (MongoDB ObjectId)
    """
    # ObjectId 유효성 검증
    object_id = validate_object_id(post_id)

    posts_collection = database["posts"]

    # 게시글 조회
    post = await posts_collection.find_one({"_id": object_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    return post_helper(post)


@app.post(
    "/api/posts",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Posts"],
)
async def create_post(post: PostCreate):
    """
    게시글 작성
    - **title**: 게시글 제목 (1-200자)
    - **content**: 게시글 본문 (1자 이상)
    """
    posts_collection = database["posts"]

    # 새 게시글 문서 생성
    new_post = {
        "title": post.title,
        "content": post.content,
        "created_at": datetime.utcnow().isoformat() + "Z",  # ISO 8601 형식
        "likes": 0,
    }

    # MongoDB에 삽입
    result = await posts_collection.insert_one(new_post)

    # 삽입된 문서 조회
    created_post = await posts_collection.find_one({"_id": result.inserted_id})

    return post_helper(created_post)


@app.put("/api/posts/{post_id}", response_model=PostResponse, tags=["Posts"])
async def update_post(post_id: str, post: PostUpdate):
    """
    게시글 수정
    - **post_id**: 게시글 ID
    - **title**: 수정할 제목 (선택)
    - **content**: 수정할 본문 (선택)
    """
    # ObjectId 유효성 검증
    object_id = validate_object_id(post_id)

    posts_collection = database["posts"]

    # 업데이트할 필드만 추출 (None이 아닌 값만)
    update_data = {}
    if post.title is not None:
        update_data["title"] = post.title
    if post.content is not None:
        update_data["content"] = post.content

    # 업데이트할 데이터가 없으면 에러
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    # 게시글 업데이트
    result = await posts_collection.update_one(
        {"_id": object_id}, {"$set": update_data}
    )

    # 업데이트된 문서가 없으면 404
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    # 업데이트된 문서 조회
    updated_post = await posts_collection.find_one({"_id": object_id})

    return post_helper(updated_post)


@app.delete("/api/posts/{post_id}", tags=["Posts"])
async def delete_post(post_id: str):
    """
    게시글 삭제
    - **post_id**: 게시글 ID
    """
    # ObjectId 유효성 검증
    object_id = validate_object_id(post_id)

    posts_collection = database["posts"]

    # 게시글 삭제
    result = await posts_collection.delete_one({"_id": object_id})

    # 삭제된 문서가 없으면 404
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    return {"message": f"Post with id {post_id} deleted successfully"}


@app.patch("/api/posts/{post_id}/like", response_model=PostResponse, tags=["Posts"])
async def like_post(post_id: str):
    """
    게시글 좋아요 증가
    - **post_id**: 게시글 ID
    """
    # ObjectId 유효성 검증
    object_id = validate_object_id(post_id)

    posts_collection = database["posts"]

    # likes 필드 1 증가
    result = await posts_collection.update_one(
        {"_id": object_id}, {"$inc": {"likes": 1}}  # $inc: 숫자 증가 연산자
    )

    # 업데이트된 문서가 없으면 404
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    # 업데이트된 문서 조회
    updated_post = await posts_collection.find_one({"_id": object_id})

    return post_helper(updated_post)
