import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, LogOut, User, Search } from "lucide-react";
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
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo/Brand */}
        <Link to="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 opacity-75 blur-md"></div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                <span className="text-xl font-bold text-white">B</span>
              </div>
            </div>
            <span className="hidden text-xl font-bold text-white sm:block">
              Board
            </span>
          </motion.div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* User Greeting */}
              <Link to={`/profile/${user.id}`}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="hidden items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-white/10 md:flex"
                >
                  <User className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">
                    Hi, {user.username}
                  </span>
                </motion.div>
              </Link>

              {/* Search Users Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/search">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-white/20 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
                    title="Search users"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>

              {/* New Post Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/new">
                  <Button
                    className="relative overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/50 sm:px-6"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">New Post</span>
                    </span>
                  </Button>
                </Link>
              </motion.div>

              {/* Logout Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </span>
                </Button>
              </motion.div>
            </>
          ) : (
            <>
              {/* Login Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="rounded-full border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                  >
                    Login
                  </Button>
                </Link>
              </motion.div>

              {/* Sign Up Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register">
                  <Button
                    className="relative overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-purple-500/50 sm:px-6"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative">Sign Up</span>
                  </Button>
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Gradient line at bottom */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
    </motion.header>
  );
}
