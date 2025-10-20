import { useNavigate } from "react-router-dom";

function NotFound() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-9xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
        404
      </h1>
      <p className="text-2xl text-gray-400 mb-8">Page Not Found</p>
      <button
        onClick={() => nav(-1)}
        className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
}

export default NotFound;
