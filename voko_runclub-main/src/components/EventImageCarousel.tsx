import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

interface EventImageCarouselProps {
    images: string[];
}

export const EventImageCarousel: React.FC<EventImageCarouselProps> = ({ images }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: 'center',
        skipSnaps: false,
        duration: 30
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);

        // Smooth scrolling logic for the blur effect
        const onScroll = () => {
            const scrollProgress = emblaApi.scrollProgress();
            // We could use progress to drive individual slide blurs for even smoother transitions
        };
        emblaApi.on('scroll', onScroll);

        return () => {
            emblaApi.off('select', onSelect);
            emblaApi.off('reInit', onSelect);
            emblaApi.off('scroll', onScroll);
        };
    }, [emblaApi, onSelect]);

    return (
        <div className="relative w-full overflow-hidden py-10">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y -ml-4">
                    {images.map((img, index) => {
                        const isCenter = index === selectedIndex;
                        return (
                            <div
                                key={index}
                                className="flex-[0_0_80%] min-w-0 pl-4 relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                                style={{
                                    transform: isCenter ? 'scale(1)' : 'scale(0.9)',
                                    filter: isCenter ? 'blur(0px) brightness(1)' : 'blur(8px) brightness(0.6)',
                                    opacity: isCenter ? 1 : 0.6,
                                }}
                            >
                                <div className="relative aspect-[16/10] w-full overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.3)]">
                                    <img
                                        src={img}
                                        alt={`Event gallery ${index}`}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    {/* Glass overlay for non-centered images */}
                                    {!isCenter && (
                                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity duration-700" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Indicators */}
            <div className="flex justify-center gap-3 mt-10">
                {scrollSnaps.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={`h-1 transition-all duration-500 rounded-full ${index === selectedIndex ? 'w-12 bg-[#BAFF00]' : 'w-4 bg-black/10'
                            }`}
                    />
                ))}
            </div>

            {/* Gradient Fog for depth */}
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        </div>
    );
};
