"""
Comments Router - 댓글 관련 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime

from core.database import get_database
from core.security import get_current_user, get_current_user_optional, TokenData
from models import CommentCreate, CommentResponse
from utils import comment_helper, validate_object_id

router = APIRouter(tags=["Comments"])


@router.post(
    "/api/posts/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    post_id: str,
    comment: CommentCreate,
    current_user: TokenData = Depends(get_current_user),
):
    """
    댓글 작성 (인증 필요)
    - **post_id**: 게시글 ID
    - **content**: 댓글 내용
    """
    database = get_database()
    posts_collection = database["posts"]
    comments_collection = database["comments"]

    # 게시글 존재 확인
    post_object_id = validate_object_id(post_id)
    post = await posts_collection.find_one({"_id": post_object_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    # 댓글 생성
    new_comment = {
        "post_id": post_object_id,
        "content": comment.content,
        "author_id": current_user.user_id,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "likes": 0,
    }

    result = await comments_collection.insert_one(new_comment)
    created_comment = await comments_collection.find_one({"_id": result.inserted_id})

    return await comment_helper(created_comment, current_user.user_id)


@router.get("/api/posts/{post_id}/comments", response_model=list[CommentResponse])
async def get_comments(
    post_id: str,
    current_user: TokenData | None = Depends(get_current_user_optional),
):
    """
    특정 게시글의 댓글 목록 조회
    - **post_id**: 게시글 ID
    """
    database = get_database()
    posts_collection = database["posts"]
    comments_collection = database["comments"]

    # 게시글 존재 확인
    post_object_id = validate_object_id(post_id)
    post = await posts_collection.find_one({"_id": post_object_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    # 댓글 조회 (생성 시간 오름차순)
    cursor = comments_collection.find({"post_id": post_object_id}).sort("created_at", 1)
    comments = await cursor.to_list(length=None)

    current_user_id = current_user.user_id if current_user else None
    return [await comment_helper(comment, current_user_id) for comment in comments]


@router.patch("/api/comments/{comment_id}/like", response_model=CommentResponse)
async def like_comment(comment_id: str, current_user: TokenData = Depends(get_current_user)):
    """
    댓글 좋아요 토글 (인증 필요)
    - **comment_id**: 댓글 ID
    - 이미 좋아요를 누른 경우 좋아요 취소
    - 처음 누르는 경우 좋아요 추가
    """
    database = get_database()
    comments_collection = database["comments"]

    object_id = validate_object_id(comment_id)
    user_id = current_user.user_id

    # 댓글 존재 확인
    comment = await comments_collection.find_one({"_id": object_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found",
        )

    # liked_by 필드가 없으면 빈 배열로 초기화
    if "liked_by" not in comment:
        comment["liked_by"] = []

    # 이미 좋아요를 눌렀는지 확인
    if user_id in comment["liked_by"]:
        # 좋아요 취소: liked_by 배열에서 user_id 제거, likes 감소
        result = await comments_collection.update_one(
            {"_id": object_id},
            {
                "$pull": {"liked_by": user_id},
                "$inc": {"likes": -1}
            }
        )
    else:
        # 좋아요 추가: liked_by 배열에 user_id 추가, likes 증가
        result = await comments_collection.update_one(
            {"_id": object_id},
            {
                "$addToSet": {"liked_by": user_id},
                "$inc": {"likes": 1}
            }
        )

    updated_comment = await comments_collection.find_one({"_id": object_id})
    return await comment_helper(updated_comment, current_user.user_id)


@router.delete("/api/comments/{comment_id}", response_model=dict)
async def delete_comment(
    comment_id: str, current_user: TokenData = Depends(get_current_user)
):
    """
    댓글 삭제 (인증 필요, 본인만 가능)
    - **comment_id**: 댓글 ID
    """
    database = get_database()
    comments_collection = database["comments"]

    object_id = validate_object_id(comment_id)

    # 댓글 존재 확인 및 본인 확인
    existing_comment = await comments_collection.find_one({"_id": object_id})
    if not existing_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found",
        )

    # 작성자 본인 확인
    if existing_comment.get("author_id") != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments",
        )

    # 댓글 삭제
    await comments_collection.delete_one({"_id": object_id})

    return {"message": "Comment deleted successfully"}
