from fastapi import FastAPI, HTTPException, status, Depends, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

# 인증 관련 imports
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    get_current_user,
    get_refresh_token_from_cookie,
    set_refresh_token_cookie,
    clear_refresh_token_cookie,
    TokenData,
    TokenPair,
)

# .env 파일 로드
load_dotenv()

# MongoDB 연결 설정
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "board_db")

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


class CommentCreate(BaseModel):
    """
    댓글 작성 시 사용하는 모델
    - content: 댓글 내용 (필수)
    - author: 작성자 이름 (필수, 임시)
    """

    content: str = Field(..., min_length=1, max_length=500, description="댓글 내용")
    author: str = Field(..., min_length=1, max_length=50, description="작성자 이름")

    model_config = {
        "json_schema_extra": {
            "examples": [{"content": "좋은 글이네요!", "author": "익명"}]
        }
    }


class CommentResponse(BaseModel):
    """
    댓글 응답 모델
    - id: 댓글 ID
    - post_id: 게시글 ID
    - content: 댓글 내용
    - author: 작성자 이름
    - created_at: 생성 시간
    - likes: 좋아요 수
    """

    id: str
    post_id: str
    content: str
    author: str
    created_at: str
    likes: int = 0

    model_config = {
        "populate_by_name": True,
        "alias_generator": lambda field_name: "".join(
            word.capitalize() if i > 0 else word
            for i, word in enumerate(field_name.split("_"))
        ),
        "by_alias": True,
    }


# ============================================
# User 관련 모델
# ============================================


class UserRegister(BaseModel):
    """회원가입 시 사용하는 모델"""

    username: str = Field(..., min_length=3, max_length=50, description="사용자 이름")
    email: EmailStr = Field(..., description="이메일 주소")
    password: str = Field(..., min_length=6, description="비밀번호")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "johndoe",
                    "email": "john@example.com",
                    "password": "password123",
                }
            ]
        }
    }


class UserLogin(BaseModel):
    """로그인 시 사용하는 모델"""

    email: EmailStr = Field(..., description="이메일 주소")
    password: str = Field(..., description="비밀번호")

    model_config = {
        "json_schema_extra": {
            "examples": [{"email": "john@example.com", "password": "password123"}]
        }
    }


class UserResponse(BaseModel):
    """사용자 정보 응답 모델"""

    id: str
    username: str
    email: str
    created_at: str

    model_config = {
        "populate_by_name": True,
        "alias_generator": lambda field_name: "".join(
            word.capitalize() if i > 0 else word
            for i, word in enumerate(field_name.split("_"))
        ),
        "by_alias": True,
    }


