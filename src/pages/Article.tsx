import { useParams } from "react-router-dom";

function Article() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Article Detail</h1>
      <p className="text-gray-400">게시글 ID: {id}</p>
    </div>
  );
}

export default Article;
