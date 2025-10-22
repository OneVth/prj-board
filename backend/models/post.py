"""
Post 관련 Pydantic 모델
"""

from pydantic import BaseModel, Field
from .common import camel_case_alias_generator


class PostCreate(BaseModel):
    """게시글 작성 시 사용하는 모델"""

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
    """게시글 수정 시 사용하는 모델"""

    title: str | None = Field(
        None, min_length=1, max_length=200, description="게시글 제목"
    )
    content: str | None = Field(None, min_length=1, description="게시글 본문")

    model_config = {
        "json_schema_extra": {
            "examples": [{"title": "수정된 제목", "content": "수정된 내용입니다."}]
        }
    }


class PostResponse(BaseModel):
    """게시글 응답 모델"""

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
        "alias_generator": camel_case_alias_generator,
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
    """게시글 목록 응답 모델 (페이지네이션)"""

    posts: list[PostResponse]
    total_posts: int
    current_page: int
    total_pages: int

    model_config = {
        "populate_by_name": True,
        "alias_generator": camel_case_alias_generator,
        "by_alias": True,
    }
