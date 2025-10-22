"""
Comment 관련 Pydantic 모델
"""

from pydantic import BaseModel, Field
from .common import camel_case_alias_generator


class CommentCreate(BaseModel):
    """댓글 작성 시 사용하는 모델"""

    content: str = Field(..., min_length=1, max_length=500, description="댓글 내용")

    model_config = {
        "json_schema_extra": {"examples": [{"content": "좋은 글이네요!"}]}
    }


class CommentResponse(BaseModel):
    """댓글 응답 모델"""

    id: str
    post_id: str
    content: str
    author_id: str
    author_username: str
    created_at: str
    likes: int = 0

    model_config = {
        "populate_by_name": True,
        "alias_generator": camel_case_alias_generator,
        "by_alias": True,
    }
