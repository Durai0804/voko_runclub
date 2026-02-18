import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from './ThemeProvider';
import { AuthSheet } from './AuthSheet';

export const Navbar: React.FC = () => {
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    if (user && pendingRoute) {
      navigate(pendingRoute);
      setPendingRoute(null);
      setIsAuthOpen(false);
    }
  }, [user, pendingRoute, navigate]);

  const handleSignOut = async () => {
    await signOut(auth);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return createPortal(
    <>
      <nav className="fixed top-8 left-4 md:left-8 z-[2000] flex items-center gap-0" >
        {/* Logo */}
        <div className="bg-black text-white h-[34px] w-[34px] border border-black flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" className="w-4 h-4">
            <g id="smiley-smirk">
              <path id="Subtract" fill="currentColor" stroke="currentColor" strokeWidth="0.5" fillRule="evenodd" d="M1.83645 1.83645C3.06046 0.612432 4.82797 0 7 0s3.9395 0.612432 5.1636 1.83645C13.3876 3.06046 14 4.82797 14 7s-0.6124 3.9395 -1.8364 5.1636C10.9395 13.3876 9.17203 14 7 14s-3.93954 -0.6124 -5.16355 -1.8364C0.612432 10.9395 0 9.17203 0 7s0.612432 -3.93954 1.83645 -5.16355ZM5.0769 4.98816c0 -0.34518 -0.27982 -0.625 -0.625 -0.625 -0.34517 0 -0.625 0.27982 -0.625 0.625v0.7c0 0.34518 0.27983 0.625 0.625 0.625 0.34518 0 0.625 -0.27982 0.625 -0.625v-0.7Zm5.0962 0c0 -0.34518 -0.27983 -0.625 -0.625 -0.625 -0.34518 0 -0.625 0.27982 -0.625 0.625v0.7c0 0.34518 0.27982 0.625 0.625 0.625 0.34517 0 0.625 -0.27982 0.625 -0.625v-0.7Zm0.1787 2.42929c0.3217 0.12505 0.4812 0.48724 0.3561 0.80897 -0.2805 0.72182 -0.75537 1.29603 -1.40641 1.68306 -0.64416 0.38292 -1.4264 0.56282 -2.30149 0.56282 -0.34518 0 -0.625 -0.2798 -0.625 -0.62501 0 -0.34518 0.27982 -0.625 0.625 -0.625 0.7083 0 1.25628 -0.14564 1.66273 -0.38728 0.39956 -0.23753 0.69571 -0.58697 0.88012 -1.06143 0.12505 -0.32173 0.48725 -0.48117 0.80895 -0.35613Z" clipRule="evenodd"></path>
            </g>
          </svg>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <Link
            to="/"
            className="relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border border-black leading-none group"
          >
            <span className="relative z-10">DISCOVER</span>
            <span className="absolute inset-0 bg-[var(--voko-accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center border-l-0 border border-black group"
          >
            <span className="relative z-10">
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </span>
            <span className="absolute inset-0 bg-[var(--voko-accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
          </button>

          {role === 'admin' && (
            <button
              onClick={() => navigate('/create-event')}
              className="relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-black leading-none group"
            >
              <span className="relative z-10">CREATE EVENT</span>
              <span className="absolute inset-0 bg-[var(--voko-accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
            </button>
          )}

          {role === 'admin' && (
            <Link
              to="/admin"
              className="relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-black leading-none group"
            >
              <span className="relative z-10">ADMIN</span>
              <span className="absolute inset-0 bg-[var(--voko-accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
            </Link>
          )}
          {user ? (
            <>
              <div className="relative overflow-hidden bg-white text-[#1A1A1A] h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-black leading-none opacity-60">
                <span className="relative z-10">{user.displayName || user.email?.split('@')[0]}</span>
              </div>
              <Link
                to="/my-events"
                className="relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-black leading-none group"
              >
                <span className="relative z-10">MY EVENTS</span>
                <span className="absolute inset-0 bg-[var(--voko-accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </Link>
              <button
                onClick={handleSignOut}
                className="relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-black leading-none group hover:text-red-500 transition-colors"
              >
                <span className="relative z-10 flex items-center gap-1">
                  <LogOut size={12} />
                  SIGN OUT
                </span>
                <span className="absolute inset-0 bg-red-50 dark:bg-red-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsSignUpMode(true);
                  setIsAuthOpen(true);
                }}
                className="relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-black leading-none group"
              >
                <span className="relative z-10">SIGN UP</span>
                <span className="absolute inset-0 bg-[var(--voko-accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </button>
              <button
                onClick={() => {
                  setIsSignUpMode(false);
                  setIsAuthOpen(true);
                }}
                className="relative overflow-hidden bg-white text-black h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-black leading-none group"
              >
                <span className="relative z-10">LOG IN</span>
                <span className="absolute inset-0 bg-[var(--voko-accent)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Navigation - Full Screen */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[3000] flex flex-col animate-in slide-in-from-top duration-300">
            {/* Close header */}
            <div className="bg-[#1A1A1A] flex items-center justify-center py-16 animate-in fade-in duration-500">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white text-[11px] font-medium uppercase tracking-wider"
              >
                CLOSE
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 flex flex-col bg-white">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 flex items-center justify-center text-[#1A1A1A] text-[17px] font-medium uppercase border-b border-black tracking-[-0.34px] animate-fade-in"
                style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
              >
                DISCOVER
              </Link>
              {role === 'admin' && (
                <button
                  onClick={() => {
                    navigate('/create-event');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center text-[#1A1A1A] text-[17px] font-medium uppercase border-b border-black tracking-[-0.34px] animate-fade-in"
                  style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
                >
                  CREATE EVENT
                </button>
              )}
              {role === 'admin' && (
                <button
                  onClick={() => {
                    navigate('/admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center text-[#1A1A1A] text-[17px] font-medium uppercase border-b border-black tracking-[-0.34px] animate-fade-in"
                  style={{ animationDelay: '0.25s', animationFillMode: 'both' }}
                >
                  ADMIN
                </button>
              )}
              {user ? (
                <>
                  <div className="flex items-center justify-center py-4 text-[#1A1A1A] text-[11px] font-medium uppercase border-b border-black opacity-50 bg-gray-50/50">
                    Logged in as {user.email}
                  </div>
                  <Link
                    to="/my-events"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 flex items-center justify-center text-[#1A1A1A] text-[17px] font-medium uppercase border-b border-black tracking-[-0.34px] animate-fade-in"
                    style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
                  >
                    MY EVENTS
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 flex items-center justify-center text-red-500 text-[17px] font-medium uppercase tracking-[-0.34px] animate-fade-in bg-red-50 dark:bg-red-900/10"
                    style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
                  >
                    <LogOut size={18} className="mr-2" />
                    SIGN OUT
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsSignUpMode(true);
                      setIsAuthOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center text-[#1A1A1A] text-[17px] font-medium uppercase border-b border-black tracking-[-0.34px] animate-fade-in"
                    style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
                  >
                    SIGN UP
                  </button>
                  <button
                    onClick={() => {
                      setIsSignUpMode(false);
                      setIsAuthOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center text-[#1A1A1A] text-[17px] font-medium uppercase tracking-[-0.34px] animate-fade-in"
                    style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
                  >
                    LOG IN
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Menu Button - Mobile Only */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden relative overflow-hidden bg-white text-black h-[34px] px-3 border border-l-0 border-black flex items-center justify-center text-[11px] font-medium uppercase leading-none group"
        >
          <span className="relative z-10">MENU</span>
          <span className="absolute inset-0 bg-[#7092BE] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
        </button>
      </nav>

      <AuthSheet
        isOpen={isAuthOpen}
        onClose={() => { setIsAuthOpen(false); setPendingRoute(null); }}
        initialIsSignUp={isSignUpMode}
      />
    </>,
    document.body
  );
};
