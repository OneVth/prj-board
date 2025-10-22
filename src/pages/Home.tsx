import { useEffect, useReducer, useRef, useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { postService } from "../services/postService";
import { PostCard, Header } from "../components";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import type { Post } from "../types/post";

// ============================================
// State와 Action 타입 정의
// ============================================

type HomeState = {
  posts: Post[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  searchQuery: string;
  sortBy: string;
  feedType: "forYou" | "following"; // 새로운 필드
};

type HomeAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { posts: Post[]; totalPages: number } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "RESET" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_SORT"; payload: string }
  | { type: "SET_FEED_TYPE"; payload: "forYou" | "following" };

// ============================================
// Reducer 함수
// ============================================

function homeReducer(state: HomeState, action: HomeAction): HomeState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      const newPage = state.page + 1;
      const newHasMore = newPage <= action.payload.totalPages;
      return {
        ...state,
        loading: false,
        posts: [...state.posts, ...action.payload.posts],
        page: newPage,
        hasMore: newHasMore,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "RESET":
      return {
        ...initialState,
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
        feedType: state.feedType,
      };
    case "SET_SEARCH":
      return {
        ...initialState,
        searchQuery: action.payload,
        sortBy: state.sortBy,
        feedType: state.feedType,
      };
    case "SET_SORT":
      return {
        ...initialState,
        searchQuery: state.searchQuery,
        sortBy: action.payload,
        feedType: state.feedType,
      };
    case "SET_FEED_TYPE":
      return {
        ...initialState,
        feedType: action.payload,
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
      };
    default:
      return state;
  }
}

// ============================================
// 초기 상태
// ============================================

const initialState: HomeState = {
  posts: [],
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
  searchQuery: "",
  sortBy: "date",
  feedType: "forYou",
};

// ============================================
// Home 컴포넌트
// ============================================

function Home() {
  const { isAuthenticated, accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(homeReducer, {
    ...initialState,
    searchQuery: searchParams.get("q") || "",
    sortBy: searchParams.get("sort") || "date",
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state); // Track latest state for avoiding stale closure
  const isInitialMount = useRef(true);
  const isFetchingRef = useRef(false); // Synchronous fetching flag to prevent duplicates
  const prevFiltersRef = useRef({ searchQuery: state.searchQuery, sortBy: state.sortBy, feedType: state.feedType }); // Track previous filter values
  const PAGE_SIZE = 10;

  // Keep stateRef in sync with latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 게시글 불러오기 함수 - 동기적 플래그로 중복 요청 완벽 차단
  const loadPosts = useCallback(async () => {
    // 동기적 체크: 같은 틱에서 여러 번 호출되어도 중복 방지
    if (isFetchingRef.current || !stateRef.current.hasMore) {
      return;
    }

    // 즉시 플래그 설정 (동기) - dispatch보다 먼저 설정하여 즉각 차단
    isFetchingRef.current = true;

    dispatch({ type: "FETCH_START" });

    try {
      // Use stateRef to get current values (avoids stale closure)
      const currentPage = stateRef.current.page;
      const currentSearch = stateRef.current.searchQuery;
      const currentSort = stateRef.current.sortBy;
      const currentFeedType = stateRef.current.feedType;

      let response;

      // Following 피드는 인증 필요, For You는 인증 불필요
      if (currentFeedType === "following") {
        if (!accessToken) {
          // 인증되지 않은 경우 빈 결과 반환
          dispatch({
            type: "FETCH_SUCCESS",
            payload: {
              posts: [],
              totalPages: 0,
            },
          });
          // 플래그 해제 필수!
          isFetchingRef.current = false;
          return;
        }
        response = await postService.getFollowingPosts(
          currentPage,
          PAGE_SIZE,
          currentSort,
          accessToken
        );
      } else {
        response = await postService.getAllPosts(
          currentPage,
          PAGE_SIZE,
          currentSearch,
          currentSort,
          accessToken || undefined
        );
      }

      dispatch({
        type: "FETCH_SUCCESS",
        payload: {
          posts: response.posts,
          totalPages: response.totalPages,
        },
      });
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to load posts",
      });
    } finally {
      // 요청 완료 후 플래그 해제 (성공/실패 무관)
      isFetchingRef.current = false;
    }
  }, [accessToken]); // accessToken dependency added

  // 초기 로드 - 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadPosts();
    }
  }, []); // Empty dependency array for true mount-only execution

  // 검색어/정렬/피드타입 변경 시 리셋 및 재로드
  useEffect(() => {
    // 이전 값과 비교하여 실제로 변경되었을 때만 실행
    const prev = prevFiltersRef.current;
    const hasChanged =
      prev.searchQuery !== state.searchQuery ||
      prev.sortBy !== state.sortBy ||
      prev.feedType !== state.feedType;

    if (!isInitialMount.current && hasChanged) {
      // 이전 값 업데이트
      prevFiltersRef.current = {
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
        feedType: state.feedType,
      };

      // 상태 리셋
      dispatch({ type: "RESET" });
      // 플래그 리셋
      isFetchingRef.current = false;
      // 검색/정렬/피드타입이 변경되면 처음부터 다시 로드
      loadPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchQuery, state.sortBy, state.feedType]);

  // 검색 핸들러
  const handleSearch = useCallback(
    (query: string) => {
      dispatch({ type: "SET_SEARCH", payload: query });
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        if (query) {
          newParams.set("q", query);
        } else {
          newParams.delete("q");
        }
        return newParams;
      });
    },
    [setSearchParams]
  );

  // 정렬 변경 핸들러
  const handleSortChange = useCallback(
    (sortBy: string) => {
      dispatch({ type: "SET_SORT", payload: sortBy });
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("sort", sortBy);
        return newParams;
      });
    },
    [setSearchParams]
  );

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    // 로딩 중이거나 더 이상 데이터가 없으면 Observer 설정 안 함
    if (state.loading || !state.hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadPosts();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [state.hasMore, state.loading, loadPosts]);

  // ============================================
  // 렌더링
  // ============================================

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Modern Header */}
      <Header />

      {/* Search Box and Sort Filter */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative max-w-2xl mx-auto flex items-center gap-3">
            {/* Search Box */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(state.searchQuery); }} className="flex-1">
              <motion.div
                animate={{
                  scale: isSearchFocused ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-sm"></div>
                <div className="relative flex items-center">
                  <Search className="absolute left-4 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search posts..."
                    value={state.searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="h-11 w-full rounded-full border-white/10 bg-black/50 pl-11 pr-4 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:bg-black/80 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </motion.div>
            </form>

            {/* Sort Filter */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-sm"></div>
              <select
                value={state.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="relative h-11 px-4 pr-10 rounded-full border-white/10 bg-black/50 text-white text-sm font-medium cursor-pointer focus:border-purple-500/50 focus:bg-black/80 focus:ring-2 focus:ring-purple-500/20 focus:outline-none appearance-none"
              >
                <option value="date" className="bg-gray-900">Recent</option>
                <option value="likes" className="bg-gray-900">Likes</option>
                <option value="comments" className="bg-gray-900">Comments</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Type Tabs - Only show for authenticated users */}
      {isAuthenticated && (
        <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-[88px] z-40">
          <div className="max-w-2xl mx-auto flex relative">
            <button
              onClick={() => dispatch({ type: "SET_FEED_TYPE", payload: "forYou" })}
              className={`relative flex-1 py-4 text-center font-semibold transition-all duration-300 ${
                state.feedType === "forYou"
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              For You
              {state.feedType === "forYou" && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => dispatch({ type: "SET_FEED_TYPE", payload: "following" })}
              className={`relative flex-1 py-4 text-center font-semibold transition-all duration-300 ${
                state.feedType === "following"
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Following
              {state.feedType === "following" && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Error State with Retry */}
          {state.error && (
            <div
              className="p-4 mt-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400"
              role="alert"
            >
              <div className="flex items-center justify-between">
                <span>⚠️ {state.error}</span>
                <button
                  onClick={() => {
                    dispatch({ type: "RESET" });
                    loadPosts();
                  }}
                  className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors text-sm font-semibold"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!state.loading && state.posts.length === 0 && !state.error && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-gray-500">
              {state.feedType === "following" ? (
                <>
                  <p className="text-lg mb-4">No posts from followed users</p>
                  <Link
                    to="/search"
                    className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Find users to follow
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-lg mb-4">No posts yet</p>
                  <Link
                    to="/new"
                    className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Create your first post
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Posts List */}
          {state.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Loading Spinner */}
          {state.loading && (
            <div
              className="flex justify-center py-8"
              role="status"
              aria-live="polite"
            >
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="sr-only">Loading more posts...</span>
            </div>
          )}

          {/* End Message */}
          {!state.loading && !state.hasMore && state.posts.length > 0 && (
            <div className="py-8 text-center text-gray-500">
              You're all caught up!
            </div>
          )}

          {/* Intersection Observer Target */}
          <div ref={observerTarget} className="h-4" />
        </div>
      </main>
    </div>
  );
}

export default Home;
