"""
Users Router - 사용자 프로필 관련 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional

from core.database import get_database
from core.exceptions import NotFoundException
from core.security import get_current_user, TokenData
from models import UserResponse, PostResponse, CommentResponse
from utils import user_helper, post_helper, comment_helper, validate_object_id

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/search", response_model=list[UserResponse])
async def search_users(
    q: str,
    limit: int = 20,
    current_user: Optional[TokenData] = Depends(get_current_user)
):
    """
    사용자 검색
    - **q**: 검색어 (username으로 검색)
    - **limit**: 최대 결과 수 (기본값: 20, 최대: 50)
    - 자신은 검색 결과에서 제외
    - 부분 일치 지원 (대소문자 구분 없음)
    """
    database = get_database()
    users_collection = database["users"]

    # 검색어가 비어있으면 빈 목록 반환
    if not q or not q.strip():
        return []

    # limit 최대값 제한
    limit = min(limit, 50)

    # 검색 쿼리 구성 (username 부분 일치, 대소문자 구분 없음)
    search_query = {
        "username": {"$regex": q.strip(), "$options": "i"}
    }

    # 현재 사용자는 검색 결과에서 제외
    if current_user:
        search_query["_id"] = {"$ne": validate_object_id(current_user.user_id)}

    # 사용자 검색
    cursor = users_collection.find(search_query).limit(limit)
    users = await cursor.to_list(length=limit)

    return [user_helper(user) for user in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: str):
    """
    사용자 프로필 조회
    - **user_id**: 사용자 ID (MongoDB ObjectId)
    """
    database = get_database()
    users_collection = database["users"]

    object_id = validate_object_id(user_id)
    user = await users_collection.find_one({"_id": object_id})

    if not user:
        raise NotFoundException("User", user_id)

    return user_helper(user)


@router.get("/{user_id}/posts", response_model=list[PostResponse])
async def get_user_posts(user_id: str, limit: int = 20):
    """
    특정 사용자가 작성한 게시글 목록 조회
    - **user_id**: 사용자 ID
    - **limit**: 최대 게시글 수 (기본값: 20, 최대: 100)
    """
    database = get_database()
    users_collection = database["users"]
    posts_collection = database["posts"]

    # 사용자 존재 확인
    object_id = validate_object_id(user_id)
    user = await users_collection.find_one({"_id": object_id})
    if not user:
        raise NotFoundException("User", user_id)

    # limit 최대값 제한
    limit = min(limit, 100)

    # 사용자의 게시글 조회 (최신순)
    cursor = posts_collection.find({"author_id": user_id}).sort("created_at", -1).limit(limit)
    posts = await cursor.to_list(length=limit)

    return [await post_helper(post) for post in posts]


@router.get("/{user_id}/comments", response_model=list[CommentResponse])
async def get_user_comments(user_id: str, limit: int = 20):
    """
    특정 사용자가 작성한 댓글 목록 조회
    - **user_id**: 사용자 ID
    - **limit**: 최대 댓글 수 (기본값: 20, 최대: 100)
    """
    database = get_database()
    users_collection = database["users"]
    comments_collection = database["comments"]

    # 사용자 존재 확인
    object_id = validate_object_id(user_id)
    user = await users_collection.find_one({"_id": object_id})
    if not user:
        raise NotFoundException("User", user_id)

    # limit 최대값 제한
    limit = min(limit, 100)

    # 사용자의 댓글 조회 (최신순)
    cursor = comments_collection.find({"author_id": user_id}).sort("created_at", -1).limit(limit)
    comments = await cursor.to_list(length=limit)

    return [await comment_helper(comment) for comment in comments]
