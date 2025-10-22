import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search as SearchIcon } from "lucide-react";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components";
import { Button } from "../components/ui/button";
import type { User } from "../types/user";

// ============================================
// Search 컴포넌트
// ============================================

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken, isAuthenticated } = useAuth();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followingLoading, setFollowingLoading] = useState<Set<string>>(new Set());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  // 검색 실행
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await userService.searchUsers(searchQuery, 20, accessToken || undefined);
      setUsers(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // URL 파라미터에서 초기 검색
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, []);

  // 검색어 변경 시 debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
        setSearchParams({ q: query });
      }, 300);
    } else {
      setUsers([]);
      setSearchParams({});
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Follow/Unfollow 핸들러
  const handleFollowToggle = useCallback(async (userId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to profile
    if (!accessToken) return;

    // Mark user as loading
    setFollowingLoading(prev => new Set(prev).add(userId));

    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      const updatedUser = targetUser.isFollowing
        ? await userService.unfollowUser(userId, accessToken)
        : await userService.followUser(userId, accessToken);

      // Update user in list
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      // Remove user from loading set
      setFollowingLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, [accessToken, users]);

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />

      {/* Search Bar */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              animate={{ scale: isSearchFocused ? 1.02 : 1 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-sm"></div>
              <div className="relative flex items-center">
                <SearchIcon className="absolute left-4 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search by username..."
                  className="h-12 w-full rounded-full border-white/10 bg-black/50 pl-12 pr-4 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:bg-black/80 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 px-4"
            >
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-red-400">
                <p className="text-xl mb-2">⚠️</p>
                <p>{error}</p>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && query.trim() && users.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-gray-500"
            >
              <p className="text-4xl mb-4">😔</p>
              <p className="text-lg">No users found for "<span className="text-white">{query}</span>"</p>
            </motion.div>
          )}

          {/* Results */}
          {!loading && users.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/profile/${user.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.01, y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:border-purple-500/30 transition-colors"
                    >
                      {/* Subtle glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity -z-10" />

                      <div className="flex items-center gap-4">
                        {/* Avatar with shadow */}
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 blur-md opacity-50"></div>
                          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-lg">
                            {user.username[0]?.toUpperCase() || "?"}
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate text-lg">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span>
                              <span className="font-semibold text-white">{user.followerCount}</span> Followers
                            </span>
                            <span>•</span>
                            <span>
                              <span className="font-semibold text-white">{user.followingCount}</span> Following
                            </span>
                          </div>
                        </div>

                        {/* Follow Button */}
                        {isAuthenticated && (
                          <Button
                            onClick={(e) => handleFollowToggle(user.id, e)}
                            disabled={followingLoading.has(user.id)}
                            variant={user.isFollowing ? "outline" : "default"}
                            size="sm"
                            className={`rounded-full font-semibold ${
                              user.isFollowing
                                ? "border-white/20 bg-white/5 hover:bg-white/10"
                                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            }`}
                          >
                            {followingLoading.has(user.id)
                              ? "..."
                              : user.isFollowing
                                ? "Following"
                                : "Follow"}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Initial State */}
          {!loading && !error && !query.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-2xl opacity-30"></div>
                <p className="relative text-6xl">🔍</p>
              </div>
              <p className="text-xl text-gray-400 mb-2">Search for users</p>
              <p className="text-sm text-gray-600">Enter a username to find people</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Search;
