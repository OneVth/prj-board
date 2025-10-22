import { useEffect, useReducer, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Edit3 } from "lucide-react";
import { postService } from "../services/postService";
import { commentService } from "../services/commentService";
import { useAuth } from "../contexts/AuthContext";
import { formatTime } from "../utils/dateFormat";
import { LoadingSpinner, CommentForm, CommentList, Header } from "../components";
import { Button } from "../components/ui/button";
import type { Post } from "../types/post";
import type { Comment, CommentFormData } from "../types/comment";

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
  // Comment states
  comments: Comment[];
  commentsLoading: boolean;
  commentsError: string | null;
  submittingComment: boolean;
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
  | { type: "DELETE_ERROR"; payload: string }
  // Comment actions
  | { type: "COMMENTS_FETCH_START" }
  | { type: "COMMENTS_FETCH_SUCCESS"; payload: Comment[] }
  | { type: "COMMENTS_FETCH_ERROR"; payload: string }
  | { type: "COMMENT_SUBMIT_START" }
  | { type: "COMMENT_SUBMIT_SUCCESS"; payload: Comment }
  | { type: "COMMENT_SUBMIT_ERROR" }
  | { type: "COMMENT_DELETE_SUCCESS"; payload: string }
  | { type: "COMMENT_LIKE_SUCCESS"; payload: Comment };

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
        isLiked: action.payload.isLiked,
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
        isLiked: action.payload.isLiked,
      };
    case "LIKE_ERROR":
      return { ...state, liking: false };
    case "DELETE_START":
      return { ...state, deleting: true, error: null };
    case "DELETE_SUCCESS":
      return { ...state, deleting: false };
    case "DELETE_ERROR":
      return { ...state, deleting: false, error: action.payload };
    // Comment actions
    case "COMMENTS_FETCH_START":
      return { ...state, commentsLoading: true, commentsError: null };
    case "COMMENTS_FETCH_SUCCESS":
      return {
        ...state,
        commentsLoading: false,
        comments: action.payload,
        commentsError: null,
      };
    case "COMMENTS_FETCH_ERROR":
      return { ...state, commentsLoading: false, commentsError: action.payload };
    case "COMMENT_SUBMIT_START":
      return { ...state, submittingComment: true };
    case "COMMENT_SUBMIT_SUCCESS":
      return {
        ...state,
        submittingComment: false,
        comments: [...state.comments, action.payload],
      };
    case "COMMENT_SUBMIT_ERROR":
      return { ...state, submittingComment: false };
    case "COMMENT_DELETE_SUCCESS":
      return {
        ...state,
        comments: state.comments.filter((c) => c.id !== action.payload),
      };
    case "COMMENT_LIKE_SUCCESS":
      return {
        ...state,
        comments: state.comments.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
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
  comments: [],
  commentsLoading: false,
  commentsError: null,
  submittingComment: false,
};

// ============================================
// Article 컴포넌트
// ============================================

