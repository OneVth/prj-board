import { useState } from "react";
import { formatTime } from "../../utils/dateFormat";
import type { Comment } from "../../types/comment";

// ============================================
// Props 타입 정의
// ============================================

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => Promise<void>;
}

// ============================================
// CommentItem 컴포넌트
// ============================================

function CommentItem({ comment, onDelete }: CommentItemProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;

    const confirmed = window.confirm("댓글을 삭제하시겠습니까?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("댓글 삭제에 실패했습니다.");
      setDeleting(false);
    }
  };

  return (
    <div className="border-b border-gray-800 py-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {comment.author[0]?.toUpperCase() || "?"}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Author and Time */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.author}</span>
            <span className="text-gray-500 text-xs">
              {formatTime(comment.createdAt)}
            </span>
          </div>

          {/* Comment Text */}
          <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-500 hover:text-red-400 transition-colors text-sm disabled:opacity-50"
          title="댓글 삭제"
        >
          {deleting ? "..." : "×"}
        </button>
      </div>
    </div>
  );
}

export default CommentItem;
export type { CommentItemProps };
