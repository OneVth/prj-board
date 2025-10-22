"""
MongoDB 문서 변환 헬퍼 함수들
"""

from bson import ObjectId
from fastapi import HTTPException, status
from core.database import get_database


async def get_author_info(author_id: str | None) -> tuple[str, str]:
    """
    작성자 정보 조회 (공통 함수)

    Args:
        author_id: 작성자 ID

    Returns:
        (author_id_str, author_username) 튜플
    """
    if not author_id:
        return "", "Unknown"

    database = get_database()
    users_collection = database["users"]

    author = await users_collection.find_one({"_id": ObjectId(author_id)})
    if author:
        return str(author_id), author.get("username", "Unknown")

    return str(author_id), "Unknown"


async def post_helper(post: dict) -> dict:
    """
    MongoDB 문서를 PostResponse 형식으로 변환
    댓글 수와 작성자 정보를 함께 조회하여 반환
    """
    database = get_database()
    comments_collection = database["comments"]

    # 댓글 수 조회
    comment_count = await comments_collection.count_documents({"post_id": post["_id"]})

    # 작성자 정보 조회
    author_id_str, author_username = await get_author_info(post.get("author_id"))

    return {
        "id": str(post["_id"]),
        "title": post["title"],
        "content": post["content"],
        "created_at": post.get("created_at", "1970-01-01T00:00:00.000Z"),
        "likes": post.get("likes", 0),
        "comment_count": comment_count,
        "author_id": author_id_str,
        "author_username": author_username,
    }


async def comment_helper(comment: dict) -> dict:
    """
    MongoDB 문서를 CommentResponse 형식으로 변환
    """
    # 작성자 정보 조회
    author_id_str, author_username = await get_author_info(comment.get("author_id"))

    return {
        "id": str(comment["_id"]),
        "post_id": str(comment["post_id"]),
        "content": comment["content"],
        "author_id": author_id_str,
        "author_username": author_username,
        "created_at": comment.get("created_at", "1970-01-01T00:00:00.000Z"),
        "likes": comment.get("likes", 0),
    }


def user_helper(user: dict) -> dict:
    """
    MongoDB 문서를 UserResponse 형식으로 변환
    """
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "created_at": user.get("created_at", "1970-01-01T00:00:00.000Z"),
    }


def validate_object_id(id_string: str) -> ObjectId:
    """
    ObjectId 유효성 검증 및 변환

    Args:
        id_string: 검증할 ID 문자열

    Returns:
        ObjectId: 변환된 ObjectId 객체

    Raises:
        HTTPException: ID가 유효하지 않을 경우 400 에러
    """
    if not ObjectId.is_valid(id_string):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID format"
        )
    return ObjectId(id_string)
