import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { heroSlides } from '../content';

const COUNT = heroSlides.length;
/** How long each photograph stays before the next crossfade. */
const DWELL_MS = 6000;

export function HeroSlideshow() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState<number[]>([0]);
  const active = index;

  const mount = (slideIndex: number) => {
    setMounted((current) => (current.includes(slideIndex) ? current : [...current, slideIndex]));
  };

  const show = (slideIndex: number) => {
    mount(slideIndex);
    setIndex(slideIndex);
  };

  useEffect(() => {
    if (reduce) return;
    let prefetchTimer = 0;
    let advanceTimer = 0;
    const arm = () => {
      const next = (index + 1) % COUNT;
      prefetchTimer = window.setTimeout(() => mount(next), DWELL_MS - 1200);
      advanceTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % COUNT);
      }, DWELL_MS);
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
    return () => {
      window.removeEventListener('load', arm);
      window.clearTimeout(prefetchTimer);
      window.clearTimeout(advanceTimer);
    };
  }, [index, reduce]);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#e7eef6] lg:max-h-[min(640px,calc(100svh-9rem))]">
      {heroSlides.map((slide, slideIndex) => {
        if (!mounted.includes(slideIndex) && slideIndex !== active) return null;
        const isActive = slideIndex === active;
        const first = slideIndex === 0;
        return (
          <img
            key={slide.id}
            src={slide.src}
            srcSet={slide.srcSet}
            sizes="100vw"
            alt={isActive ? slide.alt : ''}
            width={slide.width}
            height={slide.height}
            decoding="async"
            fetchPriority={first ? 'high' : 'low'}
            aria-hidden={isActive ? undefined : true}
            style={{ objectPosition: slide.objectPosition }}
            className={`absolute inset-0 h-full w-full object-cover ${
              reduce ? '' : 'transition-opacity duration-[1200ms] ease-in-out'
            } ${isActive ? 'opacity-100' : 'opacity-0'}`}
          />
        );
      })}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-white to-transparent sm:h-28"
      />
      <div
        className="absolute inset-x-0 bottom-16 z-20 flex justify-center sm:bottom-28"
        role="tablist"
        aria-label="Hero photographs"
      >
        <div className="flex items-center gap-1 rounded-full bg-navy-deep/55 px-1.5 py-1 shadow-[0_6px_16px_rgba(20,21,63,0.25)]">
          {heroSlides.map((slide, slideIndex) => {
            const selected = slideIndex === active;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`Show photograph ${slideIndex + 1} of ${COUNT}: ${slide.label}`}
                onClick={() => show(slideIndex)}
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <span
                  className={`block rounded-full bg-white transition-[width] duration-300 ${
                    selected ? 'h-2 w-6' : 'h-2 w-2 bg-white/70'
                  } ${reduce ? 'transition-none' : ''}`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
