import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { userService } from "../services/userService";
import { LoadingSpinner, PostCard, Header } from "../components";
import UserListModal from "../components/user/UserListModal";
import { formatDate } from "../utils/dateFormat";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "../types/user";
import type { Post } from "../types/post";

function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, accessToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");
  const [followLoading, setFollowLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">("followers");

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
          userService.getUserProfile(userId, accessToken || undefined),
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

  const handleFollowToggle = async () => {
    if (!userId || !accessToken || !user) return;

    setFollowLoading(true);
    try {
      if (user.isFollowing) {
        const updatedUser = await userService.unfollowUser(userId, accessToken);
        setUser(updatedUser);
      } else {
        const updatedUser = await userService.followUser(userId, accessToken);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      alert(error instanceof Error ? error.message : "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwnProfile = currentUser && currentUser.id === userId;

  const handleOpenModal = (type: "followers" | "following") => {
    setModalType(type);
    setModalOpen(true);
  };

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
      <Header />

      {/* Profile Header */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto py-6">
        {/* Avatar */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {user.username[0]?.toUpperCase() || "?"}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
                <p className="text-gray-500 text-sm mb-2">{user.email}</p>
              </div>
              {/* Follow Button */}
              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                    user.isFollowing
                      ? "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                      : "bg-white text-black hover:bg-gray-200"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followLoading ? "..." : user.isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
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
          <button
            onClick={() => handleOpenModal("followers")}
            className="hover:opacity-70 transition-opacity"
          >
            <span className="font-bold">{user.followerCount}</span>{" "}
            <span className="text-gray-500">Followers</span>
          </button>
          <button
            onClick={() => handleOpenModal("following")}
            className="hover:opacity-70 transition-opacity"
          >
            <span className="font-bold">{user.followingCount}</span>{" "}
            <span className="text-gray-500">Following</span>
          </button>
        </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-2xl mx-auto flex relative">
          <button
            onClick={() => setActiveTab("posts")}
            className={`relative flex-1 py-4 text-center font-semibold transition-all duration-300 ${
              activeTab === "posts"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Posts
            {activeTab === "posts" && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                layoutId="profileTab"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`relative flex-1 py-4 text-center font-semibold transition-all duration-300 ${
              activeTab === "comments"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Comments
            {activeTab === "comments" && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                layoutId="profileTab"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
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
        </div>
      </main>

      {/* User List Modal */}
      <UserListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId!}
        type={modalType}
      />
    </div>
  );
}

export default Profile;
