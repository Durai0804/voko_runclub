import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Plus, 
  LogOut, 
  Calendar, 
  MapPin, 
  Edit3, 
  Eye, 
  Users, 
  Zap,
  TrendingUp,
  Settings,
  Trash2
} from 'lucide-react';

// Input validation schema
const eventSchema = z.object({
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  creator: z.string()
    .trim()
    .min(1, 'Creator is required')
    .max(100, 'Creator must be less than 100 characters'),
  description: z.string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  date: z.string()
    .trim()
    .min(1, 'Date is required')
    .max(50, 'Date must be less than 50 characters'),
  time: z.string()
    .trim()
    .min(1, 'Time is required')
    .max(50, 'Time must be less than 50 characters'),
  address: z.string()
    .trim()
    .min(1, 'Address is required')
    .max(300, 'Address must be less than 300 characters'),
  target_date: z.string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Invalid date format'),
});

interface Event {
  id: string;
  title: string;
  creator: string;
  description: string;
  date: string;
  time: string;
  address: string;
  background_image_url: string;
  target_date: string;
}

const Admin = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges',
          variant: 'destructive',
        });
        navigate('/');
      } else {
        fetchEvents();
      }
    }
  }, [user, role, authLoading, navigate]);

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      setEvents(eventsData);
      setLoading(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Delete this vibe forever? No undoing this.')) return;
    try {
      await deleteDoc(doc(db, 'events', eventId));
      toast({
        title: 'Event Vaporized',
        description: 'The event has been removed from the grid.',
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: 'Deletion Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading || (loading && user && role === 'admin')) {
    return (
      <div className="min-h-screen bg-admin-light-bg dark:bg-admin-dark-bg flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-admin-light-accent dark:border-admin-dark-accent border-t-transparent rounded-full shadow-[0_0_20px_rgba(0,255,0,0.5)]"
        />
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-admin-light-bg dark:bg-admin-dark-bg text-admin-light-text dark:text-admin-dark-text selection:bg-admin-light-accent dark:selection:bg-admin-dark-accent selection:text-white transition-colors duration-500 overflow-hidden relative font-sans">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-admin-light-accent/10 dark:bg-admin-dark-accent/10 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-admin-light-accent/5 dark:bg-admin-dark-accent/5 blur-[150px] rounded-full"
        />
      </div>

      <SEOHead
        title="POWER CONSOLE | Admin"
        description="Voko Admin Hub"
      />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "out" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-admin-light-accent dark:text-admin-dark-accent font-black tracking-[0.2em] text-xs uppercase">Power Console</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter">
              ADMIN <span className="text-admin-light-accent dark:text-admin-dark-accent transition-colors duration-500">DASH</span>
            </h1>
          </motion.div>

            <div className="flex flex-wrap items-center -space-x-px">
              <button
                onClick={() => navigate('/')}
                className="relative overflow-hidden bg-white dark:bg-admin-dark-bg text-black dark:text-white h-[40px] px-6 flex items-center text-[11px] font-black uppercase border border-black dark:border-white/20 leading-none group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Eye size={14} />
                  DISCOVER
                </span>
                <span className="absolute inset-0 bg-admin-light-accent dark:bg-admin-dark-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </button>
              <button
                onClick={() => navigate('/my-events')}
                className="relative overflow-hidden bg-white dark:bg-admin-dark-bg text-black dark:text-white h-[40px] px-6 flex items-center text-[11px] font-black uppercase border border-l-0 border-black dark:border-white/20 leading-none group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Users size={14} />
                  MY EVENTS
                </span>
                <span className="absolute inset-0 bg-admin-light-accent dark:bg-admin-dark-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </button>
              <button
                onClick={() => navigate('/create-event')}
                className="relative overflow-hidden bg-white dark:bg-admin-dark-bg text-black dark:text-white h-[40px] px-6 flex items-center text-[11px] font-black uppercase border border-l-0 border-black dark:border-white/20 leading-none group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Plus size={14} />
                  NEW VIBE
                </span>
                <span className="absolute inset-0 bg-admin-light-accent dark:bg-admin-dark-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </button>
              <button
                onClick={handleSignOut}
                className="relative overflow-hidden bg-white dark:bg-admin-dark-bg text-black dark:text-white h-[40px] px-6 flex items-center text-[11px] font-black uppercase border border-l-0 border-black dark:border-white/20 leading-none group hover:text-white"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <LogOut size={14} />
                  SIGN OUT
                </span>
                <span className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </button>
              <div className="ml-4 h-[40px] flex items-center">
                <ThemeToggle />
              </div>
            </div>
        </header>

        {/* Events Table Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-black/5 dark:bg-white/5 backdrop-blur-2xl border border-black/5 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-admin-light-accent dark:text-admin-dark-accent" />
              <h2 className="text-2xl font-black tracking-tight italic">LIVE EVENTS</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black/[0.03] dark:bg-white/[0.03]">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">Vibe</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">Timeline</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">Hub</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.3em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {events.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-gray-500 dark:text-gray-400 font-bold italic uppercase tracking-widest">No events in the grid.</p>
                      </td>
                    </motion.tr>
                  ) : (
                    events.map((event, i) => (
                      <motion.tr 
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.05) }}
                        className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-all duration-300"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-admin-light-accent dark:from-admin-dark-accent to-blue-400 dark:to-green-400 p-[1px]">
                              <div className="w-full h-full rounded-xl bg-admin-light-bg dark:bg-admin-dark-bg flex items-center justify-center overflow-hidden">
                                {event.background_image_url ? (
                                  <img src={event.background_image_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                ) : (
                                  <Zap className="w-5 h-5 text-admin-light-accent dark:text-admin-dark-accent" />
                                )}
                              </div>
                            </div>
                            <span className="font-black text-xl group-hover:text-admin-light-accent dark:group-hover:text-admin-dark-accent transition-colors">{event.title}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-base text-admin-light-text dark:text-admin-dark-text">{event.date}</span>
                            <span className="text-[11px] text-gray-500 font-black uppercase tracking-widest">{event.time}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 group-hover:text-admin-light-accent dark:group-hover:text-admin-dark-accent transition-colors">
                            <MapPin className="w-5 h-5 shrink-0" />
                            <span className="text-base font-black break-words max-w-[400px]">{event.address}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                            <Button
                              onClick={() => navigate(`/event/${event.id}/edit`)}
                              className="bg-black/5 dark:bg-white/10 hover:bg-admin-light-accent dark:hover:bg-admin-dark-accent text-admin-light-text dark:text-white p-3 rounded-xl transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="bg-black/5 dark:bg-white/10 hover:bg-red-500 text-admin-light-text dark:text-white p-3 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => navigate(`/event/${event.id}`)}
                              className="bg-black/5 dark:bg-white/10 hover:bg-admin-light-accent dark:hover:bg-admin-dark-accent text-admin-light-text dark:text-white p-3 rounded-xl transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Footer Decoration */}
      <div className="mt-20 py-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">VOKO RUNCLUB • CONTROL PANEL</p>
      </div>
    </div>
  );
};

export default Admin;
