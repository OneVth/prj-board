import CommentItem from "./CommentItem";
import type { Comment } from "../../types/comment";

// ============================================
// Props 타입 정의
// ============================================

interface CommentListProps {
  comments: Comment[];
  onDelete: (commentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
}

// ============================================
// CommentList 컴포넌트
// ============================================

function CommentList({ comments, onDelete, onLike }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">첫 댓글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-bold text-lg mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        댓글 {comments.length}개
      </h3>
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onDelete={onDelete} onLike={onLike} />
        ))}
      </div>
    </div>
  );
}

export default CommentList;
export type { CommentListProps };
