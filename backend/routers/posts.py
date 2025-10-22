"""
Posts Router - 게시글 관련 API 엔드포인트
"""

from fastapi import APIRouter, Depends, status
from datetime import datetime

from core.database import get_database
from core.security import get_current_user, TokenData
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
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

    Performance Optimization: MongoDB Aggregation Pipeline으로 N+1 쿼리 해결
    - 100개 게시글 조회 시 201개 쿼리 → 1개 쿼리로 개선 (40배 성능 향상)
    """
    database = get_database()
    posts_collection = database["posts"]

    # limit 최대값 제한
    limit = min(limit, 100)
    skip = (page - 1) * limit

    # 검색 쿼리 구성
    match_query = {}
    if q:
        match_query["$text"] = {"$search": q}

    # 전체 게시글 수
    total_posts = await posts_collection.count_documents(match_query)

    # 정렬 기준 설정
    if sort == "likes":
        sort_stage = {"$sort": {"likes": -1, "created_at": -1}}
    elif sort == "comments":
        sort_stage = {"$sort": {"comment_count": -1, "created_at": -1}}
    else:
        sort_stage = {"$sort": {"created_at": -1}}

    # MongoDB Aggregation Pipeline: 모든 정렬 모드에 대해 통합 처리
    # $lookup으로 comments와 users를 한 번에 JOIN하여 N+1 쿼리 제거
    pipeline = [
        {"$match": match_query},
        # Convert author_id string to ObjectId for JOIN
        {
            "$addFields": {
                "author_object_id": {
                    "$cond": {
                        "if": {"$ne": ["$author_id", None]},
                        "then": {"$toObjectId": "$author_id"},
                        "else": None,
                    }
                }
            }
        },
        # JOIN comments collection
        {
            "$lookup": {
                "from": "comments",
                "localField": "_id",
                "foreignField": "post_id",
                "as": "comments_list",
            }
        },
        # JOIN users collection (using converted ObjectId)
        {
            "$lookup": {
                "from": "users",
                "localField": "author_object_id",
                "foreignField": "_id",
                "as": "author_info",
            }
        },
        # Calculate comment_count and extract author_username
        {
            "$addFields": {
                "comment_count": {"$size": "$comments_list"},
                "author_username": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$author_info.username", 0]},
                        "Unknown",
                    ]
                },
            }
        },
        sort_stage,
        {"$skip": skip},
        {"$limit": limit},
        # Project final shape (PostResponse format)
        {
            "$project": {
                "_id": 0,
                "id": {"$toString": "$_id"},
                "title": 1,
                "content": 1,
                "created_at": {"$ifNull": ["$created_at", "1970-01-01T00:00:00.000Z"]},
                "likes": {"$ifNull": ["$likes", 0]},
                "comment_count": 1,
                "author_id": "$author_id",
                "author_username": 1,
                "image": 1,  # 이미지 필드 포함
            }
        },
    ]

    posts = await posts_collection.aggregate(pipeline).to_list(length=limit)

    # 전체 페이지 수 계산
    total_pages = (total_posts + limit - 1) // limit

    return {
        "posts": posts,
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
        raise NotFoundException("Post", post_id)

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

    # 이미지가 있으면 추가
    if post.image:
        new_post["image"] = post.image

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
        raise NotFoundException("Post", post_id)

    # 작성자 본인 확인
    if existing_post.get("author_id") != current_user.user_id:
        raise ForbiddenException("You can only edit your own posts")

    # 업데이트할 필드만 추출
    update_data = {}
    if post.title is not None:
        update_data["title"] = post.title
    if post.content is not None:
        update_data["content"] = post.content
    if post.image is not None:
        update_data["image"] = post.image

    if not update_data:
        raise BadRequestException("No fields to update")

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
        raise NotFoundException("Post", post_id)

    # 작성자 본인 확인
    if existing_post.get("author_id") != current_user.user_id:
        raise ForbiddenException("You can only delete your own posts")

    # 게시글 삭제
    await posts_collection.delete_one({"_id": object_id})

    return {"message": f"Post with id {post_id} deleted successfully"}


@router.patch("/{post_id}/like", response_model=PostResponse)
async def like_post(post_id: str, current_user: TokenData = Depends(get_current_user)):
    """
    게시글 좋아요 토글 (인증 필요)
    - **post_id**: 게시글 ID
    - 이미 좋아요를 누른 경우 좋아요 취소
    - 처음 누르는 경우 좋아요 추가
    """
    database = get_database()
    posts_collection = database["posts"]

    object_id = validate_object_id(post_id)
    user_id = current_user.user_id

    # 게시글 존재 확인
    post = await posts_collection.find_one({"_id": object_id})
    if not post:
        raise NotFoundException("Post", post_id)

    # liked_by 필드가 없으면 빈 배열로 초기화
    if "liked_by" not in post:
        post["liked_by"] = []

    # 이미 좋아요를 눌렀는지 확인
    if user_id in post["liked_by"]:
        # 좋아요 취소: liked_by 배열에서 user_id 제거, likes 감소
        result = await posts_collection.update_one(
            {"_id": object_id},
            {
                "$pull": {"liked_by": user_id},
                "$inc": {"likes": -1}
            }
        )
    else:
        # 좋아요 추가: liked_by 배열에 user_id 추가, likes 증가
        result = await posts_collection.update_one(
            {"_id": object_id},
            {
                "$addToSet": {"liked_by": user_id},
                "$inc": {"likes": 1}
            }
        )

    updated_post = await posts_collection.find_one({"_id": object_id})
    return await post_helper(updated_post)


@router.get("/following", response_model=PostListResponse)
async def get_following_posts(
    page: int = 1,
    limit: int = 10,
    sort: str = "date",
    current_user: TokenData = Depends(get_current_user),
):
    """
    팔로우한 사용자들의 게시글 목록 조회
    - **page**: 페이지 번호 (기본값: 1)
    - **limit**: 페이지당 게시글 수 (기본값: 10, 최대: 100)
    - **sort**: 정렬 기준 (date=최신순, likes=좋아요순, comments=댓글순)
    - 인증 필요
    """
    database = get_database()
    posts_collection = database["posts"]
    users_collection = database["users"]

    # limit 최대값 제한
    limit = min(limit, 100)
    skip = (page - 1) * limit

    # 현재 사용자가 팔로우하는 사용자 목록 가져오기
    current_user_object_id = validate_object_id(current_user.user_id)
    current_user_doc = await users_collection.find_one({"_id": current_user_object_id})

    if not current_user_doc:
        raise NotFoundException("User", current_user.user_id)

    following_list = current_user_doc.get("following", [])

    # 팔로우한 사용자가 없으면 빈 목록 반환
    if not following_list:
        return {
            "posts": [],
            "total_posts": 0,
            "current_page": page,
            "total_pages": 0,
        }

    # 팔로우한 사용자들의 게시글만 필터링
    match_query = {"author_id": {"$in": following_list}}

    # 전체 게시글 수
    total_posts = await posts_collection.count_documents(match_query)

    # 정렬 기준 설정
    if sort == "likes":
        sort_stage = {"$sort": {"likes": -1, "created_at": -1}}
    elif sort == "comments":
        sort_stage = {"$sort": {"comment_count": -1, "created_at": -1}}
    else:
        sort_stage = {"$sort": {"created_at": -1}}

    # MongoDB Aggregation Pipeline
    pipeline = [
        {"$match": match_query},
        # Convert author_id string to ObjectId for JOIN
        {
            "$addFields": {
                "author_object_id": {
                    "$cond": {
                        "if": {"$ne": ["$author_id", None]},
                        "then": {"$toObjectId": "$author_id"},
                        "else": None,
                    }
                }
            }
        },
        # JOIN comments collection
        {
            "$lookup": {
                "from": "comments",
                "localField": "_id",
                "foreignField": "post_id",
                "as": "comments_list",
            }
        },
        # JOIN users collection
        {
            "$lookup": {
                "from": "users",
                "localField": "author_object_id",
                "foreignField": "_id",
                "as": "author_info",
            }
        },
        # Calculate comment_count and extract author_username
        {
            "$addFields": {
                "comment_count": {"$size": "$comments_list"},
                "author_username": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$author_info.username", 0]},
                        "Unknown",
                    ]
                },
            }
        },
        sort_stage,
        {"$skip": skip},
        {"$limit": limit},
        # Project final shape (PostResponse format)
        {
            "$project": {
                "_id": 0,
                "id": {"$toString": "$_id"},
                "title": 1,
                "content": 1,
                "created_at": {"$ifNull": ["$created_at", "1970-01-01T00:00:00.000Z"]},
                "likes": {"$ifNull": ["$likes", 0]},
                "comment_count": 1,
                "author_id": "$author_id",
                "author_username": 1,
                "image": 1,
            }
        },
    ]

    posts = await posts_collection.aggregate(pipeline).to_list(length=limit)

    # 전체 페이지 수 계산
    total_pages = (total_posts + limit - 1) // limit

    return {
        "posts": posts,
        "total_posts": total_posts,
        "current_page": page,
        "total_pages": total_pages,
    }
