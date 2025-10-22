"""
Dummy Data Generator for Board Database

Generates:
- 10 users
- 100 posts
- 300 comments
- Random likes and follows
"""

import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from faker import Faker
from bson import ObjectId

# Configuration
MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "board_db"
PASSWORD = "password123"  # Same password for all test users

# Initialize
fake = Faker()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Data counts
NUM_USERS = 10
NUM_POSTS = 100
NUM_COMMENTS = 300


async def clear_database(db):
    """Clear all existing data from collections"""
    print("🗑️  Clearing existing data...")
    await db.users.delete_many({})
    await db.posts.delete_many({})
    await db.comments.delete_many({})
    print("✅ Database cleared")


async def create_users(db):
    """Create 10 test users"""
    print(f"\n👥 Creating {NUM_USERS} users...")

    users = []
    hashed_password = pwd_context.hash(PASSWORD)

    for i in range(NUM_USERS):
        username = fake.user_name() + str(i)  # Add number to ensure uniqueness
        email = f"user{i}@example.com"

        user = {
            "username": username,
            "email": email,
            "password": hashed_password,
            "created_at": (datetime.utcnow() - timedelta(days=random.randint(1, 365))).isoformat() + "Z",
            "followers": [],
            "following": []
        }
        users.append(user)

    result = await db.users.insert_many(users)
    user_ids = [str(id) for id in result.inserted_ids]

    print(f"✅ Created {len(user_ids)} users")
    print(f"📧 Login credentials: any email (user0@example.com to user9@example.com) / password: {PASSWORD}")

    return user_ids


async def create_follows(db, user_ids):
    """Create random follow relationships"""
    print(f"\n🔗 Creating follow relationships...")

    follow_count = 0
    for user_id in user_ids:
        # Each user follows 2-5 random other users
        num_following = random.randint(2, 5)
        potential_follows = [uid for uid in user_ids if uid != user_id]
        following_list = random.sample(potential_follows, min(num_following, len(potential_follows)))

        # Update current user's following list
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"following": following_list}}
        )

        # Update followed users' followers list
        for followed_id in following_list:
            await db.users.update_one(
                {"_id": ObjectId(followed_id)},
                {"$addToSet": {"followers": user_id}}
            )
            follow_count += 1

    print(f"✅ Created {follow_count} follow relationships")


async def create_posts(db, user_ids):
    """Create 100 posts"""
    print(f"\n📝 Creating {NUM_POSTS} posts...")

    posts = []
    post_contents = [
        "Just finished a great workout at the gym! 💪",
        "Beautiful sunset today 🌅",
        "Anyone else loving this weather? ☀️",
        "Just tried the new coffee shop downtown. Highly recommend! ☕",
        "Working on an exciting new project 🚀",
        "Movie night recommendations anyone? 🎬",
        "Best pizza place in town? Drop your suggestions below! 🍕",
        "Morning run complete! Feeling energized 🏃",
        "New blog post is live! Check it out 📖",
        "Just adopted a rescue dog! Meet Max 🐕",
        "Weekend vibes ✨",
        "Coding late into the night 💻",
        "Fresh produce from the farmers market 🥬",
        "Concert was absolutely amazing last night! 🎵",
        "Travel plans for next month. So excited! ✈️",
        "Home cooked meal success 🍳",
        "Finished reading an incredible book 📚",
        "Game night with friends was epic 🎮",
        "New recipe turned out perfect! 👨‍🍳",
        "Hiking trail discovery - breathtaking views 🏔️"
    ]

    for i in range(NUM_POSTS):
        author_id = random.choice(user_ids)
        created_at = datetime.utcnow() - timedelta(hours=random.randint(1, 720))  # Posts from last 30 days

        # Random number of likes (0-20)
        num_likes = random.randint(0, 20)
        liked_by = random.sample(user_ids, min(num_likes, len(user_ids)))

        post = {
            "title": fake.sentence(nb_words=random.randint(3, 8)).rstrip('.'),
            "content": random.choice(post_contents) + "\n\n" + fake.paragraph(nb_sentences=random.randint(1, 3)),
            "author_id": author_id,
            "created_at": created_at.isoformat() + "Z",
            "likes": len(liked_by),
            "liked_by": liked_by
        }

        posts.append(post)

    result = await db.posts.insert_many(posts)
    post_ids = [str(id) for id in result.inserted_ids]

    print(f"✅ Created {len(post_ids)} posts")
    return post_ids


