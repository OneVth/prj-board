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

    print("🔌 Connecting to MongoDB...")
    mongodb_client = AsyncIOMotorClient(settings.MONGO_URL)
    database = mongodb_client[settings.DATABASE_NAME]

    # 연결 테스트
    try:
        await mongodb_client.admin.command("ping")
        print("✅ MongoDB connection successful!")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise

    # 인덱스 생성
    await create_indexes()


async def close_mongo_connection():
    """MongoDB 연결 종료"""
    global mongodb_client

    if mongodb_client:
        print("🔌 Closing MongoDB connection...")
        mongodb_client.close()
        print("✅ MongoDB connection closed!")


async def create_indexes():
    """컬렉션별 인덱스 생성"""
    if not database:
        return

    posts_collection = database["posts"]
    users_collection = database["users"]
    comments_collection = database["comments"]

    # Posts 인덱스
    await posts_collection.create_index([("created_at", -1)])
    await posts_collection.create_index([("likes", -1)])
    await posts_collection.create_index([("title", "text"), ("content", "text")])

    # Users 인덱스
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("username", unique=True)

    # Comments 인덱스
    await comments_collection.create_index("post_id")
    await comments_collection.create_index([("created_at", 1)])

    print("✅ Indexes created successfully!")


def get_database() -> AsyncIOMotorDatabase:
    """데이터베이스 인스턴스 반환"""
    if database is None:
        raise RuntimeError("Database not initialized")
    return database
