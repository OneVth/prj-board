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
      <div className="py-8 text-center text-gray-500">
        <p>첫 댓글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-bold text-lg mb-4">
        댓글 {comments.length}개
      </h3>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} onDelete={onDelete} onLike={onLike} />
      ))}
    </div>
  );
}

export default CommentList;
export type { CommentListProps };
