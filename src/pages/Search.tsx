import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner } from "../components";
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 실행
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await userService.searchUsers(searchQuery, 20, accessToken);
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
      <header className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold">Search Users</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full bg-gray-900 text-white px-4 py-3 rounded-full border border-gray-800 focus:outline-none focus:border-gray-600 transition-colors"
            autoFocus
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && query.trim() && users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found for "{query}"
          </div>
        )}

        {/* Results */}
        {!loading && users.length > 0 && (
          <div className="space-y-0">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.id}`}
                className="block border-b border-gray-800 hover:bg-gray-900 transition-colors"
              >
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {user.username[0]?.toUpperCase() || "?"}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {user.followerCount} Followers • {user.followingCount} Following
                    </p>
                  </div>

                  {/* Follow Button */}
                  {isAuthenticated && (
                    <button
                      onClick={(e) => handleFollowToggle(user.id, e)}
                      disabled={followingLoading.has(user.id)}
                      className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-colors ${
                        user.isFollowing
                          ? "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                          : "bg-white text-black hover:bg-gray-200"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {followingLoading.has(user.id)
                        ? "..."
                        : user.isFollowing
                          ? "Following"
                          : "Follow"}
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Initial State */}
        {!loading && !error && !query.trim() && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p>Search for users by username</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Search;
