import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Truck, Wallet, User as UserIcon, Shield, Menu, X, LogIn, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { name: "Booking", path: "/", icon: Truck },
    { name: "User Wallet", path: "/wallet", icon: Wallet },
    { name: "Captain Dashboard", path: "/captain", icon: UserIcon },
    { name: "Admin Panel", path: "/admin", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">LogiLedger</span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <div className="h-6 w-px bg-slate-200 mx-2" />
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-900">{user.displayName}</span>
                    <span className="text-[10px] text-slate-500">{user.email}</span>
                  </div>
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName || ""} className="h-8 w-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium ${
                      location.pathname === item.path
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                
                <div className="border-t border-slate-100 pt-2 mt-2">
                  {user ? (
                    <div className="flex items-center justify-between px-3 py-3">
                      <div className="flex items-center space-x-3">
                        {user.photoURL && (
                          <img src={user.photoURL} alt={user.displayName || ""} className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.displayName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="p-2 text-red-600"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-3 text-indigo-600 font-bold"
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Login with Google</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
