import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Home Feed</h1>
      <p className="text-gray-400">게시글 목록이 여기에 표시됩니다.</p>

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
