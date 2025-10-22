import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postService } from "../services/postService";
import { useAuth } from "../contexts/AuthContext";
import { PostForm } from "../components";
import type { PostFormData } from "../types/post";

// ============================================
// New 컴포넌트
// ============================================

function New() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 제출 핸들러
  const handleSubmit = async (data: PostFormData) => {
    if (!accessToken) {
      setError("You must be logged in to create a post");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newPost = await postService.createPost(data, accessToken);
      navigate(`/article/${newPost.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
      setSubmitting(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    navigate("/");
  };

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
            disabled={submitting}
          >
            Cancel
          </button>
          <h1 className="text-xl font-bold">New Post</h1>
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
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PostForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitButtonText="Post"
          isSubmitting={submitting}
          error={error}
        />
      </main>
    </div>
  );
}

export default New;
