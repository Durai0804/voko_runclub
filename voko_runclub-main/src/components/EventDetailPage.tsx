import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Navbar } from './Navbar';
import { EventCountdown } from './EventCountdown';
import { EventMeta } from './EventMeta';
import { EventHeader } from './EventHeader';
import { EventDescription } from './EventDescription';
import { EventLocation } from './EventLocation';
import { EventRegistration } from './EventRegistration';
import { AuthSheet } from './AuthSheet';
import { SEOHead } from './SEOHead';
import { useAuth } from '@/hooks/useAuth';
import CircularGallery from './CircularGallery';
import { Share2, MapPin, Calendar as CalendarIcon, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

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
  luma_link?: string;
  status?: string;
  secondary_images?: string[];
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (user && event) {
      checkRegistration();
    }
  }, [user, event]);

  const fetchEvent = async () => {
    try {
      if (id) {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Event;
          setEvent({ id: docSnap.id, ...data } as Event);
        } else {
          setNotFound(true);
        }
      } else {
        const q = query(collection(db, 'events'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setEvent({ id: doc.id, ...doc.data() } as Event);
        } else {
          setNotFound(true);
        }
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!id || !user) return;
    try {
      const q = query(
        collection(db, 'event_registrations'),
        where('user_id', '==', user.uid),
        where('event_id', '==', id),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      setIsRegistered(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleGetDirections = () => {
    window.open('https://maps.google.com', '_blank');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-[#BAFF00] text-4xl font-black italic tracking-tighter animate-pulse">VOKO</div>
          <div className="w-16 h-1 bg-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#BAFF00] animate-progress-loop"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#050505] px-4 text-center">
        <Navbar />
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-6">Event Not Found</h1>
        <button
          onClick={() => navigate('/discover')}
          className="px-10 py-5 bg-white text-black font-black uppercase italic tracking-widest text-xs rounded-full hover:bg-[#BAFF00] transition-colors"
        >
          Explore All Events
        </button>
      </div>
    );
  }

  const allImages = [event.background_image_url, ...(event.secondary_images || [])];

  const handleBroadcast = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to broadcast');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  return (
    <>
      <SEOHead
        title={event.title}
        description={event.description.substring(0, 160)}
        image={event.background_image_url}
      />
      <div>
        <Navbar />

        <main className="min-h-screen bg-[var(--voko-bg)] pt-32 pb-40 overflow-hidden selection:bg-[var(--voko-accent)] selection:text-black text-[var(--voko-text)] relative">
          {/* Granular Film Noir Overlay - High Frequency Noise */}
          <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

          {/* Dynamic "Aurora Breath" Animated Background */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Primary Accent Glow - Slowly Drifting */}
            <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[var(--voko-accent)]/10 rounded-full blur-[150px] animate-aurora-1"></div>

            {/* Secondary Neutral Glow - Opposite Drift */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-white/5 rounded-full blur-[150px] animate-aurora-2"></div>

            {/* Subtle Horizontal Scanline - Tactical Feel */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[var(--voko-text)]/5 shadow-[0_0_10px_rgba(255,255,255,0.1)] animate-scanline"></div>
          </div>

          <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">

            {/* Header: Pure Brutalist Impact */}
            <div className="flex flex-col gap-6 mb-16">
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left duration-700">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--voko-text)] text-[var(--voko-bg)] rounded-full shadow-2xl">
                  <Sparkles size={12} className="fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">EXPERIENCE VOKO</span>
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--voko-text)]/20 to-transparent"></div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <h1 className="text-[50px] md:text-[80px] lg:text-[120px] font-black tracking-[-0.07em] text-[var(--voko-text)] leading-[0.75] uppercase italic animate-in fade-in slide-in-from-bottom duration-1000">
                  {event.title}
                </h1>

                <div className="flex flex-col items-start lg:items-end gap-4 min-w-[220px] animate-in fade-in zoom-in duration-1000 [animation-delay:400ms]">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--voko-text)]/40">CREATIVE DIRECTOR</p>
                  <div className="flex items-center gap-3 p-2 pr-6 bg-[var(--voko-text)]/5 rounded-[16px] border border-[var(--voko-text)]/10 backdrop-blur-3xl shadow-2xl">
                    <div className="w-12 h-12 rounded-[12px] bg-[var(--voko-accent)] flex items-center justify-center text-black font-black italic uppercase text-base shadow-xl shadow-[var(--voko-accent)]/20">
                      {event.creator.substring(0, 2)}
                    </div>
                    <span className="text-xl font-black text-[var(--voko-text)] italic uppercase tracking-tighter">{event.creator}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery: The Orbit Hub */}
            <section className="mb-24 animate-in fade-in slide-in-from-bottom duration-1000 [animation-delay:600ms]">
              <div className="relative w-full h-[550px] bg-black/5 backdrop-blur-sm rounded-[60px] overflow-hidden group border border-[var(--voko-text)]/10 shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--voko-accent)]/20 via-transparent to-transparent"></div>
                </div>

                <CircularGallery
                  items={allImages.map(img => ({ image: img, text: '' }))}
                  bend={0.7}
                  borderRadius={0.03}
                  scrollSpeed={1.0}
                  scrollEase={0.05}
                  textColor="var(--voko-accent)"
                />

                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.6em] text-[var(--voko-accent)]">ORBIT CONTROL</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.6em] text-[var(--voko-text)]/20">LIVE</span>
                    </div>
                    <div className="w-48 h-[1px] bg-[var(--voko-text)]/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[var(--voko-accent)] animate-progress-loop"></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--voko-text)]/40 italic">SERIES COLLECTION</span>
                    <span className="text-3xl font-black text-[var(--voko-accent)] italic">0{event.id.charCodeAt(0) % 9}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Info Section: Neatly Organized & Perfectly Visible */}
            <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-start relative">

              {/* Left Column: The Narrative & Precise Logistics */}
              <div className="lg:col-span-7 flex flex-col gap-20">

                {/* Manifesto Section */}
                <div className="relative animate-in fade-in slide-in-from-left duration-1000 [animation-delay:800ms]">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-16 h-[3px] bg-[var(--voko-accent)]"></div>
                    <h2 className="text-[16px] font-black uppercase tracking-[0.8em] text-[var(--voko-text)] leading-none">THE MANIFESTO</h2>
                  </div>

                  <div className="relative group">
                    <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-[var(--voko-text)]/10 group-hover:bg-[var(--voko-accent)] transition-colors duration-700"></div>
                    <div className="text-lg md:text-xl lg:text-[22px] font-medium leading-[1.6] tracking-tight text-[var(--voko-text)]/80 italic transition-all duration-700 group-hover:pl-3 max-w-[90%]">
                      <EventDescription description={event.description} />
                    </div>
                  </div>
                </div>

                {/* Logistics Module: Temporal & Sector */}
                <div className="grid md:grid-cols-2 gap-12 pt-20 border-t border-[var(--voko-text)]/20 relative">
                  {/* Decorative corner */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[var(--voko-accent)]"></div>

                  {/* Temporal Block */}
                  <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom duration-700 [animation-delay:1000ms]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[var(--voko-accent)] rounded-sm transform rotate-45"></div>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-[var(--voko-text)]">TEMPORAL</h3>
                    </div>

                    <div className="flex flex-col gap-8">
                      <div className="group">
                        <p className="text-[10px] font-black text-[var(--voko-text)]/20 uppercase tracking-[0.3em] mb-3">TARGET DATE</p>
                        <p className="text-4xl lg:text-5xl font-black text-[var(--voko-text)] uppercase italic tracking-tighter group-hover:text-[var(--voko-accent)] transition-all duration-500">
                          {event.date.split(',')[0]}
                        </p>
                        <p className="text-xl font-black text-[var(--voko-text)]/40 uppercase italic mt-1">{event.date.split(',')[1]}</p>
                      </div>

                      <div className="group">
                        <p className="text-[10px] font-black text-[var(--voko-text)]/20 uppercase tracking-[0.3em] mb-3">PEAK HOURS</p>
                        <div className="flex items-baseline gap-3">
                          <Clock size={18} className="text-[var(--voko-accent)]" />
                          <p className="text-4xl font-black text-[var(--voko-text)] uppercase italic tracking-tighter group-hover:text-[var(--voko-accent)] transition-all duration-500">{event.time}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sector Block */}
                  <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom duration-700 [animation-delay:1200ms]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-[2px] bg-[var(--voko-text)]"></div>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-[var(--voko-text)]">SECTOR</h3>
                    </div>

                    <div className="flex flex-col gap-8">
                      <div className="group">
                        <p className="text-[10px] font-black text-[var(--voko-text)]/20 uppercase tracking-[0.3em] mb-3">DROP-OFF POINT</p>
                        <p className="text-3xl font-black text-[var(--voko-text)] uppercase italic tracking-tighter mb-4">{event.address.split(',')[0]}</p>
                        <div className="bg-[var(--voko-text)]/5 p-4 rounded-[24px] border border-[var(--voko-text)]/10 group-hover:border-[var(--voko-accent)]/30 transition-all duration-500">
                          <EventLocation address={event.address} onGetDirections={handleGetDirections} />
                        </div>
                      </div>

                      <button
                        onClick={handleGetDirections}
                        className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[var(--voko-accent)]"
                      >
                        VIEW SECTOR MAP <ArrowRight size={14} className="group-hover:translate-x-3 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Impact Registration Interface */}
              <div className="lg:col-span-5 lg:sticky lg:top-32 animate-in fade-in slide-in-from-right duration-1000 [animation-delay:1400ms]">
                <div className="relative p-10 rounded-[48px] bg-[var(--voko-bg)] border border-[var(--voko-text)]/10 shadow-[0_60px_120px_rgba(0,0,0,0.1)] overflow-hidden">
                  {/* Neon Glow Header */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--voko-accent)] via-[var(--voko-text)] to-transparent"></div>

                  <div className="relative z-10 flex flex-col gap-12">
                    <div className="flex flex-col gap-8">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.25em] text-[var(--voko-accent)] italic underline decoration-[var(--voko-text)]/10 decoration-2 underline-offset-6">SECURITY PROTOCOL</h3>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--voko-accent)]/10 border border-[var(--voko-accent)]/30 rounded-full">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--voko-accent)] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--voko-accent)]"></span>
                          </span>
                          {new Date() > new Date(event.target_date) ? (
                            new Date().getTime() - new Date(event.target_date).getTime() < 3 * 60 * 60 * 1000 ? (
                              <span className="text-[10px] font-black uppercase text-[var(--voko-accent)] tracking-widest">ONGOING</span>
                            ) : (
                              <span className="text-[10px] font-black uppercase text-[var(--voko-accent)] tracking-widest">ENDED</span>
                            )
                          ) : (
                            <span className="text-[10px] font-black uppercase text-[var(--voko-accent)] tracking-widest">UPCOMING</span>
                          )}
                        </div>
                      </div>

                      {/* Sub-components updated via CSS invert for dark mode consistency */}
                      <div className="py-5 border-y border-[var(--voko-text)]/5 bg-[var(--voko-text)]/[0.02] rounded-2xl flex justify-center">
                        <EventCountdown targetDate={new Date(event.target_date)} />
                      </div>
                    </div>

                    <div className="dark-registration">
                      {event.luma_link ? (
                        <div className="flex flex-col gap-4">
                          <a 
                            href={event.luma_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-6 bg-[var(--voko-accent)] text-black font-black uppercase italic tracking-[0.2em] text-center rounded-[20px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[var(--voko-accent)]/20"
                          >
                            REGISTER ON LUMA
                          </a>
                          <p className="text-[10px] font-black text-center opacity-40 tracking-widest uppercase">External Protocol Required</p>
                        </div>
                      ) : (
                        <EventRegistration
                          eventId={event.id}
                          onRegister={checkRegistration}
                          isRegistered={isRegistered}
                          onAuthRequired={() => setIsAuthOpen(true)}
                          targetDate={new Date(event.target_date)}
                        />
                      )}
                    </div>

                    <div className="relative p-6 rounded-2xl bg-[var(--voko-text)]/5 border border-[var(--voko-text)]/10 group hover:border-[var(--voko-accent)] transition-colors duration-700">
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--voko-bg)] border border-[var(--voko-text)]/10 rounded-full flex items-center justify-center text-[var(--voko-accent)] text-[9px] font-black italic">!</div>
                      <p className="text-[10px] font-bold text-[var(--voko-text)]/40 leading-relaxed uppercase tracking-widest group-hover:text-[var(--voko-text)] transition-colors">
                        *ENCRYPTED ENTRANCE PASS REQUIRED. ACCESS SUBJECT TO CAPACITY LIMITS. NO LATE ENTRY.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aesthetic Social Broadcast */}
                <div className="mt-12 flex justify-between items-center px-8">
                  <button 
                    onClick={handleBroadcast}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-[20px] border border-[var(--voko-text)]/10 bg-[var(--voko-text)]/5 flex items-center justify-center text-[var(--voko-text)] group-hover:bg-[var(--voko-accent)] group-hover:text-black transition-all transform group-hover:rotate-[360deg] duration-1000 shadow-2xl backdrop-blur-3xl">
                      <Share2 size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[var(--voko-text)]">BROADCAST</span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--voko-text)]/60">DISTRIBUTE INFO</span>
                    </div>
                  </button>

                  <div className="flex flex-col items-end opacity-80">
                    <div className="w-12 h-[2px] bg-[var(--voko-accent)] mb-2"></div>
                    <p className="text-[10px] font-black text-[var(--voko-text)]/60 uppercase tracking-[0.8em]">VOKO SERIES</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <style>{`
        @keyframes width-spring {
            0% { width: 0; }
            100% { width: 4rem; }
        }
        .animate-width-spring {
            animation: width-spring 1s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
         @keyframes progress-loop {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-progress-loop {
            animation: progress-loop 3s ease-in-out infinite;
        }

        @keyframes aurora-1 {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(10%, 10%) scale(1.1); }
            100% { transform: translate(0, 0) scale(1); }
        }
        .animate-aurora-1 {
            animation: aurora-1 20s ease-in-out infinite;
        }

        @keyframes aurora-2 {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-10%, -10%) scale(1.1); }
            100% { transform: translate(0, 0) scale(1); }
        }
        .animate-aurora-2 {
            animation: aurora-2 25s ease-in-out infinite;
        }

        @keyframes scanline {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(100vh); opacity: 0; }
        }
        .animate-scanline {
            animation: scanline 8s linear infinite;
        }
        
        main h1, main h2, main h3 {
            color: var(--voko-text) !important;
            text-rendering: optimizeLegibility;
        }

        /* Responsive Title scaling */
        @media (max-width: 1024px) {
            main h1 { font-size: 60px !important; }
        }
        @media (max-width: 640px) {
            main h1 { font-size: 40px !important; }
        }
      `}</style>
    </>
  );
};