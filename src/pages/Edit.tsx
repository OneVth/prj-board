import { useEffect, useReducer, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { postService } from "../services/postService";
import type { Post, PostFormData } from "../types/post";

// ============================================
// State와 Action 타입 정의
// ============================================

type EditPostState = {
  originalPost: Post | null;
  formData: PostFormData;
  loading: boolean;
  submitting: boolean;
  error: string | null;
};

type EditPostAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Post }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPDATE_TITLE"; payload: string }
  | { type: "UPDATE_CONTENT"; payload: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; payload: string };

// ============================================
// Reducer 함수
// ============================================

function editPostReducer(
  state: EditPostState,
  action: EditPostAction
): EditPostState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        originalPost: action.payload,
        formData: {
          title: action.payload.title,
          content: action.payload.content,
        },
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "UPDATE_TITLE":
      return {
        ...state,
        formData: { ...state.formData, title: action.payload },
        error: null,
      };
    case "UPDATE_CONTENT":
      return {
        ...state,
        formData: { ...state.formData, content: action.payload },
        error: null,
      };
    case "SUBMIT_START":
      return { ...state, submitting: true, error: null };
    case "SUBMIT_SUCCESS":
      return { ...state, submitting: false };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.payload };
    default:
      return state;
  }
}

// ============================================
// 초기 상태
// ============================================

const initialState: EditPostState = {
  originalPost: null,
  formData: {
    title: "",
    content: "",
  },
  loading: false,
  submitting: false,
  error: null,
};

// ============================================
// Edit 컴포넌트
// ============================================

function Edit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(editPostReducer, initialState);
  const isInitialMount = useRef(true);

  const TITLE_MAX_LENGTH = 200;

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
          payload: error instanceof Error ? error.message : "Failed to load post",
        });
      }
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadPost();
    }
  }, [id]);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!state.formData.title.trim() || !state.formData.content.trim()) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: "Title and content are required",
      });
      return;
    }

    dispatch({ type: "SUBMIT_START" });

    try {
      const updatedPost = await postService.updatePost(id, {
        title: state.formData.title.trim(),
        content: state.formData.content.trim(),
      });
      dispatch({ type: "SUBMIT_SUCCESS" });
      navigate(`/article/${updatedPost.id}`);
    } catch (error) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to update post",
      });
    }
  };

  // 취소 핸들러 (변경사항이 있으면 확인)
  const handleCancel = () => {
    const hasChanges =
      state.originalPost &&
      (state.formData.title !== state.originalPost.title ||
        state.formData.content !== state.originalPost.content);

    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }

    navigate(`/article/${id}`);
  };

  // 제출 버튼 비활성화 조건
  const isSubmitDisabled =
    !state.formData.title.trim() ||
    !state.formData.content.trim() ||
    state.submitting ||
    state.loading;

  // ============================================
  // 렌더링
  // ============================================

  // Loading State
  if (state.loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error State
  if (state.error && !state.originalPost) {
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={state.submitting}
          >
            Cancel
          </button>
          <h1 className="text-xl font-bold">Edit Post</h1>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${
              isSubmitDisabled
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {state.submitting ? "Updating..." : "Update"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Error Message */}
        {state.error && state.originalPost && (
          <div
            className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400"
            role="alert"
          >
            ⚠️ {state.error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="mb-4">
            <input
              type="text"
              value={state.formData.title}
              onChange={(e) =>
                dispatch({ type: "UPDATE_TITLE", payload: e.target.value })
              }
              placeholder="Title"
              maxLength={TITLE_MAX_LENGTH}
              className="w-full bg-transparent text-2xl font-bold placeholder-gray-600 focus:outline-none border-none"
              disabled={state.submitting}
              autoFocus
            />
            {/* Character Counter */}
            <div className="text-right text-sm text-gray-500 mt-1">
              {state.formData.title.length} / {TITLE_MAX_LENGTH}
            </div>
          </div>

          {/* Content Textarea */}
          <div className="mb-6">
            <textarea
              value={state.formData.content}
              onChange={(e) =>
                dispatch({ type: "UPDATE_CONTENT", payload: e.target.value })
              }
              placeholder="What's on your mind?"
              className="w-full h-64 bg-transparent text-lg placeholder-gray-600 focus:outline-none resize-none border-none"
              disabled={state.submitting}
            />
          </div>

          {/* Icon Buttons (Placeholder for future features) */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
              disabled
              title="Image upload (coming soon)"
            >
              <span className="text-2xl">🖼️</span>
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
              disabled
              title="Emoji picker (coming soon)"
            >
              <span className="text-2xl">😊</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default Edit;
