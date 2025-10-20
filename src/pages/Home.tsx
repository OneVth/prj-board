import { Link } from "react-router-dom";
import type { Post } from "../types/post";
import { formatTime } from "../utils/dateFormat";

function Home() {
  // mock data
  const mockPost: Post = {
    id: "1",
    title: "첫 번째 게시글",
    content: "TypeScript 타입이 제대로 작동합니다.",
    created_at: new Date().toISOString(),
    likes: 0,
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Home Feed</h1>

      <div className="mb-8 p-4 bg-gray-900 rounded-lg">
        <h2 className="text-xl font-bold">{mockPost.title}</h2>
        <p className="text-gray-400">{mockPost.content}</p>
        <div className="text-sm text-gray-500 mt-2 flex flex-row justify-between">
          <p>Likes: {mockPost.likes}</p>
          <p>{formatTime(mockPost.created_at)}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          to="/new"
          className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
        >
          Create Post
        </Link>
        <Link
          to="/article/1"
          className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
        >
          View Article 1
        </Link>
      </div>
    </div>
  );
}

export default Home;