class PostResponse(BaseModel):
    """
    게시글 응답 모델
    - id: 게시글 ID (MongoDB ObjectId를 문자열로 변환)
    - title: 게시글 제목
    - content: 게시글 본문
    - created_at: 생성 시간 (ISO 8601 형식)
    - likes: 좋아요 수
    - comment_count: 댓글 수
    - author_id: 작성자 ID
    - author_username: 작성자 이름
    """

    id: str
    title: str
    content: str
    created_at: str
    likes: int = 0
    comment_count: int = 0
    author_id: str
    author_username: str

    model_config = {
        "populate_by_name": True,
        # camelCase로 직렬화
        "alias_generator": lambda field_name: "".join(
            word.capitalize() if i > 0 else word
            for i, word in enumerate(field_name.split("_"))
        ),
        "by_alias": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": "507f1f77bcf86cd799439011",
                    "title": "첫 번째 게시글",
                    "content": "게시글 내용입니다.",
                    "created_at": "2025-10-21T10:30:00.000Z",
                    "likes": 5,
                    "commentCount": 3,
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

    model_config = {
        "populate_by_name": True,
        # camelCase로 직렬화
        "alias_generator": lambda field_name: "".join(
            word.capitalize() if i > 0 else word
            for i, word in enumerate(field_name.split("_"))
        ),
        "by_alias": True,
    }


# ============================================
# 헬퍼 함수
# ============================================


async def post_helper(post) -> dict:
    """
    MongoDB 문서를 PostResponse 형식으로 변환
    댓글 수와 작성자 정보를 함께 조회하여 반환
    """
    comments_collection = database["comments"]
    users_collection = database["users"]

    comment_count = await comments_collection.count_documents({"post_id": post["_id"]})

    # 작성자 정보 조회
    author_id = post.get("author_id")
    author_username = "Unknown"

    if author_id:
        author = await users_collection.find_one({"_id": ObjectId(author_id)})
        if author:
            author_username = author.get("username", "Unknown")

    return {
        "id": str(post["_id"]),  # _id를 id로 변환하여 프론트엔드에 전달
        "title": post["title"],
        "content": post["content"],
        "created_at": post.get("created_at", "1970-01-01T00:00:00.000Z"),
        "likes": post.get("likes", 0),
        "comment_count": comment_count,
        "author_id": str(author_id) if author_id else "",
        "author_username": author_username,
    }


def comment_helper(comment) -> dict:
    """
    MongoDB 문서를 CommentResponse 형식으로 변환
    """
    return {
        "id": str(comment["_id"]),
        "post_id": str(comment["post_id"]),
        "content": comment["content"],
        "author": comment["author"],
        "created_at": comment.get("created_at", "1970-01-01T00:00:00.000Z"),
        "likes": comment.get("likes", 0),
    }


def user_helper(user) -> dict:
    """
    MongoDB 문서를 UserResponse 형식으로 변환
    """
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "created_at": user.get("created_at", "1970-01-01T00:00:00.000Z"),
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
    컬렉션별 인덱스 생성
    - posts: created_at, likes, text search
    - users: email (unique), username (unique)
    """
    posts_collection = database["posts"]
    users_collection = database["users"]

    # Posts 인덱스
    await posts_collection.create_index([("created_at", -1)])
    await posts_collection.create_index([("likes", -1)])
    await posts_collection.create_index([("title", "text"), ("content", "text")])

    # Users 인덱스
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("username", unique=True)

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
async def get_posts(
    page: int = 1,
    limit: int = 10,
    q: str = None,
    sort: str = "date",
):
    """
    게시글 목록 조회 (페이지네이션, 검색, 정렬)
    - **page**: 페이지 번호 (기본값: 1)
    - **limit**: 페이지당 게시글 수 (기본값: 10, 최대: 100)
    - **q**: 검색어 (제목 및 본문 검색)
    - **sort**: 정렬 기준 (date=최신순, likes=좋아요순, comments=댓글순)
    """
    # limit 최대값 제한
    limit = min(limit, 100)

    # skip 계산 (오프셋)
    skip = (page - 1) * limit

    posts_collection = database["posts"]

    # 검색 쿼리 구성
    query = {}
    if q:
        query["$text"] = {"$search": q}

    # 전체 게시글 수
    total_posts = await posts_collection.count_documents(query)

    # 정렬 기준 설정
    sort_field = "created_at"
    sort_order = -1  # 내림차순

    if sort == "likes":
        sort_field = "likes"
    elif sort == "comments":
        # 댓글순은 aggregation이 필요하므로 별도 처리
        sort_field = None

    # 페이지네이션된 게시글 조회
    if sort_field:
        cursor = (
            posts_collection.find(query).sort(sort_field, sort_order).skip(skip).limit(limit)
        )
        posts = await cursor.to_list(length=limit)
    else:
        # 댓글순 정렬 (aggregation 사용)
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "comments",
                    "localField": "_id",
                    "foreignField": "post_id",
                    "as": "comments",
                }
            },
            {"$addFields": {"comment_count": {"$size": "$comments"}}},
            {"$sort": {"comment_count": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {"$project": {"comments": 0}},  # comments 필드 제거
        ]
        posts = await posts_collection.aggregate(pipeline).to_list(length=limit)

    # 전체 페이지 수 계산
    total_pages = (total_posts + limit - 1) // limit

    # 각 게시글에 대해 댓글 수를 포함하여 변환
    posts_with_comments = []
    for post in posts:
        posts_with_comments.append(await post_helper(post))

    return {
        "posts": posts_with_comments,
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

    return await post_helper(post)


@app.post(
    "/api/posts",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Posts"],
)
async def create_post(
    post: PostCreate, current_user: TokenData = Depends(get_current_user)
):
    """
    게시글 작성 (인증 필요)
    - **title**: 게시글 제목 (1-200자)
    - **content**: 게시글 본문 (1자 이상)
    """
    posts_collection = database["posts"]

    # 새 게시글 문서 생성 (작성자 정보 포함)
    new_post = {
        "title": post.title,
        "content": post.content,
        "created_at": datetime.utcnow().isoformat() + "Z",  # ISO 8601 형식
        "likes": 0,
        "author_id": current_user.user_id,  # 작성자 ID 저장
    }

    # MongoDB에 삽입
    result = await posts_collection.insert_one(new_post)

    # 삽입된 문서 조회
    created_post = await posts_collection.find_one({"_id": result.inserted_id})

    return await post_helper(created_post)


@app.put("/api/posts/{post_id}", response_model=PostResponse, tags=["Posts"])
async def update_post(
    post_id: str, post: PostUpdate, current_user: TokenData = Depends(get_current_user)
):
    """
    게시글 수정 (본인만 가능)
    - **post_id**: 게시글 ID
    - **title**: 수정할 제목 (선택)
    - **content**: 수정할 본문 (선택)
    """
    # ObjectId 유효성 검증
    object_id = validate_object_id(post_id)

    posts_collection = database["posts"]

    # 기존 게시글 조회 및 작성자 확인
    existing_post = await posts_collection.find_one({"_id": object_id})
    if not existing_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    # 작성자 본인 확인
    if existing_post.get("author_id") != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own posts",
        )

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
    await posts_collection.update_one({"_id": object_id}, {"$set": update_data})

    # 업데이트된 문서 조회
    updated_post = await posts_collection.find_one({"_id": object_id})

    return await post_helper(updated_post)


@app.delete("/api/posts/{post_id}", tags=["Posts"])
async def delete_post(post_id: str, current_user: TokenData = Depends(get_current_user)):
    """
    게시글 삭제 (본인만 가능)
    - **post_id**: 게시글 ID
    """
    # ObjectId 유효성 검증
    object_id = validate_object_id(post_id)

    posts_collection = database["posts"]

    # 기존 게시글 조회 및 작성자 확인
    existing_post = await posts_collection.find_one({"_id": object_id})
    if not existing_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    # 작성자 본인 확인
    if existing_post.get("author_id") != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own posts",
        )

    # 게시글 삭제
    await posts_collection.delete_one({"_id": object_id})

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

    return await post_helper(updated_post)


# ============================================
# Comment API 엔드포인트
# ============================================


@app.post(
    "/api/posts/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Comments"],
)
async def create_comment(post_id: str, comment: CommentCreate):
    """
    댓글 작성
    - **post_id**: 게시글 ID
    - **content**: 댓글 내용
    - **author**: 작성자 이름
    """
    # 게시글 존재 확인
    post_object_id = validate_object_id(post_id)
    posts_collection = database["posts"]
    post = await posts_collection.find_one({"_id": post_object_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    # 댓글 생성
    comments_collection = database["comments"]
    new_comment = {
        "post_id": post_object_id,
        "content": comment.content,
        "author": comment.author,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "likes": 0,
    }

    result = await comments_collection.insert_one(new_comment)
    created_comment = await comments_collection.find_one({"_id": result.inserted_id})

    return comment_helper(created_comment)


@app.get("/api/posts/{post_id}/comments", response_model=list[CommentResponse], tags=["Comments"])
async def get_comments(post_id: str):
    """
    특정 게시글의 댓글 목록 조회
    - **post_id**: 게시글 ID
    """
    # 게시글 존재 확인
    post_object_id = validate_object_id(post_id)
    posts_collection = database["posts"]
    post = await posts_collection.find_one({"_id": post_object_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    # 댓글 조회 (생성 시간 오름차순)
    comments_collection = database["comments"]
    cursor = comments_collection.find({"post_id": post_object_id}).sort("created_at", 1)
    comments = await cursor.to_list(length=None)

    return [comment_helper(comment) for comment in comments]


@app.delete(
    "/api/comments/{comment_id}",
    response_model=dict,
    tags=["Comments"],
)
async def delete_comment(comment_id: str):
    """
    댓글 삭제
    - **comment_id**: 댓글 ID
    """
    # ObjectId 유효성 검증
    object_id = validate_object_id(comment_id)

    comments_collection = database["comments"]

    # 댓글 삭제
    result = await comments_collection.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found",
        )

    return {"message": "Comment deleted successfully"}


# ============================================
# Authentication API 엔드포인트
# ============================================


@app.post(
    "/api/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
)
async def register(user_data: UserRegister):
    """
    회원가입
    - **username**: 사용자 이름 (3-50자, 중복 불가)
    - **email**: 이메일 주소 (중복 불가)
    - **password**: 비밀번호 (최소 6자)
    """
    users_collection = database["users"]

    # 이메일 중복 확인
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # 사용자 이름 중복 확인
    existing_username = await users_collection.find_one(
        {"username": user_data.username}
    )
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # 비밀번호 해싱
    hashed_password = hash_password(user_data.password)

    # 새 사용자 생성
    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    result = await users_collection.insert_one(new_user)
    created_user = await users_collection.find_one({"_id": result.inserted_id})

    return user_helper(created_user)


@app.post("/api/auth/login", response_model=TokenPair, tags=["Authentication"])
async def login(user_data: UserLogin, response: Response):
    """
    로그인
    - **email**: 이메일 주소
    - **password**: 비밀번호

    성공 시:
    - Access Token: 응답 body에 반환 (메모리에 저장)
    - Refresh Token: HTTPOnly 쿠키에 설정
    """
    users_collection = database["users"]

    # 이메일로 사용자 찾기
    user = await users_collection.find_one({"email": user_data.email})

    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # JWT 토큰 생성
    token_data = {"sub": str(user["_id"]), "username": user["username"]}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Refresh Token을 HTTPOnly 쿠키에 설정
    set_refresh_token_cookie(response, refresh_token)

    return TokenPair(access_token=access_token)


@app.post("/api/auth/refresh", response_model=TokenPair, tags=["Authentication"])
async def refresh_access_token(
    request: Request,
    refresh_token: str = Depends(get_refresh_token_from_cookie),
):
    """
    Access Token 재발급
    - Refresh Token (쿠키)을 사용하여 새로운 Access Token 발급
    """
    # Refresh Token 검증
    token_data = verify_token(refresh_token, token_type="refresh")

    # 새 Access Token 생성
    new_token_data = {"sub": token_data.user_id, "username": token_data.username}
    new_access_token = create_access_token(new_token_data)

    return TokenPair(access_token=new_access_token)


@app.post("/api/auth/logout", tags=["Authentication"])
async def logout(response: Response):
    """
    로그아웃
    - Refresh Token 쿠키 삭제
    """
    clear_refresh_token_cookie(response)
    return {"message": "Logged out successfully"}


@app.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_current_user_info(current_user: TokenData = Depends(get_current_user)):
    """
    현재 로그인한 사용자 정보 조회
    - Authorization 헤더에 Access Token 필요
    """
    users_collection = database["users"]

    # ObjectId 유효성 검증
    object_id = validate_object_id(current_user.user_id)

    user = await users_collection.find_one({"_id": object_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user_helper(user)
