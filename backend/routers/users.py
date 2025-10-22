"""
Users Router - 사용자 프로필 관련 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status

from core.database import get_database
from core.exceptions import NotFoundException
from models import UserResponse, PostResponse, CommentResponse
from utils import user_helper, post_helper, comment_helper, validate_object_id

router = APIRouter(prefix="/api/users", tags=["Users"])


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
