import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Sparkles, XCircle } from 'lucide-react';

interface EventRegistrationProps {
  eventId: string;
  onRegister: () => void;
  isRegistered: boolean;
  className?: string;
  onAuthRequired?: () => void;
  targetDate?: Date;
}

export const EventRegistration: React.FC<EventRegistrationProps> = ({
  eventId,
  onRegister,
  isRegistered: initialIsRegistered,
  className = "",
  onAuthRequired,
  targetDate
}) => {
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsRegistered(initialIsRegistered);
  }, [initialIsRegistered]);

  useEffect(() => {
    if (user) {
      checkRegistration(user.uid);
    } else {
      setIsRegistered(false);
    }
  }, [user, eventId]);

  const checkRegistration = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'event_registrations'),
        where('user_id', '==', userId),
        where('event_id', '==', eventId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      setIsRegistered(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const getEventStatus = () => {
    if (!targetDate) return 'upcoming';
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const distance = target - now;
    const oneHour = 1000 * 60 * 60;

    if (distance < -oneHour) return 'ended';
    if (distance >= -oneHour && distance <= oneHour) return 'happening';
    return 'upcoming';
  };

  const eventStatus = getEventStatus();
  const isPastEvent = eventStatus === 'ended';

  const handleRegister = async () => {
    if (isPastEvent) {
      toast({
        title: 'Event has ended',
        description: 'You cannot register for past events',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to register for events',
          variant: 'destructive'
        });
      }
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, 'event_registrations'),
        where('user_id', '==', user.uid),
        where('event_id', '==', eventId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Unregister
        const regDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'event_registrations', regDoc.id));

        setIsRegistered(false);
        toast({
          title: 'Unregistered',
          description: 'You have been unregistered from this event'
        });
      } else {
        // Register
        await addDoc(collection(db, 'event_registrations'), {
          user_id: user.uid,
          event_id: eventId,
          registered_at: new Date().toISOString()
        });

        setIsRegistered(true);
        onRegister();
        toast({
          title: 'Registered!',
          description: 'You have successfully registered for this event'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-6 self-stretch relative w-full ${className}`}>
      <button
        onClick={handleRegister}
        disabled={loading || isPastEvent}
        className={`w-full flex h-[70px] justify-center items-center gap-4 rounded-[25px] font-black uppercase italic tracking-[0.2em] text-xs transition-all duration-500 shadow-2xl overflow-hidden group
          ${isPastEvent
            ? 'bg-[var(--voko-text)]/10 text-[var(--voko-text)]/60 border border-[var(--voko-text)]/20 cursor-not-allowed'
            : isRegistered
              ? 'bg-transparent border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white'
              : 'bg-[var(--voko-accent)] border-none text-black hover:scale-[1.02] active:scale-[0.98]'
          }`}
      >
        <span className="flex items-center gap-3">
          {loading ? (
            "ENCRYPTING..."
          ) : isPastEvent ? (
            <>
              <Lock size={16} />
              ACCESS REVOKED
            </>
          ) : isRegistered ? (
            <>
              <XCircle size={18} />
              EXIT EXPERIENCE
            </>
          ) : (
            <>
              <Sparkles size={18} className="fill-black" />
              SECURE ACCESS
            </>
          )}
        </span>

        {/* Hover Shine Effect for main button */}
        {!isPastEvent && !isRegistered && (
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
        )}
      </button>

      {/* Aesthetic availability note */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-[var(--voko-accent)] rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black text-[var(--voko-text)]/60 uppercase tracking-widest">Digital Ticket Mandatory</span>
        </div>
        <span className="text-[9px] font-black text-[var(--voko-text)]/60 uppercase tracking-widest">Limit 01 • Per Member</span>
      </div>
    </div>
  );
};
