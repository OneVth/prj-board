import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, LogOut, PenSquare } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <motion.h1
              className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Board
            </motion.h1>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link
                to="/search"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                title="Search users"
              >
                <Search className="w-5 h-5" />
              </Link>
            </motion.div>

            {isAuthenticated && user ? (
              <>
                {/* User Profile Link */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden sm:block"
                >
                  <Link
                    to={`/profile/${user.id}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Hi, <span className="text-white font-medium">{user.username}</span>
                  </Link>
                </motion.div>

                {/* New Post Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link to="/new">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-full font-semibold shadow-lg shadow-purple-500/50"
                    >
                      <PenSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">New Post</span>
                    </Button>
                  </Link>
                </motion.div>

                {/* Logout Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                {/* Login Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Link to="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-full"
                    >
                      Login
                    </Button>
                  </Link>
                </motion.div>

                {/* Sign Up Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link to="/register">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-full font-semibold shadow-lg shadow-purple-500/50"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gradient accent line */}
      <motion.div
        className="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </motion.header>
  );
}
