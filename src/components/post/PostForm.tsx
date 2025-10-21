import { useState } from "react";
import type { PostFormData } from "../../types/post";

// ============================================
// Props 타입 정의
// ============================================

interface PostFormProps {
  initialTitle?: string;
  initialContent?: string;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  submitButtonText: string;
  isSubmitting: boolean;
  error: string | null;
}

// ============================================
// PostForm 컴포넌트
// ============================================

function PostForm({
  initialTitle = "",
  initialContent = "",
  onSubmit,
  onCancel,
  submitButtonText,
  isSubmitting,
  error,
}: PostFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  const TITLE_MAX_LENGTH = 200;

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
    });
  };

  // 제출 버튼 비활성화 조건
  const isSubmitDisabled = !title.trim() || !content.trim() || isSubmitting;

  return (
    <>
      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400"
          role="alert"
        >
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Title Input */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={TITLE_MAX_LENGTH}
            className="w-full bg-transparent text-2xl font-bold placeholder-gray-600 focus:outline-none border-none"
            disabled={isSubmitting}
            autoFocus
          />
          {/* Character Counter */}
          <div className="text-right text-sm text-gray-500 mt-1">
            {title.length} / {TITLE_MAX_LENGTH}
          </div>
        </div>

        {/* Content Textarea */}
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-64 bg-transparent text-lg placeholder-gray-600 focus:outline-none resize-none border-none"
            disabled={isSubmitting}
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

        {/* Hidden Submit Button (triggered by header button) */}
        <button type="submit" className="hidden" disabled={isSubmitDisabled} />
      </form>
    </>
  );
}

export default PostForm;
export type { PostFormProps };
