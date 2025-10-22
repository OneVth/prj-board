import { useState } from "react";
import { Link } from "react-router-dom";
import { formatTime } from "../../utils/dateFormat";
import { useAuth } from "../../contexts/AuthContext";
import type { Comment } from "../../types/comment";

// ============================================
// Props 타입 정의
// ============================================

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
}

// ============================================
// CommentItem 컴포넌트
// ============================================

function CommentItem({ comment, onDelete, onLike }: CommentItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const { user } = useAuth();

  // 본인 댓글인지 확인
  const isAuthor = user && comment.authorId === user.id;

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

  const handleLike = async () => {
    if (liking) return;

    setLiking(true);
    try {
      await onLike(comment.id);
    } catch (error) {
      console.error("Failed to like comment:", error);
      alert("좋아요에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link
          to={`/profile/${comment.authorId}`}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          {comment.authorUsername[0]?.toUpperCase() || "?"}
        </Link>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Author and Time */}
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/profile/${comment.authorId}`}
              className="font-semibold text-sm hover:underline"
            >
              {comment.authorUsername}
            </Link>
            <span className="text-gray-500 text-xs">
              {formatTime(comment.createdAt)}
            </span>
          </div>

          {/* Comment Text */}
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words mb-2">
            {comment.content}
          </p>

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1 transition-colors text-sm disabled:opacity-50 ${
              comment.isLiked
                ? "text-red-400 hover:text-red-300"
                : "text-gray-500 hover:text-pink-400"
            }`}
            title="좋아요"
          >
            <span className="text-base">{comment.isLiked ? "❤️" : "🤍"}</span>
            <span>{comment.likes}</span>
          </button>
        </div>

        {/* Delete Button (본인 댓글만 표시) */}
        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-500 hover:text-red-400 transition-colors text-sm disabled:opacity-50"
            title="댓글 삭제"
          >
            {deleting ? "..." : "×"}
          </button>
        )}
      </div>
    </div>
  );
}

export default CommentItem;
export type { CommentItemProps };
