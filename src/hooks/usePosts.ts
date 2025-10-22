import { useReducer, useRef, useCallback, useEffect } from "react";
import { postService } from "../services/postService";
import type { Post } from "../types/post";

/**
 * 게시글 상태 타입
 */
type PostsState = {
  posts: Post[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  searchQuery: string;
  sortBy: string;
};

/**
 * 게시글 액션 타입
 */
type PostsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { posts: Post[]; totalPages: number } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "RESET" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_SORT"; payload: string };

/**
 * 게시글 Reducer
 */
function postsReducer(state: PostsState, action: PostsAction): PostsState {
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
        posts: [],
        loading: false,
        error: null,
        page: 1,
        hasMore: true,
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
      };
    case "SET_SEARCH":
      return {
        posts: [],
        loading: false,
        error: null,
        page: 1,
        hasMore: true,
        searchQuery: action.payload,
        sortBy: state.sortBy,
      };
    case "SET_SORT":
      return {
        posts: [],
        loading: false,
        error: null,
        page: 1,
        hasMore: true,
        searchQuery: state.searchQuery,
        sortBy: action.payload,
      };
    default:
      return state;
  }
}

/**
 * usePosts Hook Options
 */
interface UsePostsOptions {
  initialSearchQuery?: string;
  initialSortBy?: string;
  pageSize?: number;
}

/**
 * 게시글 로딩 및 무한 스크롤 관리 Custom Hook
 *
 * @param options - 초기 검색어, 정렬 기준, 페이지 크기
 * @returns 게시글 상태 및 제어 함수들
 *
 * @example
 * const { posts, loading, hasMore, loadMore, setSearch, setSort } = usePosts({
 *   initialSearchQuery: "react",
 *   initialSortBy: "date",
 *   pageSize: 10
 * });
 */
export function usePosts(options: UsePostsOptions = {}) {
  const {
    initialSearchQuery = "",
    initialSortBy = "date",
    pageSize = 10,
  } = options;

  const [state, dispatch] = useReducer(postsReducer, {
    posts: [],
    loading: false,
    error: null,
    page: 1,
    hasMore: true,
    searchQuery: initialSearchQuery,
    sortBy: initialSortBy,
  });

  const stateRef = useRef(state); // Avoid stale closure
  const isFetchingRef = useRef(false); // Prevent duplicate requests
  const isInitialMount = useRef(true);

  // Keep stateRef in sync with latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /**
   * 게시글 로드 함수 - 중복 요청 방지
   */
  const loadPosts = useCallback(async () => {
    // 동기적 체크: 이미 로딩 중이거나 더 이상 데이터가 없으면 중단
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
        pageSize,
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
  }, [pageSize]); // pageSize만 dependency로 (나머지는 ref 사용)

  /**
   * 검색어/정렬 변경 시 리셋 및 재로드
   */
  useEffect(() => {
    if (!isInitialMount.current) {
      loadPosts();
    }
  }, [state.searchQuery, state.sortBy, loadPosts]);

  /**
   * 초기 로드 - Strict Mode 중복 실행 방지
   */
  useEffect(() => {
    if (isInitialMount.current && state.posts.length === 0 && !state.loading) {
      isInitialMount.current = false;
      loadPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for true mount-only execution

  /**
   * 검색어 변경
   */
  const setSearch = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH", payload: query });
  }, []);

  /**
   * 정렬 기준 변경
   */
  const setSort = useCallback((sortBy: string) => {
    dispatch({ type: "SET_SORT", payload: sortBy });
  }, []);

  /**
   * 수동 재시도
   */
  const retry = useCallback(() => {
    dispatch({ type: "RESET" });
    loadPosts();
  }, [loadPosts]);

  return {
    // State
    posts: state.posts,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    searchQuery: state.searchQuery,
    sortBy: state.sortBy,

    // Actions
    loadMore: loadPosts,
    setSearch,
    setSort,
    retry,
  };
}
