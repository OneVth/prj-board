import { useEffect, useReducer, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { postService } from "../services/postService";
import { PostCard, SearchBar } from "../components";
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
};

type HomeAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { posts: Post[]; totalPages: number } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "RESET" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_SORT"; payload: string };

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
      };
    case "SET_SEARCH":
      return {
        ...initialState,
        searchQuery: action.payload,
        sortBy: state.sortBy,
      };
    case "SET_SORT":
      return {
        ...initialState,
        searchQuery: state.searchQuery,
        sortBy: action.payload,
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
};

// ============================================
// Home 컴포넌트
// ============================================

function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(homeReducer, {
    ...initialState,
    searchQuery: searchParams.get("q") || "",
    sortBy: searchParams.get("sort") || "date",
  });
  const observerTarget = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state); // Track latest state for avoiding stale closure
  const isInitialMount = useRef(true);
  const isFetchingRef = useRef(false); // Synchronous fetching flag to prevent duplicates
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

      const response = await postService.getAllPosts(
        currentPage,
        PAGE_SIZE,
        currentSearch,
        currentSort
      );

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
  }, []); // No dependencies needed with ref pattern

  // 검색어/정렬 변경 시 리셋 및 재로드
  useEffect(() => {
    if (!isInitialMount.current) {
      // 검색/정렬이 변경되면 처음부터 다시 로드
      loadPosts();
    }
  }, [state.searchQuery, state.sortBy, loadPosts]);

  // 초기 로드 - Strict Mode 중복 실행 방지 (빈 dependency array로 진정한 mount-only 실행)
  useEffect(() => {
    if (isInitialMount.current && state.posts.length === 0 && !state.loading) {
      isInitialMount.current = false;
      loadPosts();
    }
  }, []); // Empty dependency array for true mount-only execution

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Board</h1>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-400">
                  Hi, <span className="text-white font-medium">{user.username}</span>
                </span>
                <Link
                  to="/new"
                  className="px-4 py-2 bg-white font-bold text-black rounded-full hover:bg-gray-200 transition-colors"
                >
                  New Post
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-700 text-white rounded-full hover:bg-gray-900 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 border border-gray-700 text-white rounded-full hover:bg-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-white font-bold text-black rounded-full hover:bg-gray-200 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Search and Filter */}
      <SearchBar
        onSearch={handleSearch}
        onSortChange={handleSortChange}
        initialQuery={state.searchQuery}
        initialSort={state.sortBy}
      />

      {/* Main Content */}
      <main>
        {/* Error State with Retry */}
        {state.error && (
          <div
            className="p-4 m-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400"
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
            <p className="text-lg mb-4">No posts yet</p>
            <Link
              to="/new"
              className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
            >
              Create your first post
            </Link>
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
      </main>
    </div>
  );
}

export default Home;
