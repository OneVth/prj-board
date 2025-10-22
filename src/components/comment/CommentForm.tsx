import { useState } from "react";
import type { CommentFormData } from "../../types/comment";

// ============================================
// Props 타입 정의
// ============================================

interface CommentFormProps {
  onSubmit: (data: CommentFormData) => Promise<void>;
  isSubmitting: boolean;
}

// ============================================
// CommentForm 컴포넌트
// ============================================

function CommentForm({ onSubmit, isSubmitting }: CommentFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    await onSubmit({
      content: content.trim(),
    });

    // 제출 성공 시 폼 초기화
    setContent("");
  };

  const isSubmitDisabled = !content.trim() || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="pt-6 border-t border-white/10">
      {/* Comment Input */}
      <div className="mb-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          maxLength={500}
          rows={3}
          className="w-full bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm text-white px-4 py-3 rounded-xl placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none border border-white/10 focus:border-purple-500/50 transition-all"
          disabled={isSubmitting}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {content.length} / 500
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            isSubmitDisabled
              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          }`}
        >
          {isSubmitting ? "작성 중..." : "댓글 작성"}
        </button>
      </div>
    </form>
  );
}

export default CommentForm;
export type { CommentFormProps };