async def create_comments(db, user_ids, post_ids):
    """Create 300 comments"""
    print(f"\n💬 Creating {NUM_COMMENTS} comments...")

    comments = []
    comment_texts = [
        "Great post! 👍",
        "I completely agree with this!",
        "Thanks for sharing!",
        "This is so helpful 🙏",
        "Love it! ❤️",
        "Couldn't have said it better myself",
        "Interesting perspective!",
        "This made my day 😊",
        "So true!",
        "Exactly what I needed to hear",
        "Amazing content!",
        "Keep them coming!",
        "This is gold ✨",
        "Mind blown 🤯",
        "Absolutely brilliant!",
        "I learned something new today!",
        "Thank you for this!",
        "Can't wait for more!",
        "This resonates with me",
        "Well said! 👏"
    ]

    for i in range(NUM_COMMENTS):
        author_id = random.choice(user_ids)
        post_id = random.choice(post_ids)
        created_at = datetime.utcnow() - timedelta(hours=random.randint(1, 500))

        # Random number of likes (0-10)
        num_likes = random.randint(0, 10)
        liked_by = random.sample(user_ids, min(num_likes, len(user_ids)))

        comment = {
            "post_id": ObjectId(post_id),
            "content": random.choice(comment_texts),
            "author_id": author_id,
            "created_at": created_at.isoformat() + "Z",
            "likes": len(liked_by),
            "liked_by": liked_by
        }
        comments.append(comment)

    result = await db.comments.insert_many(comments)

    print(f"✅ Created {len(result.inserted_ids)} comments")


async def create_indexes(db):
    """Create database indexes for performance"""
    print(f"\n🔍 Creating database indexes...")

    # Users indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)

    # Posts indexes
    await db.posts.create_index([("created_at", -1)])
    await db.posts.create_index([("author_id", 1)])
    await db.posts.create_index([("title", "text"), ("content", "text")])

    # Comments indexes
    await db.comments.create_index([("post_id", 1), ("created_at", -1)])
    await db.comments.create_index([("author_id", 1)])

    print(f"✅ Indexes created")


async def print_summary(db):
    """Print summary of created data"""
    print(f"\n" + "="*60)
    print(f"📊 DATABASE SUMMARY")
    print(f"="*60)

    user_count = await db.users.count_documents({})
    post_count = await db.posts.count_documents({})
    comment_count = await db.comments.count_documents({})

    total_likes = 0
    async for post in db.posts.find():
        total_likes += post.get("likes", 0)
    async for comment in db.comments.find():
        total_likes += comment.get("likes", 0)

    total_follows = 0
    async for user in db.users.find():
        total_follows += len(user.get("following", []))

    print(f"👥 Users:         {user_count}")
    print(f"📝 Posts:         {post_count}")
    print(f"💬 Comments:      {comment_count}")
    print(f"❤️  Total Likes:   {total_likes}")
    print(f"🔗 Follow Links:  {total_follows}")
    print(f"="*60)
    print(f"\n🔐 Test Login Credentials:")
    print(f"   Email:    user0@example.com to user9@example.com")
    print(f"   Password: {PASSWORD}")
    print(f"="*60)


async def main():
    """Main execution function"""
    print("🚀 Starting dummy data generation...")
    print(f"📦 Target: {MONGO_URL}/{DATABASE_NAME}")

    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]

    try:
        # Clear existing data
        await clear_database(db)

        # Create users
        user_ids = await create_users(db)

        # Create follow relationships
        await create_follows(db, user_ids)

        # Create posts
        post_ids = await create_posts(db, user_ids)

        # Create comments
        await create_comments(db, user_ids, post_ids)

        # Create indexes
        await create_indexes(db)

        # Print summary
        await print_summary(db)

        print(f"\n✅ Dummy data generation completed successfully!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
