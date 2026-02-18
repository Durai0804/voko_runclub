import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';



type StaticEvent = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  image: string;
};

export const STATIC_EVENTS: StaticEvent[] = [];

interface CarouselEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  image: string;
}

interface EventsCarouselProps {
  events?: CarouselEvent[];
}

export const EventsCarousel: React.FC<EventsCarouselProps> = ({ events }) => {
  const displayEvents = events || [];
  const navigate = useNavigate();

  const [animationKey, setAnimationKey] = React.useState(0);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  if (displayEvents.length === 0) return null;

  const LOOPED_EVENTS = [...displayEvents, ...displayEvents];

  const smoothlyRestartScroll = () => {
    const track = trackRef.current;
    if (!track) return;

    const computedStyle = window.getComputedStyle(track);
    const matrix = computedStyle.transform === 'none'
      ? new DOMMatrix()
      : new DOMMatrix(computedStyle.transform);
    const currentTranslateX = matrix.m41;

    track.style.animationPlayState = 'paused';
    track.style.animation = 'none';
    track.style.transform = `translateX(${currentTranslateX}px)`;
    track.offsetHeight;

    requestAnimationFrame(() => {
      track.style.transition = 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)';
      track.style.transform = 'translateX(0px)';
    });

    const handleTransitionEnd = () => {
      track.style.transition = '';
      track.style.transform = '';
      track.style.animation = '';
      track.style.animationPlayState = '';
      track.removeEventListener('transitionend', handleTransitionEnd);
      setAnimationKey((key) => key + 1);
    };

    track.addEventListener('transitionend', handleTransitionEnd);
  };

  return (
    <section className="w-full bg-[var(--voko-bg)] py-12 pb-20 md:pb-24">
      <div
        className="w-full mx-auto px-3 sm:px-6 md:px-8 lg:px-10"
        style={{ maxWidth: 'min(1700px, calc(100vw - 32px))' }}
      >
        <div className="relative overflow-hidden">
          <div
            key={animationKey}
            ref={trackRef}
            className="flex gap-px w-max will-change-[transform] animate-[scroll-left_20s_linear_infinite]"
          >
            {LOOPED_EVENTS.map((event, idx) => (
              <div
                key={`${event.id}-${idx}-${animationKey}`}
                className="relative flex-shrink-0 w-[80vw] sm:w-[55vw] md:w-[40vw] lg:w-[32vw] xl:w-[28vw] aspect-[4/5] max-h-[85vh] overflow-hidden rounded-[32px] border border-black/5 bg-black/5 shadow-sm transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:shadow-2xl group cursor-pointer"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110"
                  loading="lazy"
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Hover Badge */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100 translate-y-4 group-hover:translate-y-0 transition-transform">
                  <div className="bg-[var(--voko-bg)] text-[var(--voko-text)] px-6 py-2 uppercase text-[10px] font-bold tracking-[0.2em] border border-[var(--voko-text)] shadow-[4px_4px_0px_0px_var(--voko-text)]">
                    View Details
                  </div>
                </div>

                {/* Top Labels (Sticker Style) */}
                <div className="absolute top-6 left-6 flex flex-col gap-0 items-start">
                  <div className="bg-[var(--voko-accent)] text-black border-2 border-black px-4 py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                    <div className="text-[12px] font-black uppercase leading-none tracking-wider">
                      {event.date}
                    </div>
                  </div>
                  <div className="bg-[var(--voko-bg)] text-[var(--voko-text)] border-2 border-t-0 border-black px-4 py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1 -mt-0.5">
                    <div className="text-[11px] font-bold uppercase leading-none tracking-widest">
                      {event.time}
                    </div>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tight leading-tight uppercase group-hover:text-[var(--voko-accent)] transition-colors duration-500">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 opacity-80">
                    <div className="w-1.5 h-1.5 bg-[var(--voko-accent)] rounded-full animate-pulse" />
                    <p className="text-sm md:text-base font-medium uppercase tracking-widest truncate">
                      {event.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            aria-label="Restart scroll from beginning"
            onClick={smoothlyRestartScroll}
            className="flex md:flex absolute left-2 sm:left-3 md:left-4 lg:left-6 xl:left-8 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/95 border border-black/10 shadow-lg items-center justify-center hover:bg-white transition z-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Restart scroll from beginning"
            onClick={smoothlyRestartScroll}
            className="flex md:flex absolute right-2 sm:right-3 md:right-4 lg:right-6 xl:right-8 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/95 border border-black/10 shadow-lg items-center justify-center hover:bg-white transition z-10"
            style={{ opacity: 0.85 }}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
