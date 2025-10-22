"""
User 관련 Pydantic 모델
"""

from pydantic import BaseModel, Field, EmailStr
from .common import camel_case_alias_generator


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
    follower_count: int = 0
    following_count: int = 0
    is_following: bool = False  # 현재 사용자가 이 사용자를 팔로우하는지 여부

    model_config = {
        "populate_by_name": True,
        "alias_generator": camel_case_alias_generator,
        "by_alias": True,
    }