function Article() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
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
        const post = await postService.getPostById(id, accessToken || undefined);
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
  }, [id, accessToken]);

  // 댓글 불러오기
  useEffect(() => {
    const loadComments = async () => {
      if (!id) return;

      dispatch({ type: "COMMENTS_FETCH_START" });

      try {
        const comments = await commentService.getCommentsByPostId(id, accessToken || undefined);
        dispatch({ type: "COMMENTS_FETCH_SUCCESS", payload: comments });
      } catch (error) {
        dispatch({
          type: "COMMENTS_FETCH_ERROR",
          payload:
            error instanceof Error
              ? error.message
              : "Failed to load comments",
        });
      }
    };

    if (state.post) {
      loadComments();
    }
  }, [id, state.post, accessToken]);

  // 좋아요 핸들러
  const handleLike = async () => {
    if (!id || state.liking || !accessToken) return;

    dispatch({ type: "LIKE_START" });

    try {
      const updatedPost = await postService.likePost(id, accessToken);
      dispatch({ type: "LIKE_SUCCESS", payload: updatedPost });
    } catch (error) {
      dispatch({ type: "LIKE_ERROR" });
      console.error("Failed to like post:", error);
      alert("좋아요에 실패했습니다. 로그인이 필요합니다.");
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!id || state.deleting || !accessToken) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (!confirmed) return;

    dispatch({ type: "DELETE_START" });

    try {
      await postService.deletePost(id, accessToken);
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

  // 댓글 작성 핸들러
  const handleCommentSubmit = async (data: CommentFormData) => {
    if (!id || !accessToken) return;

    dispatch({ type: "COMMENT_SUBMIT_START" });

    try {
      const newComment = await commentService.createComment(id, data, accessToken);
      dispatch({ type: "COMMENT_SUBMIT_SUCCESS", payload: newComment });
    } catch (error) {
      dispatch({ type: "COMMENT_SUBMIT_ERROR" });
      console.error("Failed to create comment:", error);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  // 댓글 삭제 핸들러
  const handleCommentDelete = async (commentId: string) => {
    if (!accessToken) return;

    try {
      await commentService.deleteComment(commentId, accessToken);
      dispatch({ type: "COMMENT_DELETE_SUCCESS", payload: commentId });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      throw error; // CommentItem에서 에러 처리
    }
  };

  // 댓글 좋아요 핸들러
  const handleCommentLike = async (commentId: string) => {
    if (!accessToken) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      return;
    }

    try {
      const updatedComment = await commentService.likeComment(commentId, accessToken);
      dispatch({ type: "COMMENT_LIKE_SUCCESS", payload: updatedComment });
    } catch (error) {
      console.error("Failed to like comment:", error);
      throw error; // CommentItem에서 에러 처리
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

  // 본인 게시글인지 확인
  const isAuthor = user && post.authorId === user.id;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />

      {/* Action Bar - Only for authors */}
      {isAuthor && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm"
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex justify-end items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleDelete}
                disabled={state.deleting}
                variant="outline"
                className="rounded-full border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>{state.deleting ? "Deleting..." : "Delete"}</span>
                </span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to={`/edit/${post.id}`}>
                <Button
                  disabled={state.deleting}
                  className="relative overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/50"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </span>
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          {/* Author Info */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Link
              to={`/profile/${post.authorId}`}
              className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all w-fit"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                {post.authorUsername?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold text-lg hover:underline">{post.authorUsername || "Unknown"}</p>
                <p className="text-sm text-gray-500">
                  {formatTime(post.createdAt)}
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Post Content Container */}
          <motion.article
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.005 }}
            className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 hover:from-white/[0.08] hover:to-white/[0.02] backdrop-blur-xl border border-white/10 mb-6 transition-all duration-300 group"
          >
            {/* Gradient border on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl" />
            </div>
            <div className="relative z-10">
              {/* Post Title */}
              <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-300">
                {post.title}
              </h1>

              {/* Post Content */}
              <p className="text-white text-lg leading-relaxed whitespace-pre-wrap mb-6">
                {post.content}
              </p>

              {/* Post Image */}
              {post.image && (
                <div className="mt-4">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full rounded-lg border border-white/10"
                  />
                </div>
              )}
            </div>
          </motion.article>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex items-center justify-end gap-6 p-5 rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 mb-6"
          >
            <button
              onClick={handleLike}
              disabled={state.liking}
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                state.isLiked
                  ? "text-red-400"
                  : "text-gray-400"
              } ${state.liking ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="text-xl">{state.isLiked ? "❤️" : "🤍"}</span>
              <span className="font-medium">{post.likes}</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-400">
              <span className="text-xl">💬</span>
              <span className="font-medium">{state.comments.length}</span>
            </button>
          </motion.div>

          {/* Comments Section */}
          <motion.section
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10"
          >
            {/* Comments List */}
            {state.commentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : state.commentsError ? (
              <div className="text-center py-8 text-red-400">
                {state.commentsError}
              </div>
            ) : (
              <CommentList
                comments={state.comments}
                onDelete={handleCommentDelete}
                onLike={handleCommentLike}
              />
            )}

            {/* Comment Form */}
            <div className="mt-6">
              <CommentForm
                onSubmit={handleCommentSubmit}
                isSubmitting={state.submittingComment}
              />
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}

export default Article;
