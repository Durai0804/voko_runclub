import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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
    const eventsSection = document.getElementById('events-section');
    eventsSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
    <SEOHead
      title="VOKO RunClub - Discover Events"
      description="Explore popular events near you, browse by category, or check out some of the great community calendars."
      keywords="Sexiest runclub IN THE TOWN Just register and show up"
    />
    <div className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
      <Navbar />
    </div>

    {/* Section 1: Hero / Icons */}
    <section className="h-screen snap-start relative flex flex-col items-center justify-center overflow-hidden bg-[var(--voko-bg)]">
      {/* Decorative rotating badge - fixed within section */}
      <div className="absolute top-32 right-8 md:top-40 md:right-12 z-40">
        <RotatingBadge
          text="BROWSE"
          onClick={scrollToEvents}
          showIcon={true}
          icon={<img src={arrowDown} alt="Arrow down" className="w-6 h-6 md:w-7 md:h-7 lg:w-12 lg:h-12" />}
          className="static"
        />
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[var(--voko-accent)]/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-[var(--voko-accent)]/10 rounded-full blur-[100px] -z-10 animate-pulse [animation-delay:1s]" />

      <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-8 md:mb-12 inline-flex flex-col items-center tracking-tighter animate-in fade-in slide-in-from-bottom duration-1000">
          <div className="flex items-center group cursor-default">
            <span className="bg-[var(--voko-bg)] border-2 border-[var(--voko-text)] px-4 md:px-8 py-3 md:py-6 shadow-[8px_8px_0px_0px_var(--voko-text)] transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1">VOKO</span>
            <span className="bg-[var(--voko-accent)] text-black border-2 border-[var(--voko-text)] px-4 md:px-8 py-3 md:py-6 rounded-[24px] md:rounded-[48px] -ml-2 shadow-[8px_8px_0px_0px_var(--voko-text)] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 rotate-1 group-hover:rotate-2">RunClub</span>
          </div>
          <div className="flex items-center -mt-px group cursor-default">
            <span className="bg-[var(--voko-bg)] border-2 border-[var(--voko-text)] px-4 md:px-8 py-3 md:py-6 shadow-[8px_8px_0px_0px_var(--voko-text)] transition-all duration-300 hover:bg-[var(--voko-text)] hover:text-[var(--voko-bg)] -rotate-1 hover:rotate-0">YOUNG</span>
            <span className="bg-[var(--voko-bg)] border-2 border-l-0 border-[var(--voko-text)] px-4 md:px-8 py-3 md:py-6 shadow-[8px_8px_0px_0px_var(--voko-text)] transition-all duration-300 hover:bg-[var(--voko-text)] hover:text-[var(--voko-bg)] rotate-2 hover:rotate-0">WILD</span>
            <span className="bg-[var(--voko-text)] text-[var(--voko-bg)] border-2 border-l-0 border-[var(--voko-text)] px-4 md:px-8 py-3 md:py-6 shadow-[8px_8px_0px_0px_var(--voko-text)] transition-all duration-300 hover:bg-[var(--voko-accent)] hover:text-black -rotate-1 hover:rotate-0">FREE</span>
          </div>
        </h1>
        <p className="text-sm md:text-base lg:text-xl text-[var(--voko-text)]/60 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 [animation-delay:400ms]">
          The sexiest RunClub in town. <br className="hidden md:block" />
          Explore popular events, join the community, and run like you've never run before.
        </p>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[var(--voko-text)] to-transparent"></div>
        </div>
      </div>
    </section>

    {/* Section 2: Event Carousel */}
    <section className="h-screen snap-start flex flex-col items-center justify-center bg-[var(--voko-bg)] relative overflow-hidden">
      <div className="absolute top-20 left-12 opacity-5 pointer-events-none">
        <h2 className="text-[15vw] font-black italic uppercase leading-none tracking-tighter">GALLERY</h2>
      </div>
      
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10 flex flex-col gap-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-[2px] bg-[var(--voko-accent)]"></div>
          <h2 className="text-[14px] font-black uppercase tracking-[0.8em]">SERIES COLLECTION</h2>
        </div>
        
        <div className="transform scale-90 md:scale-100 lg:scale-110">
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
    </section>

    {/* Section 3: All Events Grid */}
    <section id="events-section" className="min-h-screen snap-start pt-32 pb-40 px-4 md:px-8 bg-[var(--voko-bg)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-0 mb-12 animate-in fade-in duration-700">
          <h2 className="text-base md:text-lg lg:text-xl font-normal w-full sm:w-auto mb-2 sm:mb-0">Browsing events in</h2>
          <span className="text-base md:text-lg lg:text-xl font-normal border border-[var(--voko-text)] px-2 py-1 sm:ml-2">{userCountry}</span>

          <div className="lg:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn("text-base md:text-lg lg:text-xl font-normal border border-l-0 border-[var(--voko-text)] px-2 py-1 flex items-center bg-[var(--voko-bg)] hover:bg-[var(--voko-text)]/5 transition-colors", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "MMM do, yyyy") : <span>Pick a date</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          <div className="hidden lg:block lg:sticky lg:top-32 self-start">
            <Calendar mode="single" selected={date} onSelect={setDate} className="mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center py-12">Loading events...</div>
            ) : eventsToDisplay.length === 0 ? (
              <div className="col-span-full text-center py-12">
                {date ? `No events found for ${format(date, "MMM do, yyyy")}` : 'No events found'}
              </div>
            ) : (
              eventsToDisplay.map((event, index) => (
                <div key={event.id} className="animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                  <EventCard event={event} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  </div>;
};

export default Discover;