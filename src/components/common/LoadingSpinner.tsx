function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default LoadingSpinner;
