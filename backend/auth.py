"""
인증 관련 유틸리티 함수 및 설정
- JWT 토큰 생성 및 검증
- 비밀번호 해싱 및 검증
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# JWT 설정
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTPBearer 스킴 (Authorization 헤더에서 토큰 추출)
security = HTTPBearer()


# ============================================
# Pydantic 모델
# ============================================


class TokenData(BaseModel):
    """JWT 토큰에 담길 데이터"""

    user_id: str
    username: str


class TokenPair(BaseModel):
    """Access Token과 Refresh Token 쌍"""

    access_token: str
    token_type: str = "bearer"


# ============================================
# 비밀번호 해싱 함수
# ============================================


def hash_password(password: str) -> str:
    """비밀번호를 해싱하여 반환"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """평문 비밀번호와 해시된 비밀번호 비교"""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================
# JWT 토큰 생성 함수
# ============================================


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Access Token 생성
    - 짧은 만료 시간 (기본 15분)
    - 메모리에 저장하여 사용
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Refresh Token 생성
    - 긴 만료 시간 (기본 7일)
    - HTTPOnly 쿠키에 저장
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def set_refresh_token_cookie(response: Response, refresh_token: str):
    """
    Refresh Token을 HTTPOnly 쿠키에 설정
    - HTTPOnly: JavaScript 접근 불가 (XSS 방지)
    - Secure: HTTPS에서만 전송 (프로덕션)
    - SameSite=Strict: CSRF 방지
    """
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # 개발 환경에서는 False, 프로덕션에서는 True
        samesite="lax",  # 개발 환경: lax, 프로덕션: strict
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # 7일
    )


def clear_refresh_token_cookie(response: Response):
    """Refresh Token 쿠키 삭제 (로그아웃 시 사용)"""
    response.delete_cookie(key="refresh_token")


# ============================================
# JWT 토큰 검증 함수
# ============================================


def verify_token(token: str, token_type: str = "access") -> TokenData:
    """
    JWT 토큰 검증 및 데이터 추출
    - token_type: "access" 또는 "refresh"
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # 토큰 타입 확인
        if payload.get("type") != token_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token type. Expected {token_type}",
            )

        user_id: str = payload.get("sub")
        username: str = payload.get("username")

        if user_id is None or username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )

        return TokenData(user_id=user_id, username=username)

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


# ============================================
# FastAPI Dependency 함수
# ============================================


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """
    현재 로그인한 사용자 정보 가져오기
    - Authorization 헤더에서 Access Token 추출
    - 토큰 검증 후 사용자 정보 반환
    """
    token = credentials.credentials
    return verify_token(token, token_type="access")


async def get_refresh_token_from_cookie(request: Request) -> str:
    """
    쿠키에서 Refresh Token 가져오기
    """
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    return refresh_token
