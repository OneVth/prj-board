import { useEffect, useReducer, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { postService } from "../services/postService";
import { formatTime } from "../utils/dateFormat";
import { LoadingSpinner } from "../components/common";
import type { Post } from "../types/post";

// ============================================
// State와 Action 타입 정의
// ============================================

type ArticleState = {
  post: Post | null;
  loading: boolean;
  error: string | null;
  isLiked: boolean;
  liking: boolean;
  deleting: boolean;
};

type ArticleAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Post }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "LIKE_START" }
  | { type: "LIKE_SUCCESS"; payload: Post }
  | { type: "LIKE_ERROR" }
  | { type: "DELETE_START" }
  | { type: "DELETE_SUCCESS" }
  | { type: "DELETE_ERROR"; payload: string };

// ============================================
// Reducer 함수
// ============================================

function articleReducer(
  state: ArticleState,
  action: ArticleAction
): ArticleState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        post: action.payload,
        error: null,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "LIKE_START":
      return { ...state, liking: true };
    case "LIKE_SUCCESS":
      return {
        ...state,
        liking: false,
        post: action.payload,
        isLiked: true,
      };
    case "LIKE_ERROR":
      return { ...state, liking: false };
    case "DELETE_START":
      return { ...state, deleting: true, error: null };
    case "DELETE_SUCCESS":
      return { ...state, deleting: false };
    case "DELETE_ERROR":
      return { ...state, deleting: false, error: action.payload };
    default:
      return state;
  }
}

// ============================================
// 초기 상태
// ============================================

const initialState: ArticleState = {
  post: null,
  loading: false,
  error: null,
  isLiked: false,
  liking: false,
  deleting: false,
};

// ============================================
// Article 컴포넌트
// ============================================

function Article() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(articleReducer, initialState);
  const isInitialMount = useRef(true);

  // 게시글 불러오기
  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        dispatch({ type: "FETCH_ERROR", payload: "Invalid post ID" });
        return;
      }

      dispatch({ type: "FETCH_START" });

      try {
        const post = await postService.getPostById(id);
        dispatch({ type: "FETCH_SUCCESS", payload: post });
      } catch (error) {
        dispatch({
          type: "FETCH_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to load post",
        });
      }
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadPost();
    }
  }, [id]);

  // 좋아요 핸들러
  const handleLike = async () => {
    if (!id || state.liking) return;

    dispatch({ type: "LIKE_START" });

    try {
      const updatedPost = await postService.likePost(id);
      dispatch({ type: "LIKE_SUCCESS", payload: updatedPost });
    } catch (error) {
      dispatch({ type: "LIKE_ERROR" });
      console.error("Failed to like post:", error);
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!id || state.deleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (!confirmed) return;

    dispatch({ type: "DELETE_START" });

    try {
      await postService.deletePost(id);
      dispatch({ type: "DELETE_SUCCESS" });
      navigate("/");
    } catch (error) {
      dispatch({
        type: "DELETE_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to delete post",
      });
    }
  };

  // ============================================
  // 렌더링
  // ============================================

  // Loading State
  if (state.loading) {
    return <LoadingSpinner />;
  }

  // Error State
  if (state.error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4">
        <p className="text-red-400 text-xl mb-4">⚠️ {state.error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // No Post State
  if (!state.post) {
    return null;
  }

  const { post } = state;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={state.deleting}
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={state.deleting}
              className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                state.deleting
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {state.deleting ? "Deleting..." : "Delete"}
            </button>
            <Link
              to={`/edit/${post.id}`}
              className={`px-4 py-2 bg-white font-bold text-black rounded-full transition-colors ${
                state.deleting
                  ? "pointer-events-none opacity-50"
                  : "hover:bg-gray-200"
              }`}
            >
              Edit
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
            {post.title[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-semibold text-lg">{post.title}</p>
            <p className="text-sm text-gray-500">
              {formatTime(post.created_at)}
            </p>
          </div>
        </div>

        {/* Post Content */}
        <article className="mb-6">
          <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </article>

        {/* Action Buttons */}
        <div className="flex items-center gap-6 py-4 border-y border-gray-800 mb-6">
          <button
            onClick={handleLike}
            disabled={state.liking}
            className={`flex items-center gap-2 transition-colors ${
              state.isLiked
                ? "text-red-500"
                : "text-gray-400 hover:text-red-500"
            } ${state.liking ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="text-2xl">{state.isLiked ? "❤️" : "🤍"}</span>
            <span className="font-semibold">{post.likes}</span>
          </button>
          <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors">
            <span className="text-2xl">💬</span>
            <span className="font-semibold">0</span>
          </button>
          <button className="flex items-center gap-2 text-gray-400 hover:text-green-500 transition-colors">
            <span className="text-2xl">📤</span>
            <span className="font-semibold">Share</span>
          </button>
        </div>

        {/* Comments Section Placeholder */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No comments yet</p>
            <p className="text-sm mt-2">Be the first to comment!</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Article;
