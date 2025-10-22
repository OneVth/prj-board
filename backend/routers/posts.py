"""
Posts Router - 게시글 관련 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime

from core.database import get_database
from core.security import get_current_user, TokenData
from models import PostCreate, PostUpdate, PostResponse, PostListResponse
from utils import post_helper, validate_object_id

router = APIRouter(prefix="/api/posts", tags=["Posts"])


@router.get("", response_model=PostListResponse)
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
    database = get_database()
    posts_collection = database["posts"]

    # limit 최대값 제한
    limit = min(limit, 100)
    skip = (page - 1) * limit

    # 검색 쿼리 구성
    query = {}
    if q:
        query["$text"] = {"$search": q}

    # 전체 게시글 수
    total_posts = await posts_collection.count_documents(query)

    # 정렬 기준 설정
    sort_field = "created_at"
    sort_order = -1

    if sort == "likes":
        sort_field = "likes"
    elif sort == "comments":
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
            {"$project": {"comments": 0}},
        ]
        posts = await posts_collection.aggregate(pipeline).to_list(length=limit)
    else:
        # 날짜순 또는 좋아요순
        cursor = (
            posts_collection.find(query)
            .sort(sort_field, sort_order)
            .skip(skip)
            .limit(limit)
        )
        posts = await cursor.to_list(length=limit)

    # 전체 페이지 수 계산
    total_pages = (total_posts + limit - 1) // limit

    # 각 게시글에 대해 댓글 수를 포함하여 변환
    posts_with_comments = [await post_helper(post) for post in posts]

    return {
        "posts": posts_with_comments,
        "total_posts": total_posts,
        "current_page": page,
        "total_pages": total_pages,
    }


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str):
    """
    게시글 상세 조회
    - **post_id**: 게시글 ID (MongoDB ObjectId)
    """
    database = get_database()
    posts_collection = database["posts"]

    object_id = validate_object_id(post_id)
    post = await posts_collection.find_one({"_id": object_id})

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    return await post_helper(post)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post: PostCreate, current_user: TokenData = Depends(get_current_user)
):
    """
    게시글 작성 (인증 필요)
    - **title**: 게시글 제목 (1-200자)
    - **content**: 게시글 본문 (1자 이상)
    """
    database = get_database()
    posts_collection = database["posts"]

    new_post = {
        "title": post.title,
        "content": post.content,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "likes": 0,
        "author_id": current_user.user_id,
    }

    result = await posts_collection.insert_one(new_post)
    created_post = await posts_collection.find_one({"_id": result.inserted_id})

    return await post_helper(created_post)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str, post: PostUpdate, current_user: TokenData = Depends(get_current_user)
):
    """
    게시글 수정 (본인만 가능)
    - **post_id**: 게시글 ID
    - **title**: 수정할 제목 (선택)
    - **content**: 수정할 본문 (선택)
    """
    database = get_database()
    posts_collection = database["posts"]

    object_id = validate_object_id(post_id)

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

    # 업데이트할 필드만 추출
    update_data = {}
    if post.title is not None:
        update_data["title"] = post.title
    if post.content is not None:
        update_data["content"] = post.content

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    # 게시글 업데이트
    await posts_collection.update_one({"_id": object_id}, {"$set": update_data})
    updated_post = await posts_collection.find_one({"_id": object_id})

    return await post_helper(updated_post)


@router.delete("/{post_id}")
async def delete_post(post_id: str, current_user: TokenData = Depends(get_current_user)):
    """
    게시글 삭제 (본인만 가능)
    - **post_id**: 게시글 ID
    """
    database = get_database()
    posts_collection = database["posts"]

    object_id = validate_object_id(post_id)

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


@router.patch("/{post_id}/like", response_model=PostResponse)
async def like_post(post_id: str):
    """
    게시글 좋아요 증가
    - **post_id**: 게시글 ID
    """
    database = get_database()
    posts_collection = database["posts"]

    object_id = validate_object_id(post_id)

    # likes 필드 1 증가
    result = await posts_collection.update_one(
        {"_id": object_id}, {"$inc": {"likes": 1}}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} not found",
        )

    updated_post = await posts_collection.find_one({"_id": object_id})
    return await post_helper(updated_post)
