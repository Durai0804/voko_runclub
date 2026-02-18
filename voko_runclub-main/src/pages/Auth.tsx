import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '@/lib/firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // We already handle initial redirection in useAuth/App logic or here
        // If user lands here while logged in, check role and move them
        const roleDoc = await getDoc(doc(db, 'user_roles', user.uid));
        const roleData = roleDoc.data();
        if (roleData?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);

      const roleRef = doc(db, 'user_roles', user.uid);
      const roleSnap = await getDoc(roleRef);

      const adminEmails = ['chairmadurai0804@gmail.com', 'codeimmani@gmail.com'];
      let role = adminEmails.includes(user.email || '') ? 'admin' : 'user';

      try {
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
      }

      toast({
        title: 'Success',
        description: 'Logged in with Google',
      });

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      toast({
        title: 'Google Login Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <SEOHead
        title="Sign In - VOKO"
        description="Sign in to your VOKO account to manage events"
      />
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="text-5xl font-normal text-[#1A1A1A] tracking-[-0.04em] mb-4">
            Welcome back
          </h2>
          <p className="text-sm text-[#1A1A1A] opacity-50 uppercase tracking-widest">
            The sexiest RunClub in town
          </p>
        </div>

        <div className="py-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border-black text-black hover:bg-gray-50 rounded-none h-14 flex items-center justify-center gap-3 uppercase text-[11px] font-semibold tracking-widest transition-all"
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
          </Button>
        </div>

        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          Safe • Secure • VOKO Verified
        </p>

        <div className="pt-8">
          <div className="p-4 bg-gray-50 border border-black/5 rounded-sm text-[11px] text-gray-500 text-left">
            <p className="uppercase tracking-wider font-semibold mb-1 opacity-50">Admin Notice</p>
            <p>Admins must sign in with their registered Google Workspace/Personal accounts.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
