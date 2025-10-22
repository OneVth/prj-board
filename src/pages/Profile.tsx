import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { userService } from "../services/userService";
import { LoadingSpinner, PostCard } from "../components";
import { formatDate } from "../utils/dateFormat";
import type { User } from "../types/user";
import type { Post } from "../types/post";

function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setError("Invalid user ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [userProfile, userPosts] = await Promise.all([
          userService.getUserProfile(userId),
          userService.getUserPosts(userId, 20),
        ]);

        setUser(userProfile);
        setPosts(userPosts);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4">
        <p className="text-red-400 text-xl mb-4">⚠️ {error || "User not found"}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 bg-black border-b border-gray-800 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-2xl hover:opacity-70 transition-opacity">
            ←
          </Link>
          <h1 className="text-xl font-bold">{user.username}</h1>
        </div>
      </header>

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto px-4 py-6 border-b border-gray-800">
        {/* Avatar */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {user.username[0]?.toUpperCase() || "?"}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
            <p className="text-gray-500 text-sm mb-2">{user.email}</p>
            <p className="text-gray-500 text-sm">
              Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-bold">{posts.length}</span>{" "}
            <span className="text-gray-500">Posts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto border-b border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-4 text-center transition-colors ${
              activeTab === "posts"
                ? "text-white border-b-2 border-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 py-4 text-center transition-colors ${
              activeTab === "comments"
                ? "text-white border-b-2 border-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Comments
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto">
        {activeTab === "posts" ? (
          <div className="divide-y divide-gray-800">
            {posts.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <p>No posts yet</p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <p>Comments view coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Profile;
