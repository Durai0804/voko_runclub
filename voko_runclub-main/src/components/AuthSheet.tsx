import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialIsSignUp?: boolean;
}

export const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Auto-close if user is detected (handles successful login/signup)
  React.useEffect(() => {
    if (user && isOpen) {
      setLoading(false);
      onClose();
    }
  }, [user, isOpen, onClose]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);

      const adminEmails = ['chairmadurai0804@gmail.com', 'codeimmani@gmail.com'];
      let role = adminEmails.includes(user.email || '') ? 'admin' : 'user';

      try {
        const roleRef = doc(db, 'user_roles', user.uid);
        const roleSnap = await getDoc(roleRef);

        if (!roleSnap.exists()) {
          await setDoc(roleRef, {
            role: role,
            email: user.email,
            display_name: user.displayName,
            photo_url: user.photoURL,
            created_at: new Date().toISOString()
          });
        } else {
          const data = roleSnap.data();
          // Force admin role if email matches
          if (adminEmails.includes(user.email || '') && data.role !== 'admin') {
            role = 'admin';
            await updateDoc(roleRef, { role: 'admin' });
          } else {
            role = data.role;
          }
          await setDoc(roleRef, {
            ...data,
            display_name: user.displayName || data.display_name,
            photo_url: user.photoURL || data.photo_url,
            last_login: new Date().toISOString()
          }, { merge: true });
        }
      } catch (dbError) {
        console.error("Database error during Google Login:", dbError);
        // Continue to navigation even if DB fails
      }

      toast({
        title: 'Welcome!',
        description: 'Signed in with Google.'
      });

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }

      onClose();
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      toast({
        title: 'Google Login Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black opacity-50 z-[1000]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] z-[1001] shadow-2xl transition-transform duration-300 ${isOpen ? 'animate-slide-in-right' : ''}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white hover:text-gray-300 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="flex flex-col h-full px-10 pt-24 pb-10">
          <h2 className="text-white text-4xl font-medium mb-2">
            Welcome to VOKO
          </h2>
          <p className="text-gray-400 text-sm mb-12">
            The sexiest RunClub in town. Sign in with Google to discover and manage events.
          </p>

          <div className="flex flex-col gap-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-black font-medium py-4 px-6 uppercase text-sm border border-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>
            <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest leading-relaxed">
              By continuing, you agree to our <br />Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="mt-auto">
            <div className="p-4 bg-white/5 border border-white/10 rounded-sm text-[11px] text-gray-400">
              <p className="uppercase tracking-wider font-semibold mb-1 opacity-50">Admin Notice</p>
              <p>Admins must sign in with authorized Google accounts to access the dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
