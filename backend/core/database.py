"""
MongoDB 데이터베이스 연결 관리
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

# 전역 변수
mongodb_client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo():
    """MongoDB 연결 시작"""
    global mongodb_client, database

    print("[INFO] Connecting to MongoDB...")
    mongodb_client = AsyncIOMotorClient(settings.MONGO_URL)
    database = mongodb_client[settings.DATABASE_NAME]

    # 연결 테스트
    try:
        await mongodb_client.admin.command("ping")
        print("[SUCCESS] MongoDB connection successful!")
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        raise

    # 인덱스 생성
    await create_indexes()


async def close_mongo_connection():
    """MongoDB 연결 종료"""
    global mongodb_client

    if mongodb_client:
        print("[INFO] Closing MongoDB connection...")
        mongodb_client.close()
        print("[SUCCESS] MongoDB connection closed!")


async def create_indexes():
    """
    컬렉션별 인덱스 생성

    Performance Optimization: Compound Indexes for Query Performance
    - Posts collection: 정렬 최적화를 위한 복합 인덱스
    - Comments collection: $lookup JOIN 최적화
    """
    if database is None:
        return

    posts_collection = database["posts"]
    users_collection = database["users"]
    comments_collection = database["comments"]

    # Posts 인덱스
    # Single field indexes (backward compatibility)
    await posts_collection.create_index([("created_at", -1)])
    await posts_collection.create_index([("likes", -1)])

    # Compound indexes for sorting optimization
    # For date + likes sorting (covers both date-only and likes-only queries)
    await posts_collection.create_index([("created_at", -1), ("likes", -1)])

    # For author_id lookup (used in aggregation pipeline)
    await posts_collection.create_index([("author_id", 1)])

    # Full-text search index
    await posts_collection.create_index([("title", "text"), ("content", "text")])

    # Users 인덱스
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("username", unique=True)

    # Comments 인덱스
    # Compound index for $lookup optimization (post_id + created_at)
    # Optimizes: JOIN + comment ordering in a single index
    await comments_collection.create_index([("post_id", 1), ("created_at", -1)])

    # Single field index for backward compatibility
    await comments_collection.create_index([("created_at", 1)])

    print("[SUCCESS] Indexes created successfully (including compound indexes)!")


def get_database() -> AsyncIOMotorDatabase:
    """데이터베이스 인스턴스 반환"""
    if database is None:
        raise RuntimeError("Database not initialized")
    return database
