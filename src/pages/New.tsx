import { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { postService } from "../services/postService";
import type { PostFormData } from "../types/post";

// ============================================
// State와 Action 타입 정의
// ============================================

type NewPostState = {
  formData: PostFormData;
  submitting: boolean;
  error: string | null;
};

type NewPostAction =
  | { type: "UPDATE_TITLE"; payload: string }
  | { type: "UPDATE_CONTENT"; payload: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; payload: string }
  | { type: "RESET" };

// ============================================
// Reducer 함수
// ============================================

function newPostReducer(
  state: NewPostState,
  action: NewPostAction
): NewPostState {
  switch (action.type) {
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
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// ============================================
// 초기 상태
// ============================================

const initialState: NewPostState = {
  formData: {
    title: "",
    content: "",
  },
  submitting: false,
  error: null,
};

// ============================================
// New 컴포넌트
// ============================================

function New() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(newPostReducer, initialState);

  const TITLE_MAX_LENGTH = 200;

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.formData.title.trim() || !state.formData.content.trim()) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: "Title and content are required",
      });
      return;
    }

    dispatch({ type: "SUBMIT_START" });

    try {
      const newPost = await postService.createPost({
        title: state.formData.title.trim(),
        content: state.formData.content.trim(),
      });
      dispatch({ type: "SUBMIT_SUCCESS" });
      navigate(`/article/${newPost.id}`);
    } catch (error) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to create post",
      });
    }
  };

  // 취소 핸들러 (내용이 있으면 확인)
  const handleCancel = () => {
    const hasContent =
      state.formData.title.trim() || state.formData.content.trim();

    if (hasContent) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }

    navigate("/");
  };

  // 제출 버튼 비활성화 조건
  const isSubmitDisabled =
    !state.formData.title.trim() ||
    !state.formData.content.trim() ||
    state.submitting;

  // ============================================
  // 렌더링
  // ============================================

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
          <h1 className="text-xl font-bold">New Post</h1>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${
              isSubmitDisabled
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {state.submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Error Message */}
        {state.error && (
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

export default New;
