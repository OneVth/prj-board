import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { postService } from "../services/postService";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner, PostForm } from "../components";
import type { Post, PostFormData } from "../types/post";

// ============================================
// Edit 컴포넌트
// ============================================

function Edit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // 게시글 불러오기
  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setError("Invalid post ID");
        return;
      }

      setLoading(true);

      try {
        const loadedPost = await postService.getPostById(id);
        setPost(loadedPost);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadPost();
    }
  }, [id]);

  // 폼 제출 핸들러
  const handleSubmit = async (data: PostFormData) => {
    if (!id) return;

    if (!accessToken) {
      setError("You must be logged in to edit a post");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedPost = await postService.updatePost(id, data, accessToken);
      navigate(`/article/${updatedPost.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
      setSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    navigate(`/article/${id}`);
  };

  // ============================================
  // 렌더링
  // ============================================

  // Loading State
  if (loading) {
    return <LoadingSpinner />;
  }

  // Error State
  if (error && !post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4">
        <p className="text-red-400 text-xl mb-4">⚠️ {error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <h1 className="text-xl font-bold">Edit Post</h1>
          <button
            onClick={() => {
              const form = document.querySelector("form");
              form?.requestSubmit();
            }}
            disabled={submitting}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${
              submitting
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {submitting ? "Updating..." : "Update"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PostForm
          initialTitle={post.title}
          initialContent={post.content}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitButtonText="Update"
          isSubmitting={submitting}
          error={error}
        />
      </main>
    </div>
  );
}

export default Edit;
