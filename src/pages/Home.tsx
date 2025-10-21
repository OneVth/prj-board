import { useEffect, useReducer, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { postService } from "../services/postService";
import { LoadingSpinner, PostCard } from "../components";
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
};

type HomeAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { posts: Post[]; totalPages: number } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "RESET" };

// ============================================
// Reducer 함수
// ============================================

function homeReducer(state: HomeState, action: HomeAction): HomeState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        posts: [...state.posts, ...action.payload.posts],
        page: state.page + 1,
        hasMore: state.page < action.payload.totalPages,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "RESET":
      return initialState;
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
};

// ============================================
// Home 컴포넌트
// ============================================

function Home() {
  const [state, dispatch] = useReducer(homeReducer, initialState);
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
      // Use stateRef to get current page value (avoids stale closure)
      const currentPage = stateRef.current.page;
      const response = await postService.getAllPosts(currentPage, PAGE_SIZE);

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

  // 초기 로드 - Strict Mode 중복 실행 방지 (빈 dependency array로 진정한 mount-only 실행)
  useEffect(() => {
    if (isInitialMount.current && state.posts.length === 0 && !state.loading) {
      isInitialMount.current = false;
      loadPosts();
    }
  }, []); // Empty dependency array for true mount-only execution

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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">Board</h1>
          <Link
            to="/new"
            className="px-4 py-2 bg-white font-bold text-black rounded-full hover:bg-gray-200 transition-colors"
          >
            New Post
          </Link>
        </div>
      </header>

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
