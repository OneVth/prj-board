"""
Auth Router - 인증 관련 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from datetime import datetime

from core.database import get_database
from core.security import (
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
from models import UserRegister, UserLogin, UserResponse
from utils import user_helper, validate_object_id

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(user_data: UserRegister):
    """
    회원가입
    - **username**: 사용자 이름 (3-50자, 중복 불가)
    - **email**: 이메일 주소 (중복 불가)
    - **password**: 비밀번호 (최소 6자)
    """
    database = get_database()
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
        "followers": [],  # 팔로워 목록 초기화
        "following": [],  # 팔로잉 목록 초기화
    }

    result = await users_collection.insert_one(new_user)
    created_user = await users_collection.find_one({"_id": result.inserted_id})

    return user_helper(created_user)


@router.post("/login", response_model=TokenPair)
async def login(user_data: UserLogin, response: Response):
    """
    로그인
    - **email**: 이메일 주소
    - **password**: 비밀번호

    성공 시:
    - Access Token: 응답 body에 반환 (메모리에 저장)
    - Refresh Token: HTTPOnly 쿠키에 설정
    """
    database = get_database()
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


@router.post("/refresh", response_model=TokenPair)
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


@router.post("/logout")
async def logout(response: Response):
    """
    로그아웃
    - Refresh Token 쿠키 삭제
    """
    clear_refresh_token_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: TokenData = Depends(get_current_user)):
    """
    현재 로그인한 사용자 정보 조회
    - Authorization 헤더에 Access Token 필요
    """
    from bson import ObjectId
    database = get_database()
    users_collection = database["users"]

    object_id = ObjectId(current_user.user_id)
    user = await users_collection.find_one({"_id": object_id})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user_helper(user)
