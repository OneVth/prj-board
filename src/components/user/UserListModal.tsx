import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { userService } from "../../services/userService";
import { useAuth } from "../../contexts/AuthContext";
import type { User } from "../../types/user";

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

function UserListModal({ isOpen, onClose, userId, type }: UserListModalProps) {
  const { user: currentUser, accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, userId, type]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        type === "followers"
          ? await userService.getUserFollowers(userId, accessToken || undefined)
          : await userService.getUserFollowing(userId, accessToken || undefined);
      setUsers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string, isFollowing: boolean) => {
    if (!accessToken) return;

    try {
      if (isFollowing) {
        await userService.unfollowUser(targetUserId, accessToken);
      } else {
        await userService.followUser(targetUserId, accessToken);
      }
      // Reload users to reflect the change
      await loadUsers();
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl border border-white/10 max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">
              {type === "followers" ? "Followers" : "Following"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">{error}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {type === "followers" ? "No followers yet" : "Not following anyone yet"}
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => {
                  const isOwnProfile = currentUser && currentUser.id === user.id;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={onClose}
                        className="flex items-center gap-3 flex-1 min-w-0 hover:bg-white/5 rounded-lg p-2 -ml-2 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold flex-shrink-0">
                          {user.username[0]?.toUpperCase() || "?"}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </Link>

                      {/* Follow Button */}
                      {!isOwnProfile && currentUser && (
                        <button
                          onClick={() => handleFollowToggle(user.id, user.isFollowing || false)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                            user.isFollowing
                              ? "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                              : "bg-white text-black hover:bg-gray-200"
                          }`}
                        >
                          {user.isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UserListModal;
