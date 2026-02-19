import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { buttonVariants } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { CalendarIcon, Sparkles, Zap, Trophy, Flame, Star, Heart, Music, FastForward, Rocket, Cloud, Moon, Sun, Ghost, Crown, Palette, Smile, Camera, Coffee, Bike, Play } from 'lucide-react';
import { format } from 'date-fns';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import arrowDown from '@/assets/arrow-down.png';
import { SEOHead } from '@/components/SEOHead';
import { EventsCarousel } from '@/components/EventsCarousel';
import { RotatingBadge } from '@/components/RotatingBadge';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  background_image_url: string;
  target_date: string;
  address: string;
}

const EventCard = ({
  event
}: {
  event: Event;
}) => {
  const navigate = useNavigate();

  const isEventUpcoming = () => {
    const now = new Date().getTime();
    const target = new Date(event.target_date).getTime();
    return target > now;
  };

  const isEventLive = () => {
    const now = new Date().getTime();
    const target = new Date(event.target_date).getTime();
    const threeHours = 1000 * 60 * 60 * 3;
    return now >= target && now <= target + threeHours;
  };

  const eventLive = isEventLive();
  const eventUpcoming = isEventUpcoming();

  return (
    <div
      className="relative cursor-pointer group mb-12 flex flex-col"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <div className="overflow-hidden mb-6 rounded-[24px] border-2 border-black/5 shadow-sm transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-2 group-hover:shadow-2xl aspect-[4/5] relative">
        <img
          src={event.background_image_url}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110"
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

        {/* Hover Badge */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100">
          <div className="bg-[var(--voko-bg)] text-[var(--voko-text)] px-6 py-2 uppercase text-[10px] font-bold tracking-[0.2em] border border-[var(--voko-text)] shadow-[4px_4px_0px_0px_var(--voko-text)]">
            View Event
          </div>
        </div>

        {/* Top Labels (Sticker Style) */}
        <div className="absolute top-5 left-5 flex flex-col gap-0 items-start">
          <div className="bg-[var(--voko-accent)] text-black border-2 border-black px-3 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2">
            <div className="text-[10px] font-black uppercase leading-none tracking-wider">
              {event.date}
            </div>
          </div>
          <div className="bg-[var(--voko-bg)] text-[var(--voko-text)] border-2 border-t-0 border-black px-3 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1 -mt-0.5">
            <div className="text-[10px] font-bold uppercase leading-none tracking-widest">
              {event.time}
            </div>
          </div>
          {eventLive && (
            <div className="bg-red-500 text-white border-2 border-t-0 border-black px-3 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1 -mt-0.5 animate-pulse">
              <div className="text-[10px] font-black uppercase leading-none tracking-widest">LIVE NOW</div>
            </div>
          )}
          {eventUpcoming && !eventLive && (
            <div className="bg-admin-light-accent dark:bg-admin-dark-accent text-white border-2 border-t-0 border-black px-3 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1 -mt-0.5">
              <div className="text-[10px] font-black uppercase leading-none tracking-widest text-white">UPCOMING</div>
            </div>
          )}
        </div>
      </div>

      <div className="px-1 transform transition-transform duration-500 group-hover:translate-x-1">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1 h-1 bg-[var(--voko-accent)] rounded-full group-hover:scale-150 transition-transform duration-500" />
          <p className="text-[10px] text-[var(--voko-text)]/40 uppercase tracking-[0.25em] font-semibold">{event.address || 'VOKO LOCATION'}</p>
        </div>
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none text-[var(--voko-text)] group-hover:text-[var(--voko-accent)] transition-colors duration-500">
          {event.title}
        </h3>
      </div>
    </div>
  );
};

const Discover = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('the world');
  const [initialDateSet, setInitialDateSet] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  useEffect(() => {
    fetchEvents();
    detectUserCountry();

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const section = Math.round(scrollY / windowHeight) + 1;
      if (section !== activeSection) {
        setActiveSection(section);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set initial date only if there are events today
  useEffect(() => {
    if (!initialDateSet && events.length > 0) {
      const today = new Date();
      const now = today.getTime();
      const oneHour = 1000 * 60 * 60;

      const hasEventsToday = events.some((event) => {
        const eventDate = new Date(event.target_date);
        const target = eventDate.getTime();
        const hasEnded = target < now - oneHour;

        if (hasEnded) return false;

        return (
          eventDate.getFullYear() === today.getFullYear() &&
          eventDate.getMonth() === today.getMonth() &&
          eventDate.getDate() === today.getDate()
        );
      });

      if (hasEventsToday) {
        setDate(today);
      }
      setInitialDateSet(true);
    }
  }, [events, initialDateSet]);

  const detectUserCountry = async () => {
    try {
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const data = await response.text();
      const locMatch = data.match(/loc=([A-Z]{2})/);

      if (locMatch && locMatch[1]) {
        const countryCode = locMatch[1];
        // Convert country code to full name
        const countryNames: { [key: string]: string } = {
          'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia',
          'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
          'BE': 'Belgium', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
          'PL': 'Poland', 'CH': 'Switzerland', 'AT': 'Austria', 'IE': 'Ireland', 'PT': 'Portugal',
          'IN': 'India', 'JP': 'Japan', 'CN': 'China', 'KR': 'South Korea', 'BR': 'Brazil',
          'MX': 'Mexico', 'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia', 'SG': 'Singapore',
          'NZ': 'New Zealand', 'ZA': 'South Africa', 'RU': 'Russia', 'TR': 'Turkey', 'GR': 'Greece'
        };
        setUserCountry(countryNames[countryCode] || countryCode);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error detecting country:', error);
      setUserCountry('the world');
    }
  };

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'), orderBy('target_date', 'asc'));
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      // Sort events: Live/Upcoming first (ascending by date), then Ended (descending by date)
      const now = new Date().getTime();
      const oneHour = 1000 * 60 * 60;

      const upcoming = eventsData
        .filter(event => new Date(event.target_date).getTime() >= now - oneHour)
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());

      const ended = eventsData
        .filter(event => new Date(event.target_date).getTime() < now - oneHour)
        .sort((a, b) => new Date(b.target_date).getTime() - new Date(a.target_date).getTime());

      setEvents([...upcoming, ...ended]);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine dynamic events for the grid
  // Filtered by date first if date is selected (includes both past and future), otherwise use the sorted events list
  const getEventsToDisplay = () => {
    if (date) {
      const selectedDate = new Date(date);
      return events.filter(event => {
        const eventDate = new Date(event.target_date);
        return (
          eventDate.getFullYear() === selectedDate.getFullYear() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getDate() === selectedDate.getDate()
        );
      });
    }
    return events;
  };

  const eventsToDisplay = getEventsToDisplay();

  const scrollToEvents = () => {
    const eventsSection = document.getElementById('events-grid-section');
    eventsSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-[var(--voko-bg)]">
      <SEOHead
        title="VOKO RunClub - Discover Events"
        description="Explore popular events near you, browse by category, or check out some of the great community calendars."
        keywords="Sexiest runclub IN THE TOWN Just register and show up"
      />
      <div className="fixed top-0 left-0 right-0 z-[2000] animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <Navbar />
      </div>

      {/* Section 1: Hero / Landing */}
      <section id="hero-section" ref={heroRef} className="h-screen w-full snap-start relative flex flex-col items-center justify-center overflow-hidden shrink-0 bg-[var(--voko-bg)]">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.1, 0.15, 0.1] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--voko-accent)] rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              opacity: [0.05, 0.1, 0.05] 
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] bg-purple-500 rounded-full blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              y: [0, -50, 0],
              opacity: [0.08, 0.12, 0.08] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] left-[20%] w-[50%] h-[30%] bg-blue-500 rounded-full blur-[130px]" 
          />
          
          {/* Animated Light Streaks */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: "-100%", y: `${20 * i}%`, opacity: 0 }}
                animate={{ x: "200%", opacity: [0, 1, 0] }}
                transition={{ 
                  duration: 8 + i, 
                  repeat: Infinity, 
                  delay: i * 2,
                  ease: "linear" 
                }}
                className="absolute h-px w-64 bg-gradient-to-r from-transparent via-[var(--voko-accent)] to-transparent"
              />
            ))}
          </div>
        </div>

        {/* Floating Decorative Elements - Background Text Only */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Animated Marquee Background Text */}
          <div className="absolute top-[10%] left-0 w-full rotate-[-5deg] opacity-[0.03] select-none whitespace-nowrap overflow-hidden">
            <motion.div 
              animate={{ x: [0, -1000] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-[12vw] font-black uppercase tracking-tighter"
            >
              RUNCLUB VIBES ONLY • YOUNG WILD FREE • RUNCLUB VIBES ONLY • YOUNG WILD FREE • 
            </motion.div>
          </div>
          <div className="absolute bottom-[10%] left-0 w-full rotate-[5deg] opacity-[0.03] select-none whitespace-nowrap overflow-hidden">
            <motion.div 
              animate={{ x: [-1000, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="text-[12vw] font-black uppercase tracking-tighter"
            >
              YOUNG • WILD • FREE • YOUNG • WILD • FREE • YOUNG • WILD • FREE • 
            </motion.div>
          </div>
        </div>

        <motion.div 
          style={{ opacity, scale, y }}
          className="absolute top-12 right-8 md:top-16 md:right-12 z-40"
        >
          <RotatingBadge
            text="BROWSE"
            onClick={scrollToEvents}
            showIcon={true}
            icon={<img src={arrowDown} alt="Arrow down" className="w-6 h-6 md:w-7 md:h-7 lg:w-12 lg:h-12" />}
            className="static"
          />
        </motion.div>

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ 
            type: "spring",
            damping: 12,
            stiffness: 100,
            duration: 1.2
          }}
          className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto text-center relative z-10 px-4"
        >
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-10 inline-flex flex-col items-center tracking-tighter">
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex items-center group cursor-default"
            >
              <span className="bg-[var(--voko-bg)] border-[3.2px] border-[var(--voko-text)] px-6 md:px-10 py-3 md:py-5 shadow-[9.6px_9.6px_0px_0px_var(--voko-text)] transition-all duration-300 group-hover:-translate-x-2 group-hover:-translate-y-2 group-hover:shadow-[16px_16px_0px_0px_var(--voko-accent)] relative overflow-hidden flex items-center justify-center min-w-[160px] md:min-w-[240px]">
                <span className="relative z-10">VOKO</span>
                <motion.div 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--voko-accent)]/10 to-transparent skew-x-12"
                />
              </span>
              <span className="bg-[var(--voko-accent)] text-black border-[3.2px] border-[var(--voko-text)] px-6 md:px-10 py-3 md:py-5 rounded-r-[25.6px] md:rounded-r-[51.2px] -ml-0.8 shadow-[9.6px_9.6px_0px_0px_var(--voko-text)] transition-all duration-300 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:shadow-[16px_16px_0px_0px_var(--voko-text)] flex items-center justify-center min-w-[192px] md:min-w-[280px]">
                RunClub
              </span>
            </motion.div>
            
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="flex items-center -mt-0.8 group cursor-default"
            >
              <span className="bg-[var(--voko-bg)] border-[3.2px] border-[var(--voko-text)] px-5 md:px-8 py-2.4 md:py-4 shadow-[9.6px_9.6px_0px_0px_var(--voko-text)] transition-all duration-300 hover:bg-[var(--voko-text)] hover:text-[var(--voko-bg)] -rotate-0.8 hover:rotate-0 hover:scale-105 z-20 flex items-center justify-center min-w-[128px] md:min-w-[192px]">YOUNG</span>
              <span className="bg-[var(--voko-bg)] border-[3.2px] border-l-0 border-[var(--voko-text)] px-5 md:px-8 py-2.4 md:py-4 shadow-[9.6px_9.6px_0px_0px_var(--voko-text)] transition-all duration-300 hover:bg-[var(--voko-text)] hover:text-[var(--voko-bg)] rotate-1.6 hover:rotate-0 hover:scale-105 z-10 flex items-center justify-center min-w-[128px] md:min-w-[192px]">WILD</span>
              <span className="bg-[var(--voko-text)] text-[var(--voko-bg)] border-[3.2px] border-l-0 border-[var(--voko-text)] px-5 md:px-8 py-2.4 md:py-4 shadow-[9.6px_9.6px_0px_0px_var(--voko-text)] transition-all duration-300 hover:bg-[var(--voko-accent)] hover:text-black -rotate-0.8 hover:rotate-0 hover:scale-105 z-0 flex items-center justify-center min-w-[128px] md:min-w-[192px]">FREE</span>
            </motion.div>
          </h1>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <p className="text-base md:text-xl lg:text-2xl text-[var(--voko-text)]/70 max-w-2xl mx-auto font-black italic uppercase tracking-tight leading-none mb-10">
              The sexiest RunClub in town. <br className="hidden md:block" />
              Explore popular events, join the community, <br className="hidden md:block" />
              and run like you've never run before.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05, rotate: -1.6 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToEvents}
              className="bg-[var(--voko-text)] text-[var(--voko-bg)] px-10 py-5 text-lg font-black uppercase tracking-[0.16em] shadow-[9.6px_9.6px_0px_0px_var(--voko-accent)] hover:shadow-[12.8px_12.8px_0px_0px_var(--voko-accent)] transition-all border-[3.2px] border-[var(--voko-text)] group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Join the Heat <Trophy className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </span>
              <motion.div 
                className="absolute inset-0 bg-[var(--voko-accent)]"
                initial={{ y: "100%" }}
                whileHover={{ y: 0 }}
                transition={{ type: "tween" }}
              />
              <span className="absolute inset-0 bg-[var(--voko-accent)] group-hover:text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                LFG!
              </span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 5 + i, 
                repeat: Infinity,
                delay: i 
              }}
              className={cn(
                "absolute text-[var(--voko-accent)] opacity-20 hidden md:block",
                i === 0 && "top-[20%] left-[10%]",
                i === i && "top-[15%] right-[15%]",
                i === 2 && "bottom-[30%] left-[15%]",
                i === 3 && "bottom-[25%] right-[20%]",
                i === 4 && "top-[40%] left-[5%]",
                i === 5 && "bottom-[40%] right-[10%]"
              )}
            >
              {i % 2 === 0 ? <Zap className="w-12 h-12" /> : <Sparkles className="w-10 h-10" />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section 2: Series Collection (Carousel) */}
      <section id="carousel-section" className="h-screen w-full snap-start relative flex flex-col items-center bg-[var(--voko-bg)] shrink-0 overflow-hidden">
        <div className="w-full h-full flex flex-col relative z-10 pt-12 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Section Header - Compact */}
          <div className="flex flex-col items-center mb-4 shrink-0">
            <div className="relative inline-block group">
              <div className="absolute -inset-4 bg-[var(--voko-accent)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black italic tracking-tighter text-[var(--voko-text)] relative flex flex-col items-center leading-[0.8] uppercase">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--voko-text)] to-[var(--voko-text)]/60">SERIES</span>
                <span className="text-[var(--voko-accent)] drop-shadow-[4px_4px_0px_var(--voko-text)] -mt-1">COLLECTION</span>
              </h2>
            </div>
          </div>
          
          {/* Carousel - Properly Scaled to fit with Header and provide Bottom Whitespace */}
          <div className="w-full flex items-start justify-center overflow-visible mt-2">
            <div className="w-full flex items-start justify-center overflow-visible transform scale-75 md:scale-80 lg:scale-[0.85] origin-top">
              <EventsCarousel
                events={events.map(e => ({
                  id: e.id,
                  title: e.title,
                  subtitle: e.address || '',
                  date: e.date,
                  time: e.time,
                  image: e.background_image_url
                })).slice(0, 10)}
              />
            </div>
          </div>

          {/* Large Spacer for Bottom White Space */}
          <div className="flex-[3] min-h-[300px]"></div>
        </div>
      </section>

      {/* Section 3: Events Explorer (Grid + Calendar) */}
      <section id="events-grid-section" className="min-h-screen w-full snap-start relative flex flex-col bg-[var(--voko-bg)] py-20 px-4 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col gap-12">
          {/* Funky Section Header */}
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-[var(--voko-text)]/10 pb-8">
            <div className="relative">
              <span className="absolute -top-8 left-0 text-[var(--voko-accent)] font-black text-xs tracking-[0.4em] uppercase">Phase 02</span>
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-[var(--voko-text)] leading-none uppercase">
                Events <span className="text-outline-voko opacity-30">Explorer</span>
              </h2>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3 bg-[var(--voko-text)]/5 px-4 py-2 rounded-full border border-[var(--voko-text)]/10">
                <div className="w-2 h-2 rounded-full bg-[var(--voko-accent)] animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--voko-text)]/60">LIVE RADAR ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-32 order-2 lg:order-1 self-start">
              <div className="p-4 rounded-[32px] bg-[var(--voko-text)]/[0.03] border-2 border-[var(--voko-text)]/5 backdrop-blur-xl shadow-2xl flex flex-col items-center">
                <div className="flex items-center gap-3 mb-4 self-start px-4">
                  <CalendarIcon className="w-4 h-4 text-[var(--voko-accent)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--voko-text)]/60">Time Machine</span>
                </div>
                <Calendar 
                  mode="single" 
                  selected={date} 
                  onSelect={(newDate) => {
                    if (newDate) setDate(newDate);
                  }} 
                  className="bg-transparent border-0 p-0"
                  classNames={{
                    months: "w-full",
                    month: "w-full space-y-4",
                    table: "w-full border-collapse",
                    head_row: "flex w-full justify-between",
                    head_cell: "text-[var(--voko-text)]/40 w-9 font-bold text-[10px] uppercase",
                    row: "flex w-full mt-2 justify-between",
                    cell: "relative h-9 w-9 text-center p-0 focus-within:relative focus-within:z-20",
                    day: cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-9 w-9 p-0 font-bold aria-selected:opacity-100 rounded-none hover:bg-[var(--voko-accent)] hover:text-black transition-colors"
                    ),
                    day_selected: "bg-[var(--voko-text)] !text-[var(--voko-bg)] hover:bg-[var(--voko-text)] hover:!text-[var(--voko-bg)]",
                    day_today: "border-2 border-[var(--voko-accent)]",
                  }}
                />
              </div>
            </div>

            <div className="space-y-12 order-1 lg:order-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-[var(--voko-text)]/10 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-10 bg-[var(--voko-accent)] rounded-full"></div>
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[var(--voko-text)] italic">Recent Heat</h3>
                </div>
                <div className="flex items-center gap-2 bg-[var(--voko-text)] text-[var(--voko-bg)] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {eventsToDisplay.length} Signals Found
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {loading ? (
                  <div className="col-span-full text-center py-32 border-4 border-dashed border-[var(--voko-text)]/5 rounded-[48px]">
                    <div className="w-16 h-16 border-4 border-[var(--voko-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-[var(--voko-text)]/40 font-black uppercase tracking-[0.3em] animate-pulse">Scanning for signals...</p>
                  </div>
                ) : eventsToDisplay.length === 0 ? (
                  <div className="col-span-full text-center py-32 border-4 border-dashed border-[var(--voko-text)]/5 rounded-[48px]">
                    <p className="text-[var(--voko-text)]/40 font-black uppercase tracking-[0.3em]">
                      {date ? `No signals detected for ${format(date, "MMM do")}` : 'No signals detected'}
                    </p>
                  </div>
                ) : (
                  eventsToDisplay.map((event, index) => (
                    <div key={event.id} className="animate-in fade-in slide-in-from-bottom duration-1000 fill-mode-both" style={{ animationDelay: `${index * 150}ms` }}>
                      <EventCard event={event} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Discover;