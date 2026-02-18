import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, getDoc } from 'firebase/firestore';
import { Trash2, Plus, Calendar, Zap, ArrowRight, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  background_image_url: string;
}

const EventCard = ({
  event,
  isCreated,
  onDelete
}: {
  event: Event;
  isCreated?: boolean;
  onDelete?: (id: string) => void;
}) => {
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Vaporize this event?')) {
      onDelete?.(event.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -10 }}
      className="relative cursor-pointer group bg-black/5 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-black/5 dark:border-white/10 transition-all duration-500"
      onClick={() => navigate(isCreated ? `/event/${event.id}/edit` : `/event/${event.id}`)}
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
          style={{ backgroundImage: `url(${event.background_image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className="bg-admin-light-bg/90 dark:bg-admin-dark-bg/90 backdrop-blur-md border border-admin-light-accent dark:border-admin-dark-accent px-3 py-1 rounded-full shadow-lg">
          <div className="text-[10px] font-black uppercase tracking-widest text-admin-light-accent dark:text-admin-dark-accent">{event.date}</div>
        </div>
      </div>

      {isCreated && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 p-3 rounded-full bg-red-500 text-white shadow-xl opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3 text-admin-light-accent dark:text-admin-dark-accent" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{event.time}</span>
        </div>
        <h3 className="text-xl font-black italic tracking-tighter truncate group-hover:text-admin-light-accent dark:group-hover:text-admin-dark-accent transition-colors">{event.title}</h3>
      </div>
    </motion.div>
  );
};

const MyEvents = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'created' | 'registered'>('registered');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
      if (role === 'admin') {
        setActiveTab('created');
      } else {
        setActiveTab('registered');
      }
    }
  }, [user, role]);

  const fetchMyEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const qCreated = query(
        collection(db, 'events'),
        where('created_by', '==', user.uid),
        orderBy('target_date', 'asc')
      );
      const createdSnap = await getDocs(qCreated);
      const createdData = createdSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setCreatedEvents(createdData);

      const qReg = query(
        collection(db, 'event_registrations'),
        where('user_id', '==', user.uid)
      );
      const regSnap = await getDocs(qReg);
      const eventIds = regSnap.docs.map(doc => doc.data().event_id);

      if (eventIds.length > 0) {
        const registeredData: Event[] = [];
        for (const id of eventIds) {
          const eventDoc = await getDoc(doc(db, 'events', id));
          if (eventDoc.exists()) {
            registeredData.push({ id: eventDoc.id, ...eventDoc.data() } as Event);
          }
        }
        setRegisteredEvents(registeredData);
      } else {
        setRegisteredEvents([]);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      toast.success('Event Vaporized');
      fetchMyEvents();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting event:', error);
      toast.error('Failed to delete');
    }
  };

  const displayedEvents = activeTab === 'created' ? createdEvents : registeredEvents;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-admin-light-bg dark:bg-admin-dark-bg flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-admin-light-accent dark:border-admin-dark-accent border-t-transparent rounded-full shadow-2xl"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-light-bg dark:bg-admin-dark-bg text-admin-light-text dark:text-admin-dark-text transition-colors duration-500 font-sans">
      <SEOHead
        title="MY GRID | Voko"
        description="Your personal event hub"
      />
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-admin-light-accent dark:text-admin-dark-accent fill-current" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-admin-light-accent dark:text-admin-dark-accent">Personal Hub</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter">
              MY <span className="text-admin-light-accent dark:text-admin-dark-accent">GRID</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {role === 'admin' && (
              <Button
                onClick={() => navigate('/create-event')}
                className="bg-admin-light-accent dark:bg-admin-dark-accent text-white rounded-2xl h-14 px-8 font-black uppercase italic tracking-tighter hover:scale-105 transition-transform"
              >
                <Plus className="mr-2 w-5 h-5" /> Drop Vibe
              </Button>
            )}
          </div>
        </header>

        {/* Custom Tabs */}
        <div className="flex p-2 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/10 mb-12 w-fit">
          {role === 'admin' && (
            <button
              onClick={() => setActiveTab('created')}
              className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'created' 
                  ? 'bg-admin-light-accent dark:bg-admin-dark-accent text-white shadow-xl scale-105' 
                  : 'text-gray-500 hover:text-admin-light-accent dark:hover:text-admin-dark-accent'
              }`}
            >
              Created ({createdEvents.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('registered')}
            className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'registered' 
                ? 'bg-admin-light-accent dark:bg-admin-dark-accent text-white shadow-xl scale-105' 
                : 'text-gray-500 hover:text-admin-light-accent dark:hover:text-admin-dark-accent'
            }`}
          >
            Joined ({registeredEvents.length})
          </button>
        </div>

        {/* Events Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="aspect-[4/3] rounded-[2rem] bg-black/5 dark:bg-white/5 animate-pulse border border-black/5 dark:border-white/10" />
              ))
            ) : displayedEvents.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-black/5 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-black/10 dark:border-white/10">
                <p className="text-2xl font-black italic text-gray-400 uppercase tracking-tighter">The grid is empty.</p>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="link" 
                  className="mt-4 text-admin-light-accent dark:text-admin-dark-accent font-bold uppercase tracking-widest"
                >
                  Explore Vibez <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ) : (
              displayedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isCreated={activeTab === 'created'}
                  onDelete={activeTab === 'created' ? handleDeleteEvent : undefined}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyEvents;
